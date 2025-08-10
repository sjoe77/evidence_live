const {
	EvidenceType,
	TypeFidelity,
	asyncIterableToBatchedAsyncGenerator,
	cleanQuery,
	exhaustStream
} = require('@evidence-dev/db-commons');
const fetch = require('node-fetch');

/**
 * Mock data generator for testing
 * @param {string} queryString - SQL query string
 * @returns {Object} Mock response data
 */
function generateMockResponse(queryString) {
	const query = queryString.toLowerCase().trim();
	
	// Test query mock
	if (query.includes('hello flight sql') || query.includes('select 1')) {
		return {
			data: [
				{
					id: 1,
					message: 'Hello Flight SQL (Mock)',
					today: new Date().toISOString().split('T')[0],
					status: 'Mock Success'
				}
			],
			columns: [
				{ name: 'id', type: 'INTEGER' },
				{ name: 'message', type: 'VARCHAR' },
				{ name: 'today', type: 'DATE' },
				{ name: 'status', type: 'VARCHAR' }
			],
			rowCount: 1
		};
	}
	
	// Sales data mock
	if (query.includes('product') && query.includes('sales')) {
		return {
			data: [
				{ product: 'Product A', sales: 100, date: '2024-01-01' },
				{ product: 'Product B', sales: 200, date: '2024-01-02' },
				{ product: 'Product C', sales: 150, date: '2024-01-03' },
				{ product: 'Product A', sales: 120, date: '2024-01-04' },
				{ product: 'Product B', sales: 180, date: '2024-01-05' },
				{ product: 'Product C', sales: 220, date: '2024-01-06' }
			],
			columns: [
				{ name: 'product', type: 'VARCHAR' },
				{ name: 'sales', type: 'INTEGER' },
				{ name: 'date', type: 'DATE' }
			],
			rowCount: 6
		};
	}
	
	// Aggregation query mock
	if (query.includes('sum') || query.includes('count')) {
		return {
			data: [
				{
					total_sales: 970,
					num_records: 6,
					avg_sales: 161.67
				}
			],
			columns: [
				{ name: 'total_sales', type: 'INTEGER' },
				{ name: 'num_records', type: 'INTEGER' },
				{ name: 'avg_sales', type: 'DOUBLE' }
			],
			rowCount: 1
		};
	}
	
	// Default mock response
	return {
		data: [
			{
				col1: 'Mock Data',
				col2: 123,
				col3: new Date().toISOString().split('T')[0]
			}
		],
		columns: [
			{ name: 'col1', type: 'VARCHAR' },
			{ name: 'col2', type: 'INTEGER' },
			{ name: 'col3', type: 'DATE' }
		],
		rowCount: 1
	};
}

/**
 * Converts BigInt values to Numbers in an object.
 * @param {Record<string, unknown>} obj - The input object with potential BigInt values.
 * @returns {Record<string, unknown>} - The object with BigInt values converted to Numbers.
 */
function standardizeRow(obj) {
	for (const key in obj) {
		if (typeof obj[key] === 'bigint') {
			obj[key] = Number(obj[key]);
		}
	}
	return obj;
}

/**
 * Map SQL types to Evidence types
 * @param {string} sqlType - SQL type from Flight SQL response
 * @returns {EvidenceType}
 */
function mapSqlTypeToEvidence(sqlType) {
	if (!sqlType) return EvidenceType.STRING;
	
	const typeUpper = sqlType.toUpperCase();
	
	// Handle decimal types
	if (typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC')) {
		return EvidenceType.NUMBER;
	}
	
	// Map common SQL types
	const typeMap = {
		'INTEGER': EvidenceType.NUMBER,
		'BIGINT': EvidenceType.NUMBER,
		'SMALLINT': EvidenceType.NUMBER,
		'TINYINT': EvidenceType.NUMBER,
		'DOUBLE': EvidenceType.NUMBER,
		'FLOAT': EvidenceType.NUMBER,
		'REAL': EvidenceType.NUMBER,
		'VARCHAR': EvidenceType.STRING,
		'TEXT': EvidenceType.STRING,
		'CHAR': EvidenceType.STRING,
		'STRING': EvidenceType.STRING,
		'DATE': EvidenceType.DATE,
		'TIMESTAMP': EvidenceType.DATE,
		'TIMESTAMP WITH TIME ZONE': EvidenceType.DATE,
		'TIMESTAMP_S': EvidenceType.DATE,
		'TIMESTAMP_MS': EvidenceType.DATE,
		'TIMESTAMP_NS': EvidenceType.DATE,
		'BOOLEAN': EvidenceType.BOOLEAN,
		'BOOL': EvidenceType.BOOLEAN
	};
	
	return typeMap[typeUpper] || EvidenceType.STRING;
}

/**
 * Infer Evidence type from data value
 * @param {unknown} data
 * @returns {EvidenceType | undefined}
 */
function nativeTypeToEvidenceType(data) {
	switch (typeof data) {
		case 'number':
			return EvidenceType.NUMBER;
		case 'string':
			return EvidenceType.STRING;
		case 'boolean':
			return EvidenceType.BOOLEAN;
		case 'object':
			if (data instanceof Date) {
				return EvidenceType.DATE;
			}
			// Handle ISO date strings
			if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}/.test(data)) {
				return EvidenceType.DATE;
			}
			return EvidenceType.STRING;
		default:
			return EvidenceType.STRING;
	}
}

/**
 * Map result rows to Evidence column types by inspecting data
 * @param {Record<string, unknown>[]} rows
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[]}
 */
const mapResultsToEvidenceColumnTypes = function (rows) {
	if (!rows || rows.length === 0) return [];
	
	return Object.entries(rows[0]).map(([name, value]) => {
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(value);
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return { name, evidenceType, typeFidelity };
	});
};

/**
 * Execute SQL query via Flight SQL HTTP middleware
 * @param {string} queryString - SQL query to execute
 * @param {FlightSqlHttpOptions} options - Connection options
 * @param {number} batchSize - Batch size for results (unused for HTTP)
 * @returns {Promise} Query results in Evidence format
 */
/** @type {import("@evidence-dev/db-commons").RunQuery<FlightSqlHttpOptions>} */
const runQuery = async (queryString, options = {}, batchSize = 100000) => {
	const isMockMode = options.mock === true || options.endpoint === 'mock' || 
					   process.env.FLIGHT_SQL_MOCK === 'true';
	
	console.log(`[Flight SQL${isMockMode ? ' MOCK' : ''}] Executing query: ${queryString.substring(0, 100)}${queryString.length > 100 ? '...' : ''}`);
	
	const startTime = Date.now();
	
	try {
		let result;
		
		if (isMockMode) {
			// Mock mode - simulate query delay and return mock data
			await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15)); // 5-20ms delay
			result = generateMockResponse(queryString);
			console.log(`[Flight SQL MOCK] Query completed in ${Date.now() - startTime}ms, ${result.data?.length || 0} rows (mock data)`);
		} else {
			// Real HTTP mode
			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					sql: queryString,
					timeout: options.timeout || 30000
				})
			};

			// Add authentication if provided
			if (options.auth) {
				requestOptions.headers['Authorization'] = options.auth;
			}

			const response = await fetch(options.endpoint, requestOptions);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
			}

			result = await response.json();
			const duration = Date.now() - startTime;
			
			console.log(`[Flight SQL] Query completed in ${duration}ms, ${result.data?.length || 0} rows`);
		}

		// Ensure we have data and columns
		const rows = result.data || [];
		const columns = result.columns || [];

		// Standardize rows (convert BigInt to Number)
		const standardizedRows = rows.map(standardizeRow);

		// Map column types
		let columnTypes;
		if (columns.length > 0) {
			// Use column metadata from response
			columnTypes = columns.map(col => ({
				name: col.name,
				evidenceType: mapSqlTypeToEvidence(col.type),
				typeFidelity: TypeFidelity.PRECISE
			}));
		} else if (standardizedRows.length > 0) {
			// Infer types from first row
			columnTypes = mapResultsToEvidenceColumnTypes(standardizedRows);
		} else {
			columnTypes = [];
		}

		// Create async generator for compatibility with Evidence's streaming interface
		async function* rowGenerator() {
			for (const row of standardizedRows) {
				yield row;
			}
		}

		const results = await asyncIterableToBatchedAsyncGenerator(rowGenerator(), batchSize, {
			standardizeRow: (row) => row, // Already standardized
			closeConnection: () => Promise.resolve()
		});

		results.columnTypes = columnTypes;
		results.expectedRowCount = result.rowCount || standardizedRows.length;

		return results;

	} catch (error) {
		const duration = Date.now() - startTime;
		console.error(`[Flight SQL] Query failed after ${duration}ms:`, error.message);
		throw error;
	}
};

/**
 * @typedef {Object} FlightSqlHttpOptions
 * @property {string} endpoint - HTTP endpoint URL for Flight SQL queries
 * @property {number} [timeout] - Query timeout in milliseconds
 * @property {string} [auth] - Authorization header value
 */

/** @type {import("@evidence-dev/db-commons").GetRunner<FlightSqlHttpOptions>} */
module.exports.getRunner = async (opts, directory) => {
	if (!opts.endpoint) {
		console.error(`Missing required flight-sql-http option 'endpoint' (${directory})`);
		throw new Error('Missing required option: endpoint');
	}

	console.log(`[Flight SQL] Initializing datasource with endpoint: ${opts.endpoint}`);

	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		if (queryPath.endsWith('initialize.sql')) return null;
		
		return runQuery(queryContent, opts, batchSize);
	};
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<FlightSqlHttpOptions>} */
module.exports.testConnection = async (opts, directory) => {
	const isMockMode = opts.mock === true || opts.endpoint === 'mock' || 
					   process.env.FLIGHT_SQL_MOCK === 'true';
	
	console.log(`[Flight SQL${isMockMode ? ' MOCK' : ''}] Testing connection to ${opts.endpoint}`);
	
	try {
		const result = await runQuery('SELECT 1 as test', opts);
		await exhaustStream(result);
		console.log(`[Flight SQL${isMockMode ? ' MOCK' : ''}] Connection test successful`);
		return true;
	} catch (error) {
		console.error(`[Flight SQL${isMockMode ? ' MOCK' : ''}] Connection test failed:`, error.message);
		if (isMockMode) {
			return { reason: 'Mock mode connection test failed - check mock configuration' };
		}
		if (error.message.includes('ECONNREFUSED')) {
			return { reason: 'Cannot connect to Flight SQL endpoint - is the server running?' };
		}
		if (error.message.includes('404')) {
			return { reason: 'Flight SQL endpoint not found - check the URL' };
		}
		return { reason: error.message || 'Connection failed' };
	}
};

module.exports.options = {
	endpoint: {
		title: 'Flight SQL HTTP Endpoint',
		type: 'string',
		required: true,
		description: 'HTTP endpoint URL for Flight SQL queries (e.g., http://localhost:8080/api/sql)',
		default: 'http://localhost:8080/api/sql'
	},
	timeout: {
		title: 'Query Timeout (ms)',
		type: 'number',
		default: 30000,
		description: 'Maximum time to wait for query execution',
		secret: false
	},
	mock: {
		title: 'Mock Mode',
		type: 'boolean',
		default: false,
		description: 'Enable mock mode for testing (returns sample data instead of making HTTP calls)',
		secret: false
	}
};

// Store the function references before reassigning
const savedGetRunner = module.exports.getRunner;
const savedTestConnection = module.exports.testConnection;
const savedOptions = module.exports.options;

// Export main runQuery function and preserve other exports
module.exports = runQuery;
module.exports.getRunner = savedGetRunner;
module.exports.testConnection = savedTestConnection;
module.exports.options = savedOptions;