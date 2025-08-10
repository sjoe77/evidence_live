#!/bin/bash

# Evidence Flight SQL Mock Mode Development Server
echo "🚀 Starting Evidence with Flight SQL integration in MOCK mode..."

# Set environment variables for mock mode
export NODE_ENV=development
export FLIGHT_SQL_ENDPOINT=mock
export FLIGHT_SQL_MOCK=true
export DEBUG=evidence:*

echo "🎭 Flight SQL Mock Mode: ENABLED"
echo "📊 All queries will return mock data"
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
echo "🧪 Mock test dashboard: http://localhost:3000/mock-test"
echo "🧪 Regular test dashboard: http://localhost:3000/flight-sql-test"
echo ""
echo "✅ Mock mode is perfect for unit testing and development without Flight SQL backend"
echo "Press Ctrl+C to stop the server"
npm run dev