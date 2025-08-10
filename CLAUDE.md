# Evidence → Flight SQL Dashboard System

## Project Vision

Transform Evidence.dev into the **View layer** of an MVC architecture, consuming data from a high-performance Flight SQL HTTP middleware while preserving Evidence's powerful markdown→dashboard user experience.

## Architecture Overview

### Current System (Your Backend - Controller + Model)
```
Browser/API clients → OAuth Proxy → HTTP Middleware → Flight SQL Server → DuckDB w/DuckLake → Object Store (Parquet/Iceberg)
                                        ↓ gRPC                  ↓ Extension              ↓ S3/GCS/Azure
                                   Zero copy transfer     Connection pool         Meta store catalog
```

- **Flight SQL Server**: DuckDB with DuckLake extension for Parquet/Iceberg data
- **HTTP Middleware**: JSON API executing SQL via gRPC to Flight SQL server  
- **Performance**: 10ms query response times with connection pooling optimization
- **OAuth Proxy**: Handles authentication and authorization
- **Object Store**: S3-compatible storage with Parquet/Iceberg format data

### Evidence as View Layer (This Project)
- **Dashboard Engine**: Transform markdown files with SQL queries into interactive dashboards
- **Live Data**: Execute SQL queries against Flight SQL HTTP middleware in real-time
- **Component Library**: Rich chart, table, and UI components for data visualization  
- **Server-Side Rendering**: On-demand markdown → HTML conversion
- **User Experience**: Preserve Evidence's simple markdown + SQL syntax

## Implementation Phases

### Phase 1: Core Dashboard Engine (3-4 weeks)
**Goal**: Transform Evidence into live dashboard system consuming Flight SQL data

**Key Changes**:
1. **Replace DuckDB Datasource** with HTTP connector to Flight SQL middleware
2. **Remove Static Build** - eliminate parquet generation and static site creation
3. **Live Query Execution** - all SQL queries execute at runtime against Flight SQL
4. **Preserve All Evidence Features** - components, parameters, interactions unchanged
5. **VSCode Dev Workflow** - development server with debugging and hot reload

**Features Retained**:
- ✅ **Query Parameters & URL State** - Svelte store based, data source agnostic
- ✅ **Chart Click Events & Interactions** - Client-side event handling  
- ✅ **Pages & Navigation** - SvelteKit routing unchanged
- ✅ **Templated Pages** - `[parameter]` routing works the same
- ✅ **All Components** - LineChart, DataTable, BigValue, etc. only need JSON
- ✅ **Filters & Inputs** - Dropdown, DateRange components unchanged  
- ✅ **Query Chaining** - `${other_query}` syntax in preprocessing
- ✅ **Loops & Conditionals** - `{#each}`, `{#if}` - Svelte features
- ✅ **Themes & Styling** - CSS system completely independent

### Phase 2: Dashboard Authoring Interface (4-5 weeks)
**Goal**: Add web-based markdown editor for dashboard authors (5% of users)

**Key Features**:
1. **Monaco Editor Integration** - Syntax highlighting for Evidence markdown + SQL
2. **Edit Mode Toggle** - Wrench icon in dashboard header to enter authoring mode
3. **Live Preview** - Real-time rendering as users type
4. **Dashboard vs Authoring Modes**:
   - **95% Users**: Dashboard consumption (readonly, optimized performance)
   - **5% Users**: Dashboard authoring (Monaco editor + live preview)

## Development Workflow

### VSCode Development Setup
```bash
# Start development server
cd sites/example-project
FLIGHT_SQL_ENDPOINT=http://localhost:8080/api/sql npm run dev

# Access dashboards
http://localhost:3000/dashboard-name

# Debug with Node.js console logs
[Flight SQL] Executing query: SELECT * FROM sales...
[Flight SQL] Query completed in 8ms, 1,234 rows
```

### Dashboard Creation Workflow  
```markdown
# Sales Dashboard

```sql monthly_sales
SELECT 
  DATE_TRUNC('month', order_date) as month,
  SUM(amount) as total_sales
FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY 1
ORDER BY month
```

<LineChart data={monthly_sales} x=month y=total_sales />

```sql top_products
SELECT 
  product_name,
  SUM(quantity) as units_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY product_name
ORDER BY units_sold DESC
LIMIT 10
```

<DataTable data={top_products} />
```

## Technical Implementation

### Flight SQL HTTP Datasource
- **Package**: `@evidence-dev/flight-sql-http`  
- **Interface**: HTTP POST with SQL payload → JSON response
- **Error Handling**: SQL syntax errors and connection issues
- **Logging**: Console debug output for development

### Performance Characteristics
- **Backend Response**: 10ms per query (your optimized Flight SQL)
- **Node.js Overhead**: 5-15ms for HTML rendering  
- **Total Latency**: 15-25ms per dashboard load
- **Concurrent Users**: 100+ easily supported by single Node.js instance
- **No Premature Optimization**: No caching/Redis until needed

### Data Flow
```
Markdown File → Extract SQL Queries → HTTP POST to Flight SQL → JSON Response → Render Components → HTML Dashboard
```

## Configuration

### Evidence Configuration
```yaml
# evidence.config.yaml
sources:
  - main

development:
  port: 3000
  host: "0.0.0.0"
```

### Data Source Configuration  
```yaml
# sources/main/connection.yaml
name: main
type: flight-sql-http
options:
  endpoint: http://localhost:8080/api/sql
  timeout: 30000
```

### Environment Variables
```bash
FLIGHT_SQL_ENDPOINT=http://localhost:8080/api/sql
NODE_ENV=development
DEBUG=evidence:*
```

## Success Metrics

### Phase 1 Success Criteria
- ✅ Evidence dashboards render with Flight SQL data
- ✅ All Evidence features work unchanged  
- ✅ Development workflow functional in VSCode
- ✅ Query performance: 15-25ms total latency
- ✅ No static build step required
- ✅ Hot reload for development efficiency

### Phase 2 Success Criteria  
- ✅ Monaco editor with Evidence syntax highlighting
- ✅ Live preview during dashboard editing
- ✅ Seamless toggle between consumption and authoring modes
- ✅ Dashboard authors can create/edit without technical knowledge
- ✅ Dashboard consumers get optimized readonly experience

## Migration Path

### From Current Evidence Projects
1. **Keep Existing Dashboards** - All markdown files work unchanged
2. **Update Data Source** - Change connection.yaml to flight-sql-http
3. **Remove Build Step** - Dashboards render live, no `npm run build`  
4. **Deploy Server** - Node.js application instead of static files

### Integration with Existing Infrastructure
- **Authentication**: OAuth proxy provides user context via headers
- **Authorization**: Flight SQL middleware handles data access control  
- **Data**: Your existing Parquet/Iceberg data accessible via DuckLake
- **Performance**: Evidence adds minimal overhead to your optimized backend

This vision maintains Evidence's core strength (simple markdown + SQL → beautiful dashboards) while leveraging your high-performance Flight SQL infrastructure for a scalable, live dashboard system.