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

export const ssr = true; // Force SSR to enable server-side Flight SQL queries
export const prerender = false; // Disable prerendering - all pages require authentication
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

/** @type {Map<string, any[]>} Global cache for Flight SQL query results */
const flightSqlQueryCache = new Map();

/** @type {Record<string, any[]>} Store server-side results for browser serialization */
let serverSideFlightSqlResults = {};

// Create a global cache that survives SSR→browser transition
if (typeof globalThis !== 'undefined') {
	if (!globalThis.__EVIDENCE_FLIGHT_SQL_CACHE__) {
		globalThis.__EVIDENCE_FLIGHT_SQL_CACHE__ = {};
	}
	if (!globalThis.__EVIDENCE_FLIGHT_SQL_PROMISES__) {
		globalThis.__EVIDENCE_FLIGHT_SQL_PROMISES__ = {};
	}
}

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({ fetch, route, params, url, data }) => {
	console.log(`[LAYOUT LOAD] Server data available:`, !!data);
	
	const oauthHeaders = data?.oauthHeaders || {};
	console.log(`[LAYOUT LOAD] OAuth headers from server:`, Object.keys(oauthHeaders));
	
	// Log OAuth header availability for debugging
	if (Object.keys(oauthHeaders).length > 0) {
		console.log(`[LAYOUT LOAD] ✅ OAuth headers received from server-side load function`);
	} else {
		console.log(`[LAYOUT LOAD] ⚠️  No OAuth headers available - server should have returned 401`);
	}
	// Construct actual route path by replacing parameters in route.id
	// Handle null/undefined route.id early
	let actualRoute = route.id || url.pathname || '/';
	
	console.log(`\n🛣️  [ROUTE PROCESSING] Starting route processing`);
	console.log(`[ROUTE PROCESSING] Initial route.id: "${route.id}"`);
	console.log(`[ROUTE PROCESSING] URL pathname: "${url.pathname}"`);
	console.log(`[ROUTE PROCESSING] Params object: ${JSON.stringify(params, null, 2)}`);
	console.log(`[ROUTE PROCESSING] Params count: ${Object.keys(params || {}).length}`);
	
	// Early exit for static files and service worker requests
	if (url.pathname.endsWith('.js') || url.pathname.endsWith('.json') || url.pathname.includes('manifest') || url.pathname.includes('service-worker')) {
		console.log(`[ROUTE PROCESSING] 🔧 Static file request detected: ${url.pathname} - skipping route processing`);
		actualRoute = url.pathname;
	}
	
	// Handle parameter replacement more robustly
	if (params && Object.keys(params).length > 0) {
		console.log(`[ROUTE PROCESSING] 🔄 Processing ${Object.keys(params).length} parameters`);
		
		for (const [key, value] of Object.entries(params)) {
			console.log(`[ROUTE PROCESSING] Processing param: ${key} = "${value}" (type: ${typeof value})`);
			
			if (value && value !== 'null' && value !== 'undefined') {
				const beforeReplace = actualRoute;
				actualRoute = actualRoute.replace(`[${key}]`, value);
				console.log(`[ROUTE PROCESSING] ✅ Replaced [${key}] with "${value}"`);
				console.log(`[ROUTE PROCESSING]    Before: "${beforeReplace}"`);
				console.log(`[ROUTE PROCESSING]    After:  "${actualRoute}"`);
			} else {
				console.log(`[ROUTE PROCESSING] ⚠️  Skipping invalid parameter: ${key} = "${value}"`);
			}
		}
	} else {
		console.log(`[ROUTE PROCESSING] ℹ️  No parameters to process (static route)`);
	}
	
	// Validate the final route
	console.log(`[ROUTE PROCESSING] 🔍 Validating final route: "${actualRoute}"`);
	console.log(`[ROUTE PROCESSING] Route is null/undefined: ${actualRoute == null}`);
	console.log(`[ROUTE PROCESSING] Is empty/falsy: ${!actualRoute}`);
	
	// Safe checks for string content (only if actualRoute is a string)
	if (actualRoute && typeof actualRoute === 'string') {
		console.log(`[ROUTE PROCESSING] Contains brackets: ${actualRoute.includes('[')}`);
		console.log(`[ROUTE PROCESSING] Contains 'null': ${actualRoute.includes('null')}`);
		console.log(`[ROUTE PROCESSING] Contains 'undefined': ${actualRoute.includes('undefined')}`);
	} else {
		console.log(`[ROUTE PROCESSING] actualRoute is not a valid string, will use fallback`);
	}
	
	// Ensure we have a valid route path (no null, undefined, or bracket params)
	if (!actualRoute || typeof actualRoute !== 'string' || actualRoute.includes('[') || actualRoute.includes('null') || actualRoute.includes('undefined')) {
		console.log(`❌ [ROUTE PROCESSING] Invalid route detected, using fallback`);
		console.log(`[ROUTE PROCESSING] Fallback: route.id="${route.id}" or "index"`);
		actualRoute = route.id || 'index';
		console.log(`[ROUTE PROCESSING] Applied fallback: "${actualRoute}"`);
	}
	
	console.log(`✅ [ROUTE PROCESSING] Final actualRoute: "${actualRoute}"\n`);
	
	const [{ customFormattingSettings }, pagesManifest, evidencemeta] = await Promise.all([
		fetch(addBasePath('/api/customFormattingSettings.json/GET.json')).then((x) => x.json()),
		fetch(addBasePath('/api/pagesManifest.json')).then((x) => x.json()),
		fetch(addBasePath(`/api/${actualRoute}/evidencemeta.json`))
			.then((x) => x.json())
			.catch((error) => {
				console.log(`[ROUTE DEBUG] evidencemeta.json fetch failed for ${actualRoute}:`, error.message);
				return { queries: [] };
			})
	]);

	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}\x1F${value}`)
			.join('\x1E')
	);

	// 🔥🔥🔥 FLIGHT SQL DATASOURCE ROUTER 🔥🔥🔥
	async function routeToFlightSQL(sql, query_name, isBuilding, passedOauthHeaders = {}) {
		// Use OAuth headers from server-side load function if available
		const finalOauthHeaders = Object.keys(oauthHeaders).length > 0 ? oauthHeaders : passedOauthHeaders;
		try {
			console.log(`[FLIGHT SQL ROUTER] Attempting to route Flight SQL query...`);
			
			if (browser) {
				// 🔥 BROWSER-SIDE FLIGHT SQL EXECUTION 🔥
				console.log(`[FLIGHT SQL ROUTER] Browser should not call routeToFlightSQL directly - use fetch('/query') instead`);
				throw new Error('Browser should use fetch(\'/query\') for Flight SQL requests, not routeToFlightSQL');
			} else {
				// 🔥 SERVER-SIDE FLIGHT SQL CONNECTOR 🔥
				console.log(`[FLIGHT SQL ROUTER] Executing on server with Flight SQL connector...`);
				
				// Check OAuth headers BEFORE making request
				const headerCount = Object.keys(finalOauthHeaders).length;
				if (headerCount === 0) {
					console.log(`[FLIGHT SQL ROUTER] ⚠️  No OAuth headers - proceeding anyway (auth suppressed in ducklake)`);
				} else {
					console.log(`[FLIGHT SQL ROUTER] ✅ Found ${headerCount} OAuth headers for HTTP middleware authentication`);
					console.log(`[FLIGHT SQL ROUTER] Using OAuth headers:`, Object.keys(finalOauthHeaders));
				}
				
				const flightSqlConnector = await import('@evidence-dev/flight-sql-http');
				console.log(`[FLIGHT SQL ROUTER] Flight SQL connector loaded successfully!`);
				
				const result = await flightSqlConnector.default(sql, { 
					mock: false,  // Use real Flight SQL HTTP endpoint
					query_name,
					endpoint: 'http://localhost:4180/query',  // Your working ducklake endpoint
					headers: finalOauthHeaders  // Pass OAuth headers extracted from proxy request
				});
				console.log(`🔥🔥🔥 [FLIGHT SQL ROUTER] Query executed successfully! Rows: ${result.data?.length || result.length} 🔥🔥🔥`);
				
				// Extract data array but preserve Evidence-required properties
				const resultData = result.data || result;
				
				// Evidence components expect rowCount property on the data array itself
				if (result.rowCount !== undefined && Array.isArray(resultData)) {
					resultData.rowCount = result.rowCount;
				}
				if (result.columnTypes && Array.isArray(resultData)) {
					resultData.columnTypes = result.columnTypes;
				}
				
				// No caching needed - both server and browser execute directly
				
				return resultData;  // Return data array
			}
		} catch (error) {
			console.error(`❌ [FLIGHT SQL ROUTER] Error executing query:`, error.message);
			// Return empty result instead of throwing to prevent server crashes
			console.log(`[FLIGHT SQL ROUTER] Returning empty result due to error`);
			return [];
		}
	}

	const isUserPage =
		route.id && system_routes.every((system_route) => !route.id.startsWith(system_route));

	/** @type {App.PageData["data"]} */
	let pageData = {};

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
		pageData = await getPrerenderedQueries(routeHash, paramsHash, fetch);
	}

	/** @type {App.PageData["__db"]["query"]} */
	function query(sql, { query_name, callback = (x) => x } = {}) {
		// 🔥🔥🔥 DATASOURCE ROUTING LOGIC 🔥🔥🔥
		console.log(`\n🚀🚀🚀 [LAYOUT QUERY] Executing query: ${query_name || 'unnamed'} 🚀🚀🚀`);
		console.log(`[LAYOUT QUERY] SQL: ${sql.substring(0, 200)}...`);
		
		// Check for -- source: comment to route to datasource plugins
		const sourceMatch = sql.match(/--\s*source:\s*(\w+)/i);
		// 🔥 SINGLE SOURCE OF TRUTH: evidence.config.yaml controls mock vs real 🔥
		const defaultDataSource = (typeof process !== 'undefined' && process.env?.EVIDENCE_DEFAULT_DATASOURCE) || 'flight_sql';
		const sourceName = sourceMatch ? sourceMatch[1] : defaultDataSource;
		
		console.log(`🔥🔥🔥 [LAYOUT QUERY] DATASOURCE: ${sourceName} ${sourceMatch ? '(explicit)' : '(default)'} 🔥🔥🔥`);
		console.log(`[Flight SQL Router] Using source: ${sourceName} for query: ${sql.substring(0, 100)}...`);
		
		// 🔥 DISABLE SERVER-SIDE FLIGHT SQL TO PREVENT CRASHES 🔥
		// Force all Flight SQL queries to execute in browser to avoid CommonJS/ESM issues
		if (!browser && (sourceName === 'flight_sql_mock' || sourceName === 'flight_sql')) {
			console.log(`[LAYOUT QUERY] Skipping server-side Flight SQL - will execute in browser instead`);
			// Return empty array for server-side, browser will handle the real query
			return callback([]);
		} else if (!browser && sourceName !== 'flight_sql_mock' && sourceName !== 'flight_sql') {
			console.log(`[LAYOUT QUERY] Using ${sourceName} datasource (not Flight SQL) - falling back to DuckDB`);
		}
		
		if (browser) {
			return (async () => {
				// 🔥 BROWSER FLIGHT SQL EXECUTION THROUGH OAUTH PROXY 🔥
				if (sourceName === 'flight_sql_mock' || sourceName === 'flight_sql') {
					console.log(`[BROWSER FLIGHT SQL] Executing query through OAuth proxy: ${query_name}`);
					
					// Browser requests must go through OAuth proxy for authentication
					// Make HTTP request to /query endpoint which will route through OAuth proxy
					try {
						console.log(`[BROWSER FLIGHT SQL] Making authenticated request through OAuth proxy...`);
						
						const response = await fetch(`http://localhost:4180/query?q=${encodeURIComponent(sql)}`, {
							method: 'GET'
							// OAuth proxy handles authentication (currently suppressed)
						});
						
						if (!response.ok) {
							throw new Error(`HTTP ${response.status}: ${response.statusText}`);
						}
						
						const responseData = await response.json();
						console.log(`✅ [BROWSER FLIGHT SQL] Query executed successfully: ${query_name}, rows: ${responseData.results?.length || 0}`);
						
						// Transform DuckLake format (arrays) to Evidence format (objects)
						const { columns, results } = responseData;
						const transformedResults = results.map(row => {
							const obj = {};
							columns.forEach((col, index) => {
								obj[col] = row[index];
							});
							return obj;
						});
						
						console.log(`[BROWSER FLIGHT SQL] Transformed data:`, transformedResults.slice(0, 3));
						return callback(transformedResults);
					} catch (error) {
						console.error(`❌ [BROWSER FLIGHT SQL] Query failed: ${query_name}`, error);
						return callback([]);
					}
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

	// Simple approach: no caching complexity needed
	const finalPageData = pageData;

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
		data: finalPageData, // Include Flight SQL results for browser hydration
		customFormattingSettings,
		isUserPage,
		evidencemeta,
		pagesManifest
	});
};
