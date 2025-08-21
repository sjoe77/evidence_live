// Flight SQL Datasource for Evidence
// Connects Evidence directly to DuckLake via OAuth proxy

/**
 * Execute SQL query via Flight SQL HTTP endpoint
 */
async function runQuery(queryString, options = {}) {
  const endpoint = options.endpoint || 'http://localhost:4180/query';
  console.log(`🚀 [Flight SQL] ${queryString}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryString })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Convert DuckLake format {columns: [], results: [[]]} to Evidence format
    if (result.columns && result.results) {
      const data = result.results.map(row => {
        const obj = {};
        result.columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        return obj;
      });
      console.log(`✅ [Flight SQL] ${data.length} rows`);
      return data;
    }
    
    return result;
  } catch (error) {
    console.error(`❌ [Flight SQL] ${error.message}`);
    return [{ error: error.message, query: queryString }];
  }
}

// Evidence datasource exports
export const getRunner = async (options) => {
  console.log(`🔧 [Flight SQL] Connecting to ${options.endpoint}`);
  return async (queryContent) => runQuery(queryContent, options);
};

export const testConnection = async (options) => {
  try {
    const result = await runQuery('SELECT 1 as test', options);
    return !result[0]?.error;
  } catch (error) {
    return { reason: error.message };
  }
};

export const options = {
  endpoint: {
    title: 'Flight SQL Endpoint',
    type: 'string',
    default: 'http://localhost:4180/query',
    description: 'DuckLake OAuth proxy endpoint'
  }
};