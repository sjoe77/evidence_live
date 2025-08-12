import { arrowTableToJSON, getPromise } from './both.js';
import {
	ConsoleLogger,
	createDuckDB,
	DuckDBDataProtocol,
	NODE_RUNTIME,
	VoidLogger
} from '@duckdb/duckdb-wasm/dist/duckdb-node-blocking';
import { createRequire } from 'module';
import path, { dirname, resolve } from 'path';
import { cache_for_hash, get_arrow_if_sql_already_run } from '../cache-duckdb.js';
import { withTimeout } from './both.js';
import { loadSourcePlugins } from '@evidence-dev/sdk/plugins';

const require = createRequire(import.meta.url);
const DUCKDB_DIST = dirname(require.resolve('@duckdb/duckdb-wasm'));

export { tableFromIPC } from 'apache-arrow';

/** @type {import("@duckdb/duckdb-wasm/dist/types/src/bindings/bindings_node_base").DuckDBNodeBindings} */
let db;

/** @type {import("@duckdb/duckdb-wasm/dist/types/src/bindings/connection").DuckDBConnection} */
let connection;

const { resolve: resolveInit, reject: rejectInit, promise: initPromise } = getPromise();
let initializing = false;

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export async function initDB() {
	// If the database is already available, don't do anything
	if (db) return;

	// If the database is already initializing, don't try to do it twice
	// Instead, let the call wait for the initPromise
	if (initializing) return withTimeout(initPromise);

	// This call is the first (to execute), don't let anybody else try
	// to initialize the database
	initializing = true;

	try {
		const DUCKDB_BUNDLES = {
			mvp: {
				mainModule: resolve(DUCKDB_DIST, './duckdb-mvp.wasm'),
				mainWorker: resolve(DUCKDB_DIST, './duckdb-node-mvp.worker.cjs')
			},
			eh: {
				mainModule: resolve(DUCKDB_DIST, './duckdb-eh.wasm'),
				mainWorker: resolve(DUCKDB_DIST, './duckdb-node-eh.worker.cjs')
			}
		};
		const logger = process.env.VITE_EVIDENCE_DEBUG ? new ConsoleLogger() : new VoidLogger();

		// and synchronous database
		db = await createDuckDB(DUCKDB_BUNDLES, logger, NODE_RUNTIME);
		await db.instantiate();
		db.open({
			query: {
				castBigIntToDouble: true,
				castTimestampToDate: true,
				castDecimalToDouble: true,
				castDurationToTime64: true
			}
		});
		connection = db.connect();

		// https://duckdb.org/2024/09/09/announcing-duckdb-110.html#breaking-sql-changes
		await connection.query('SET ieee_floating_point_ops = false;');
		// https://duckdb.org/2024/02/13/announcing-duckdb-0100.html#breaking-sql-changes
		await connection.query('SET old_implicit_casting = true;');

		resolveInit();
	} catch (e) {
		rejectInit(e);
		throw e;
	}
}

/**
 * Updates the duckdb search path to include only the list of included schemas
 * @param {string[]} schemas
 * @returns {void}
 */
export function updateSearchPath(schemas) {
	connection.query(`PRAGMA search_path='${schemas.join(',')}'`);
}

/**
 * @param {string} targetGlob
 */
export async function emptyDbFs(targetGlob) {
	await db.flushFiles();
	for (const f of db.globFiles(targetGlob)) {
		await db.dropFile(f.fileName);
	}
}

/**
 * Adds a new view to the database, pointing to the provided parquet URLs.
 *
 * @param {Record<string, string[]>} urls
 * @param {{ append?: boolean }} [opts]
 * @returns {void}
 */
export async function setParquetURLs(urls, { append } = {}) {
	if (!append) await emptyDbFs('*');

	const pathDelimiterRegex = /[\\/]/;

	if (process.env.VITE_EVIDENCE_DEBUG) console.log(`Updating Parquet URLs`);
	for (const source in urls) {
		connection.query(`CREATE SCHEMA IF NOT EXISTS "${source}";`);
		for (const url of urls[source]) {
			const table = url.split(pathDelimiterRegex).at(-1).slice(0, -'.parquet'.length);
			const file_name = `${source}_${table}.parquet`;
			if (append) {
				await emptyDbFs(file_name);
				await emptyDbFs(url);
			}
			db.registerFileURL(
				file_name,
				url.split(pathDelimiterRegex).join(path.sep),
				DuckDBDataProtocol.NODE_FS,
				false
			);
			connection.query(
				`CREATE OR REPLACE VIEW "${source}"."${table}" AS (SELECT * FROM read_parquet('${file_name}'));`
			);
		}
	}
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @param {Parameters<typeof cache_for_hash>[2]} [cache_options]
 * @returns {Record<string, unknown>[]}
 */
/**
 * Routes SQL queries to appropriate datasources based on -- source: comments
 * @param {string} sql - SQL query string
 * @returns {Promise<import("apache-arrow").Table | null>} - Arrow table or null if not handled
 */
async function routeQueryToDatasource(sql) {
	try {
		// Extract source comment from SQL
		const sourceMatch = sql.match(/--\s*source:\s*(\w+)/i);
		if (!sourceMatch) {
			return null; // No source specified, use DuckDB
		}

		const sourceName = sourceMatch[1];
		console.log(`[Flight SQL Router] Found source: ${sourceName} for query: ${sql.substring(0, 100)}...`);
		
		// Load datasource plugins
		const plugins = await loadSourcePlugins();
		const datasource = plugins.bySource[sourceName];
		
		if (!datasource) {
			console.log(`[Flight SQL Router] No plugin found for source: ${sourceName}`);
			return null;
		}

		console.log(`[Flight SQL Router] Routing to plugin: ${datasource[0]}`);
		
		// Get the plugin runner
		const [pluginPackage, pluginSpec] = datasource;
		const sourceConfig = plugins.sources.find(s => s.name === sourceName);
		
		if (!sourceConfig) {
			console.log(`[Flight SQL Router] No config found for source: ${sourceName}`);
			return null;
		}

		console.log(`[Flight SQL Router] Executing query via ${pluginPackage} plugin...`);
		
		// Get the runner and execute the query
		const runner = await pluginSpec.getRunner(sourceConfig.options, sourceConfig.dir);
		const result = await runner(sql, `${sourceName}.sql`, 100000);
		
		if (result) {
			// For now, just log success and fallback to DuckDB
			// TODO: Convert datasource result to proper Arrow table format
			console.log(`[Flight SQL Router] Query executed successfully via datasource plugin`);
			console.log(`[Flight SQL Router] Falling back to DuckDB for Arrow table conversion`);
		}
		
		return null; // Always fallback for now until Arrow conversion is implemented
	} catch (error) {
		console.error(`[Flight SQL Router] Error routing query:`, error);
		return null;
	}
}

export async function query(sql, cache_options) {
	let result;

	// only cache during build, because
	// parquet can/will eventually change during dev
	if (cache_options?.prerendering) {
		result = get_arrow_if_sql_already_run(sql);
	}

	// TODO: This just fails, where is the process going?
	// if cache missed, fallback to querying
	if (!result) {
		// Check if this is a Flight SQL query that should route to datasources
		result = await routeQueryToDatasource(sql);
		
		// If no datasource handled it, fall back to DuckDB
		if (!result) {
			result = connection.query(sql);
		}
	}

	if (cache_options) {
		cache_for_hash(sql, result, cache_options);
	}

	return arrowTableToJSON(result);
}

export { arrowTableToJSON };
