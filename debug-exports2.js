// Debug the Flight SQL module exports more thoroughly
const flightSqlModule = require('./packages/datasources/flight-sql-http/index.cjs');

console.log('Flight SQL module exports:');
console.log('Type:', typeof flightSqlModule);
console.log('Keys:', Object.keys(flightSqlModule));
console.log('Properties:', Object.getOwnPropertyNames(flightSqlModule));

// Check for specific exports
console.log('\nChecking specific exports:');
console.log('testConnection:', typeof flightSqlModule.testConnection);
console.log('getRunner:', typeof flightSqlModule.getRunner);
console.log('options:', typeof flightSqlModule.options);

// Check if they exist on module.exports
const mod = require('./packages/datasources/flight-sql-http/index.cjs');
console.log('\nDirect property access:');
console.log('mod.testConnection:', mod.testConnection);
console.log('mod.getRunner:', mod.getRunner);