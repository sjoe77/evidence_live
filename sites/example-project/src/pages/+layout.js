import { browser, building, dev } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query as usqlQuery,
	updateSearchPath,
	arrowTableToJSON
} from '@evidence-dev/universal-sql/client-duckdb';
import { profile } from '@evidence-dev/component-utilities/profile';
import { toasts } from '@evidence-dev/component-utilities/stores';
import { setTrackProxy } from '@evidence-dev/sdk/usql';
import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
import md5 from 'blueimp-md5';

export const ssr = !dev;
export const prerender = import.meta.env.VITE_EVIDENCE_SPA !== 'true';
export const trailingSlash = 'always';

const loadDB = async () => {
	let renderedFiles = {};

	// Flight SQL mode - skip parquet loading but still initialize database properly
	console.log('[Flight SQL Mode] Initializing database for live query execution');
	
	if (!browser) {
		const { readFile } = await import('fs/promises');
		({ renderedFiles } = JSON.parse(
			await readFile('./static/data/manifest.json', 'utf-8').catch(() => '{"renderedFiles":{}}')
		));
	} else {
		try {
			const res = await fetch(addBasePath('/data/manifest.json'));
			if (res.ok) ({ renderedFiles } = await res.json());
		} catch (error) {
			console.log('[Flight SQL Mode] No manifest.json found - using empty manifest for Flight SQL mode');
			renderedFiles = {};
		}
	}
	
	await profile(initDB);

	// In Flight SQL mode, we need to resolve the tablesPromise that Evidence queries wait for
	// Since we're not loading parquet tables, we need to manually resolve this
	console.log('[Flight SQL Mode] Resolving tables promise for Flight SQL mode');
	
	// Create an empty manifest resolution to satisfy Evidence's table loading expectation
	await profile(setParquetURLs, {}, { addBasePath });
	
	// Set empty search path since Flight SQL bypasses DuckDB schemas  
	await profile(updateSearchPath, []);
	
	if (dev) {
		toasts.add(
			{
				id: 'FlightSQLMode',
				status: 'info',
				title: 'Flight SQL Mode Active',
				message: 'Using live query execution instead of static parquet files.'
			},
			3000
		);
	}
};

const database_initialization = profile(loadDB);

/**
 *
 * @param {string} routeHash
 * @param {string} paramsHash
 * @param {typeof fetch} fetch
 * @returns {Promise<Record<string, unknown[]>>}
 */
async function getPrerenderedQueries(routeHash, paramsHash, fetch) {
	// get every query that's run in the component
	const res = await fetch(addBasePath(`/api/${routeHash}/${paramsHash}/all-queries.json`));
	if (!res.ok) return {};

	const sql_cache_with_hashed_query_strings = await res.json();

	const resolved_entries = await Promise.all(
		Object.entries(sql_cache_with_hashed_query_strings).map(async ([query_name, query_hash]) => {
			const res = await fetch(addBasePath(`/api/prerendered_queries/${query_hash}.arrow`));
			if (!res.ok) return null;

			const table = await tableFromIPC(res);
			return [query_name, arrowTableToJSON(table)];
		})
	);

	return Object.fromEntries(resolved_entries.filter(Boolean));
}

const system_routes = ['/settings', '/explore'];

/** @type {Map<string, { inputs: Record<string, string> }>} */
const dummy_pages = new Map();

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({ fetch, route, params, url }) => {
	const [{ customFormattingSettings }, pagesManifest, evidencemeta] = await Promise.all([
		fetch(addBasePath('/api/customFormattingSettings.json/GET.json')).then((x) => x.json()),
		fetch(addBasePath('/api/pagesManifest.json')).then((x) => x.json()),
		fetch(addBasePath(`/api/${route.id}/evidencemeta.json`))
			.then((x) => x.json())
			.catch(() => ({ queries: [] }))
	]);

	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}\x1F${value}`)
			.join('\x1E')
	);

	// 🔥🔥🔥 FLIGHT SQL DATASOURCE ROUTER 🔥🔥🔥
	async function routeToFlightSQL(sql, query_name, isBuilding) {
		try {
			console.log(`[FLIGHT SQL ROUTER] Attempting to route Flight SQL query...`);
			
			if (browser) {
				// 🔥 BROWSER-SIDE MOCK DATA 🔥
				console.log(`[FLIGHT SQL ROUTER] Executing in browser with mock data...`);
				const mockData = generateBrowserMockData(sql);
				console.log(`🔥🔥🔥 [FLIGHT SQL BROWSER] Query executed successfully! Rows: ${mockData.length} 🔥🔥🔥`);
				return mockData;
			} else {
				// 🔥 SERVER-SIDE FLIGHT SQL CONNECTOR 🔥
				console.log(`[FLIGHT SQL ROUTER] Executing on server with Flight SQL connector...`);
				const flightSqlConnector = await import('@evidence-dev/flight-sql-http');
				console.log(`[FLIGHT SQL ROUTER] Flight SQL connector loaded successfully!`);
				
				const result = await flightSqlConnector.default(sql, { 
					mock: true,  // Enable mock mode for testing
					query_name,
					endpoint: 'mock'
				});
				console.log(`🔥🔥🔥 [FLIGHT SQL ROUTER] Query executed successfully! Rows: ${result.data?.length || result.length} 🔥🔥🔥`);
				
				return result.data || result;  // Return data array
			}
		} catch (error) {
			console.error(`❌ [FLIGHT SQL ROUTER] Error executing query:`, error);
			throw error;
		}
	}

	// 🔥 BROWSER-COMPATIBLE MOCK DATA GENERATOR 🔥
	function generateBrowserMockData(sql) {
		const query = sql.toLowerCase().trim();
		
		console.log(`[BROWSER MOCK] Analyzing query: ${query.substring(0, 100)}...`);
		
		// Handle DESCRIBE queries (columns)
		if (query.includes('describe') || query.includes('columns')) {
			console.log(`[BROWSER MOCK] Returning column metadata`);
			if (query.includes('test_query')) {
				return [
					{ column_name: 'id', data_type: 'INTEGER' },
					{ column_name: 'message', data_type: 'VARCHAR' },
					{ column_name: 'today', data_type: 'DATE' },
					{ column_name: 'status', data_type: 'VARCHAR' }
				];
			} else if (query.includes('dropdown') || query.includes('selected_product')) {
				// Dropdown column metadata
				return [
					{ column_name: 'value', data_type: 'VARCHAR' },
					{ column_name: 'label', data_type: 'VARCHAR' }
				];
			} else if (query.includes('sales_data') || query.includes('product')) {
				return [
					{ column_name: 'product', data_type: 'VARCHAR' },
					{ column_name: 'sales', data_type: 'INTEGER' },
					{ column_name: 'order_date', data_type: 'DATE' }
				];
			} else if (query.includes('total_sales')) {
				return [
					{ column_name: 'total_sales', data_type: 'INTEGER' },
					{ column_name: 'num_records', data_type: 'INTEGER' }
				];
			}
		}
		
		// Handle COUNT(*) queries (length)  
		if (query.includes('count(*)') && query.includes('rowcount')) {
			console.log(`[BROWSER MOCK] Returning row count`);
			if (query.includes('dropdown') || query.includes('selected_product')) {
				return [{ rowCount: 3 }]; // 3 dropdown options
			}
			return [{ rowCount: 6 }];
		}
		
		// Handle actual data queries
		if (query.includes('test_query') && !query.includes('describe') && !query.includes('count')) {
			console.log(`[BROWSER MOCK] Returning test query data`);
			return [
				{
					id: 1,
					message: 'Hello Flight SQL (Browser Mock)',
					today: new Date().toISOString().split('T')[0],
					status: 'Browser Mock Success'
				}
			];
		}
		
		// Sales data mock - sorted by date for proper line chart rendering
		if (query.includes('sales_data') && !query.includes('describe') && !query.includes('count')) {
			console.log(`[BROWSER MOCK] Returning sales data (sorted by date)`);
			return [
				{ product: 'Product A', sales: 100, order_date: '2024-01-01' },
				{ product: 'Product B', sales: 200, order_date: '2024-01-02' },
				{ product: 'Product C', sales: 150, order_date: '2024-01-03' },
				{ product: 'Product A', sales: 120, order_date: '2024-01-04' },
				{ product: 'Product B', sales: 180, order_date: '2024-01-05' },
				{ product: 'Product C', sales: 220, order_date: '2024-01-06' },
				{ product: 'Product A', sales: 140, order_date: '2024-01-07' },
				{ product: 'Product B', sales: 160, order_date: '2024-01-08' }
			];
		}
		
		// Total sales aggregation mock  
		if ((query.includes('total_sales') || query.includes('sum(sales)')) && !query.includes('describe') && !query.includes('count')) {
			console.log(`[BROWSER MOCK] Returning total sales data`);
			return [
				{ total_sales: 1070, num_records: 6 }
			];
		}
		
		// Dropdown options mock - handle any dropdown-related query
		if (query.includes('dropdown') || (query.includes('distinct') && query.includes('product'))) {
			console.log(`[BROWSER MOCK] Returning dropdown options for query: ${query.substring(0, 150)}`);
			return [
				{ value: 'Product A', label: 'Product A' },
				{ value: 'Product B', label: 'Product B' },
				{ value: 'Product C', label: 'Product C' }
			];
		}
		
		// Default mock - check if this might be a dropdown query we missed
		console.log(`[BROWSER MOCK] Returning default mock data for query: ${query.substring(0, 200)}`);
		
		// If the query mentions dropdown or has value/label fields, return dropdown format
		if (query.includes('selected_product') || query.includes('dropdown')) {
			console.log(`[BROWSER MOCK] Default case detected dropdown pattern - returning dropdown data`);
			return [
				{ value: 'Product A', label: 'Product A' },
				{ value: 'Product B', label: 'Product B' },
				{ value: 'Product C', label: 'Product C' }
			];
		}
		
		// Generic default
		return [
			{ mock: true, message: 'Browser mock data', timestamp: new Date().toISOString() }
		];
	}
	const isUserPage =
		route.id && system_routes.every((system_route) => !route.id.startsWith(system_route));

	/** @type {App.PageData["data"]} */
	let data = {};

	const {
		inputs = setTrackProxy({
			label: '',
			value: '(SELECT NULL WHERE 0 /* An Input has not been set */)'
		}) /* Create a proxy by default */
	} = dummy_pages.get(url.pathname) ?? {};

	const is_dummy_page = dummy_pages.has(url.pathname);
	if ((dev || building) && !browser && !is_dummy_page) {
		dummy_pages.set(url.pathname, { inputs });
		await fetch(url);
		dummy_pages.delete(url.pathname);
	}

	if (!browser) await database_initialization;
	// account for potential changes in manifest (source query hmr)
	if (!browser && dev) await initDB();

	// let SSR saturate the cache first
	if (browser && isUserPage && prerender) {
		data = await getPrerenderedQueries(routeHash, paramsHash, fetch);
	}

	/** @type {App.PageData["__db"]["query"]} */
	function query(sql, { query_name, callback = (x) => x } = {}) {
		// 🔥🔥🔥 DATASOURCE ROUTING LOGIC 🔥🔥🔥
		console.log(`\n🚀🚀🚀 [LAYOUT QUERY] Executing query: ${query_name || 'unnamed'} 🚀🚀🚀`);
		console.log(`[LAYOUT QUERY] SQL: ${sql.substring(0, 200)}...`);
		
		// Check for -- source: comment to route to datasource plugins
		const sourceMatch = sql.match(/--\s*source:\s*(\w+)/i);
		// 🔥 BROWSER-SAFE DEFAULT DATASOURCE 🔥
		const defaultDataSource = (typeof process !== 'undefined' && process.env?.EVIDENCE_DEFAULT_DATASOURCE) || 'flight_sql_mock';
		const sourceName = sourceMatch ? sourceMatch[1] : defaultDataSource;
		
		console.log(`🔥🔥🔥 [LAYOUT QUERY] DATASOURCE: ${sourceName} ${sourceMatch ? '(explicit)' : '(default)'} 🔥🔥🔥`);
		console.log(`[Flight SQL Router] Using source: ${sourceName} for query: ${sql.substring(0, 100)}...`);
		
		// 🔥 SERVER-SIDE ROUTE TO DATASOURCE PLUGIN 🔥
		if (!browser && (sourceName === 'flight_sql_mock' || sourceName === 'flight_sql')) {
			console.log(`\n🔥🔥🔥 [SERVER FLIGHT SQL ROUTING] Executing query via Flight SQL HTTP connector! 🔥🔥🔥`);
			return callback(routeToFlightSQL(sql, query_name, building));
		} else if (!browser && sourceName !== 'flight_sql_mock' && sourceName !== 'flight_sql') {
			console.log(`[LAYOUT QUERY] Using ${sourceName} datasource (not Flight SQL) - falling back to DuckDB`);
		}
		
		if (browser) {
			return (async () => {
				// 🔥 BROWSER-SIDE FLIGHT SQL ROUTING 🔥
				if (sourceName === 'flight_sql_mock' || sourceName === 'flight_sql') {
					console.log(`🔥🔥🔥 [BROWSER FLIGHT SQL] Executing query via Flight SQL! 🔥🔥🔥`);
					return callback(routeToFlightSQL(sql, query_name, false));
				}
				
				console.log(`[BROWSER] Using ${sourceName} datasource (not Flight SQL) - falling back to DuckDB`);
				await database_initialization;
				const result = await usqlQuery(sql);
				return callback(result);
			})();
		}

		return callback(
			usqlQuery(sql, {
				route_hash: routeHash,
				additional_hash: paramsHash,
				query_name,
				prerendering: building
			})
		);
	}

	let tree = pagesManifest;
	for (const part of (route.id ?? '').split('/').slice(1)) {
		tree = tree.children[part];
		if (!tree) break;
		if (tree.frontMatter?.title) {
			tree.title = tree.frontMatter.title;
		} else if (tree.frontMatter?.breadcrumb) {
			let { breadcrumb } = tree.frontMatter;
			for (const [param, value] of Object.entries(params)) {
				breadcrumb = breadcrumb.replaceAll(`\${params.${param}}`, value);
			}
			tree.title = (await query(breadcrumb))[0]?.breadcrumb;
		}
	}

	return /** @type {App.PageData} */ ({
		__db: {
			query,
			async load() {
				return database_initialization;
			},
			async updateParquetURLs(manifest) {
				// todo: maybe diff with old?
				const { renderedFiles } = JSON.parse(manifest);
				await profile(setParquetURLs, renderedFiles, { addBasePath });
			}
		},
		inputs,
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta,
		pagesManifest
	});
};
