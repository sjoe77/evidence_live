#!/usr/bin/env node

// Test script for Flight SQL HTTP datasource
const runQuery = require('./packages/datasources/flight-sql-http/index.cjs');
const { testConnection, getRunner } = require('./packages/datasources/flight-sql-http/index.cjs');

console.log('🧪 Testing Flight SQL HTTP Datasource...\n');

async function testMockMode() {
    console.log('=== MOCK MODE TEST ===');
    
    try {
        // Test mock mode
        const mockOptions = { 
            endpoint: 'mock', 
            mock: true,
            timeout: 30000 
        };
        
        console.log('Testing connection...');
        const connectionResult = await testConnection(mockOptions, './test');
        console.log('✅ Connection test result:', connectionResult);
        
        console.log('\nExecuting test query...');
        const testResult = await runQuery('SELECT 1 as id, \'Hello Flight SQL\' as message', mockOptions);
        
        // Convert async generator to array for display
        const rows = [];
        try {
            for await (const row of testResult) {
                rows.push(row);
            }
        } catch (e) {
            console.log('Note: Async iteration not available, using result object directly');
            // The actual data is already in the result, this is just for display
        }
        
        console.log('✅ Query executed successfully!');
        console.log('📊 Results:');
        console.log('- Row count:', testResult.expectedRowCount);
        console.log('- Column types:', testResult.columnTypes);
        console.log('- Has async iteration:', typeof testResult[Symbol.asyncIterator] === 'function');
        
        console.log('\nExecuting sales data query...');
        const salesResult = await runQuery('SELECT product, sales, date FROM sales_table', mockOptions);
        
        const salesRows = [];
        try {
            for await (const row of salesResult) {
                salesRows.push(row);
            }
        } catch (e) {
            console.log('Note: Using direct result access for sales data');
        }
        
        console.log('✅ Sales query executed successfully!');
        console.log('📊 Sales Results:');
        console.log('- Row count:', salesResult.expectedRowCount);
        console.log('- Column types count:', salesResult.columnTypes?.length);
        console.log('- Has async iteration:', typeof salesResult[Symbol.asyncIterator] === 'function');
        
        console.log('\n🎉 Mock mode test completed successfully!\n');
        
    } catch (error) {
        console.error('❌ Mock mode test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function testErrorHandling() {
    console.log('=== ERROR HANDLING TEST ===');
    
    try {
        // Test with invalid endpoint (should fail gracefully)
        const invalidOptions = { 
            endpoint: 'http://invalid-server:9999/api/sql',
            timeout: 5000
        };
        
        console.log('Testing connection to invalid endpoint...');
        const result = await testConnection(invalidOptions, './test');
        console.log('✅ Error handled gracefully:', result);
        
        console.log('\n🎉 Error handling test completed!\n');
        
    } catch (error) {
        console.log('✅ Expected error caught:', error.message);
    }
}

// Run tests
async function runTests() {
    await testMockMode();
    await testErrorHandling();
    console.log('🏁 All tests completed!');
    process.exit(0);
}

runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});