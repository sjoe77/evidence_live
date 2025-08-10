// Debug the Flight SQL module exports
const flightSqlModule = require('./packages/datasources/flight-sql-http/index.cjs');

console.log('Flight SQL module exports:');
console.log('Type:', typeof flightSqlModule);
console.log('Keys:', Object.keys(flightSqlModule));
console.log('Full object:', flightSqlModule);

// Check what's available
for (const [key, value] of Object.entries(flightSqlModule)) {
    console.log(`${key}: ${typeof value}`);
}