// Flight SQL HTTP Datasource for Evidence v20
// Direct connection to DuckLake via OAuth proxy

const fetch = globalThis.fetch || (await import('node-fetch')).default;

/**
 * Execute SQL query via Flight SQL HTTP endpoint
 * @param {string} queryString - SQL query to execute  
 * @param {object} options - Connection options
 * @returns {Promise<Array>} Query results in Evidence format
 */
async function runQuery(queryString, options = {}) {
  const startTime = Date.now();
  const endpoint = options.endpoint || 'http://localhost:4180/query';
  
  console.log(`🚀 [Flight SQL] Executing: ${queryString}`);
  
  try {
    // Make HTTP request to Flight SQL
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: queryString,
        timeout: options.timeout || 30000 
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const duration = Date.now() - startTime;
    
    // Convert DuckLake format {columns: [], results: [[]]} to Evidence format
    if (result.columns && result.results) {
      const data = result.results.map(row => {
        const obj = {};
        result.columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        return obj;
      });
      
      console.log(`✅ [Flight SQL] Success: ${data.length} rows in ${duration}ms`);
      return data;
    }
    
    console.log(`✅ [Flight SQL] Success in ${duration}ms`);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Flight SQL] Error after ${duration}ms:`, error.message);
    
    // Return mock data so Evidence doesn't crash
    return [{ 
      error: `Flight SQL Error: ${error.message}`,
      query: queryString,
      endpoint: endpoint
    }];
  }
}

/**
 * Test connection to Flight SQL endpoint
 */
async function testConnection(options = {}) {
  try {
    const result = await runQuery('SELECT 1 as test', options);
    return result.length > 0 && !result[0].error;
  } catch (error) {
    return { reason: `Connection failed: ${error.message}` };
  }
}

// Evidence v20 CommonJS exports
module.exports = runQuery;
module.exports.getRunner = async (opts) => {
  console.log(`🔧 [Flight SQL] Initializing with endpoint: ${opts.endpoint}`);
  return async (queryContent, queryPath) => {
    if (!queryPath.endsWith('.sql')) return null;
    return runQuery(queryContent, opts);
  };
};
module.exports.testConnection = testConnection;
module.exports.options = {
  endpoint: {
    title: 'Flight SQL HTTP Endpoint',
    type: 'string', 
    required: true,
    description: 'HTTP endpoint URL for Flight SQL queries',
    default: 'http://localhost:4180/query'
  },
  timeout: {
    title: 'Query Timeout (ms)',
    type: 'number',
    default: 30000,
    description: 'Maximum time to wait for query execution'
  }
};