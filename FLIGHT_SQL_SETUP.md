# Flight SQL Evidence Setup Guide

This guide will help you set up Evidence with Flight SQL HTTP datasource for live dashboard development.

## Prerequisites

1. **Node.js 18+** installed
2. **Your Flight SQL HTTP middleware** running (default: http://localhost:8080/api/sql)
3. **VSCode** (recommended for development)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install example project dependencies  
cd sites/example-project
npm install
```

### 2. Configure Flight SQL Endpoint

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` and set your Flight SQL endpoint:

```bash
FLIGHT_SQL_ENDPOINT=http://localhost:8080/api/sql
```

### 3. Start Development Server

**Option A: Mock Mode (No Flight SQL server required)**
```bash
./start-mock.sh
```

**Option B: Real Flight SQL server**
```bash
./start-dev.sh
```

**Option C: Manual startup (Mock Mode)**
```bash
cd sites/example-project
FLIGHT_SQL_MOCK=true npm run dev
```

**Option D: Manual startup (Real Mode)**
```bash
cd sites/example-project
FLIGHT_SQL_ENDPOINT=http://localhost:8080/api/sql npm run dev
```

**Option E: Using VSCode**
1. Open project in VSCode
2. Press F5 or go to Run & Debug
3. Select one of:
   - **"Evidence Dev Server (Mock Mode)"** - Uses mock data, no server needed
   - **"Evidence Dev Server (Flight SQL)"** - Connects to localhost:8080
   - **"Evidence Dev Server (Custom Endpoint)"** - Prompts for endpoint
4. Click the green play button

### 4. Access Dashboards

- **Development Server**: http://localhost:3000
- **Mock Test Dashboard**: http://localhost:3000/mock-test (works without Flight SQL server)
- **Real Test Dashboard**: http://localhost:3000/flight-sql-test (requires Flight SQL server)

## VSCode Development Workflow

### Debug Configuration

Two VSCode debug configurations are available:

1. **Evidence Dev Server (Flight SQL)** - Uses localhost:8080 endpoint
2. **Evidence Dev Server (Custom Endpoint)** - Prompts for custom endpoint URL

### Console Output

When running in debug mode, you'll see helpful logs:

**Real Mode:**
```
[Flight SQL] Initializing datasource with endpoint: http://localhost:8080/api/sql
[Flight SQL] Testing connection to http://localhost:8080/api/sql
[Flight SQL] Connection test successful
[Evidence] Server ready on http://localhost:3000

# On page load:
[Flight SQL] Executing query: SELECT 1 as id, 'Hello Flight SQL' as message...
[Flight SQL] Query completed in 8ms, 1 rows
```

**Mock Mode:**
```
[Flight SQL MOCK] Initializing datasource with endpoint: mock
[Flight SQL MOCK] Testing connection to mock
[Flight SQL MOCK] Connection test successful
[Evidence] Server ready on http://localhost:3000

# On page load:
[Flight SQL MOCK] Executing query: SELECT 1 as id, 'Hello Flight SQL' as message...
[Flight SQL MOCK] Query completed in 12ms, 1 rows (mock data)
```

### Breakpoint Debugging

You can set breakpoints in:
- Flight SQL datasource: `packages/datasources/flight-sql-http/index.cjs`
- Query processing: `packages/lib/preprocess/src/`
- Component rendering: `packages/ui/core-components/src/`

## Flight SQL HTTP API Contract

Your Flight SQL middleware should accept POST requests:

### Request Format
```json
POST /api/sql
Content-Type: application/json

{
  "sql": "SELECT * FROM table WHERE condition = 'value'",
  "timeout": 30000
}
```

### Response Format  
```json
{
  "data": [
    {"id": 1, "name": "John", "created_at": "2024-01-01T10:00:00Z"},
    {"id": 2, "name": "Jane", "created_at": "2024-01-02T11:00:00Z"}
  ],
  "columns": [
    {"name": "id", "type": "INTEGER"},
    {"name": "name", "type": "VARCHAR"},
    {"name": "created_at", "type": "TIMESTAMP"}
  ],
  "rowCount": 2
}
```

### Error Response
```json
{
  "error": "SQL syntax error: unexpected token 'SELCT'"
}
```

## Creating Dashboards

### Basic Dashboard Structure

```markdown
# My Dashboard

```sql my_query
SELECT 
    product_name,
    SUM(sales) as total_sales
FROM sales_table 
GROUP BY product_name
ORDER BY total_sales DESC
```

<DataTable data={my_query} />
<BarChart data={my_query} x=product_name y=total_sales />
```

### Query Chaining

```sql base_data
SELECT * FROM orders WHERE order_date >= '2024-01-01'
```

```sql summary
SELECT 
    COUNT(*) as total_orders,
    SUM(amount) as total_revenue
FROM (${base_data})
```

**Total Orders**: {summary[0].total_orders}  
**Total Revenue**: ${summary[0].total_revenue}

### Interactive Components

```sql products
SELECT DISTINCT product_name FROM products ORDER BY product_name
```

<Dropdown name=product data={products} value=product_name />

```sql filtered_sales
SELECT * FROM sales 
WHERE product_name = '${inputs.product.value}'
```

<LineChart data={filtered_sales} x=date y=sales />

## Development Tips

### Hot Reload
- Markdown file changes trigger automatic page reload
- SQL query changes trigger automatic re-execution
- Component changes use hot module replacement

### Error Handling
- SQL errors display in the Evidence UI
- Network errors show in both console and UI
- Connection errors are logged to console

### Performance
- Queries execute in ~10ms with your optimized backend
- Total dashboard load time: 15-25ms
- No caching needed initially (can add later if needed)

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Flight SQL endpoint
```
[Flight SQL] Connection test failed: Error: ECONNREFUSED
```

**Solutions**:
1. Verify Flight SQL server is running
2. Check endpoint URL in configuration
3. Verify network connectivity

### SQL Errors

**Problem**: SQL syntax errors in queries
```
[Flight SQL] Query failed: SQL syntax error: unexpected token
```

**Solutions**:
1. Check SQL syntax in your .sql files or markdown
2. Verify table/column names exist in your data
3. Use Flight SQL-compatible SQL dialect

### Authentication Issues

If using authentication, ensure headers are passed correctly:

```yaml
# sources/flight_sql/connection.yaml
options:
  endpoint: http://localhost:8080/api/sql
  auth: "Bearer ${AUTH_TOKEN}"
```

## Next Steps

After Phase 1 is working:
1. **Phase 2**: Add Monaco editor for dashboard authoring
2. **Deployment**: Package as Docker container for production
3. **Scaling**: Add caching and load balancing if needed

---

**Support**: For issues, check console logs and verify Flight SQL endpoint is responding correctly.