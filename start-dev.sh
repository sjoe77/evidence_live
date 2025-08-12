#!/bin/bash

# Evidence Flight SQL Development Server
echo "🚀 Starting Evidence with Flight SQL integration..."

# Set environment variables
export NODE_ENV=development
export FLIGHT_SQL_ENDPOINT=${FLIGHT_SQL_ENDPOINT:-"http://localhost:8080/api/sql"}
export DEBUG=evidence:*

echo "📊 Flight SQL Endpoint: $FLIGHT_SQL_ENDPOINT"
echo "🔧 Debug mode: enabled"

# Navigate to example project
cd sites/example-project

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start development server
echo "🌐 Starting Evidence dev server on http://localhost:3000"
echo "🧪 Test dashboard: http://localhost:3000/flight-sql-test"
echo ""
echo "Press Ctrl+C to stop the server"
npm run dev