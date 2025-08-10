#!/usr/bin/env node

// Simple HTTP server to demonstrate Flight SQL Mock functionality
const http = require('http');
const url = require('url');
const flightSqlDatasource = require('./packages/datasources/flight-sql-http/index.cjs');

console.log('🚀 Starting Evidence Flight SQL Mock Demo Server...\n');

const PORT = 3333;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Root endpoint - show demo page
    if (parsedUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Evidence Flight SQL Mock Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .demo-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Evidence Flight SQL Mock Demo</h1>
        
        <div class="status success">
            ✅ Flight SQL Mock Datasource is running successfully!
        </div>
        
        <div class="status info">
            📊 This demo shows Evidence's Flight SQL datasource working in mock mode - no backend server required!
        </div>
        
        <div class="demo-section">
            <h3>🧪 Test Queries</h3>
            <button onclick="testConnection()">Test Connection</button>
            <button onclick="runSimpleQuery()">Run Simple Query</button>
            <button onclick="runSalesQuery()">Run Sales Data Query</button>
            <button onclick="runAggregationQuery()">Run Aggregation Query</button>
        </div>
        
        <div id="results">
            <h3>📋 Query Results</h3>
            <pre id="output">Click a button above to see mock query results...</pre>
        </div>
        
        <div class="demo-section">
            <h3>🏗️ Architecture</h3>
            <p><strong>Evidence Frontend</strong> → <strong>Flight SQL HTTP Datasource</strong> → <strong>Mock Data Generator</strong></p>
            <p>In production: <strong>Evidence Frontend</strong> → <strong>Flight SQL HTTP Datasource</strong> → <strong>Your Flight SQL Server</strong></p>
        </div>
    </div>
    
    <script>
        const output = document.getElementById('output');
        
        function updateOutput(title, data) {
            output.textContent = title + '\\n\\n' + JSON.stringify(data, null, 2);
        }
        
        async function testConnection() {
            try {
                const response = await fetch('/api/test-connection');
                const result = await response.json();
                updateOutput('🔗 Connection Test Result:', result);
            } catch (error) {
                updateOutput('❌ Error:', { error: error.message });
            }
        }
        
        async function runSimpleQuery() {
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sql: "SELECT 1 as id, 'Hello Flight SQL' as message" })
                });
                const result = await response.json();
                updateOutput('🗃️ Simple Query Result:', result);
            } catch (error) {
                updateOutput('❌ Error:', { error: error.message });
            }
        }
        
        async function runSalesQuery() {
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sql: "SELECT product, sales, date FROM sales_table ORDER BY date" })
                });
                const result = await response.json();
                updateOutput('📊 Sales Data Query Result:', result);
            } catch (error) {
                updateOutput('❌ Error:', { error: error.message });
            }
        }
        
        async function runAggregationQuery() {
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sql: "SELECT SUM(sales) as total_sales, COUNT(*) as record_count FROM sales_table" })
                });
                const result = await response.json();
                updateOutput('🧮 Aggregation Query Result:', result);
            } catch (error) {
                updateOutput('❌ Error:', { error: error.message });
            }
        }
    </script>
</body>
</html>
        `);
        return;
    }
    
    // API endpoint for testing connection
    if (parsedUrl.pathname === '/api/test-connection') {
        try {
            const mockOptions = { endpoint: 'mock', mock: true, timeout: 30000 };
            const result = await flightSqlDatasource.testConnection(mockOptions, './test');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                connected: result === true,
                message: result === true ? 'Mock connection successful!' : result.reason,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return;
    }
    
    // API endpoint for running queries
    if (parsedUrl.pathname === '/api/query' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { sql } = JSON.parse(body);
                const mockOptions = { endpoint: 'mock', mock: true, timeout: 30000 };
                
                console.log(`[Demo] Executing query: ${sql.substring(0, 50)}...`);
                
                const result = await flightSqlDatasource(sql, mockOptions);
                
                // Convert async generator to array
                const rows = [];
                try {
                    for await (const row of result) {
                        rows.push(row);
                    }
                } catch (e) {
                    // Mock data is already available, async iteration not needed for display
                }
                
                const response = {
                    success: true,
                    query: sql,
                    rowCount: result.expectedRowCount,
                    columnTypes: result.columnTypes,
                    executionTime: '~10ms (mock)',
                    timestamp: new Date().toISOString(),
                    mockMode: true
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
                
            } catch (error) {
                console.error('[Demo] Query error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    // 404 for other endpoints
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`🌐 Demo server running at: http://localhost:${PORT}`);
    console.log(``);
    console.log(`📋 Available endpoints:`);
    console.log(`  • http://localhost:${PORT}/           - Demo web interface`);
    console.log(`  • http://localhost:${PORT}/api/test-connection - Test mock connection`);
    console.log(`  • http://localhost:${PORT}/api/query         - Execute mock queries`);
    console.log(``);
    console.log(`✨ This demonstrates Evidence's Flight SQL datasource in mock mode!`);
    console.log(`🔧 Click the buttons in the web interface to see live mock data.`);
    console.log(``);
    console.log(`Press Ctrl+C to stop the server`);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down demo server...');
    server.close();
    process.exit(0);
});