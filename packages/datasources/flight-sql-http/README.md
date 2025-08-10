# Flight SQL HTTP Datasource

Flight SQL HTTP datasource for Evidence. Executes SQL queries via HTTP POST against a Flight SQL server middleware.

## Configuration

### Connection Options

```yaml
# sources/main/connection.yaml
name: main
type: flight-sql-http
options:
  endpoint: http://localhost:8080/api/sql
  timeout: 30000  # Optional: query timeout in milliseconds
```

### Environment Variables

You can use environment variables in your connection configuration:

```yaml
options:
  endpoint: "${FLIGHT_SQL_ENDPOINT}"
  timeout: 30000
```

## HTTP API Contract

The Flight SQL HTTP endpoint should accept POST requests with the following format:

### Request
```json
POST /api/sql
Content-Type: application/json

{
  "sql": "SELECT * FROM table WHERE condition = 'value'",
  "timeout": 30000
}
```

### Response
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

## Supported SQL Types

The datasource automatically maps SQL types to Evidence types:

- `INTEGER`, `BIGINT`, `DOUBLE`, `FLOAT`, `DECIMAL` → `NUMBER`
- `VARCHAR`, `TEXT`, `CHAR`, `STRING` → `STRING`  
- `DATE`, `TIMESTAMP`, `TIMESTAMP WITH TIME ZONE` → `DATE`
- `BOOLEAN`, `BOOL` → `BOOLEAN`
- Unknown types → `STRING` (fallback)

## Development

### Console Logging

The datasource provides detailed logging for development:

```
[Flight SQL] Initializing datasource with endpoint: http://localhost:8080/api/sql
[Flight SQL] Testing connection to http://localhost:8080/api/sql
[Flight SQL] Connection test successful
[Flight SQL] Executing query: SELECT * FROM sales WHERE date > '2024-01-01'...
[Flight SQL] Query completed in 12ms, 1,234 rows
```

### Error Handling

- **Connection errors**: ECONNREFUSED, 404 not found
- **SQL errors**: Syntax errors, runtime errors
- **Timeout errors**: Query execution timeout
- **HTTP errors**: Non-200 response codes

## Authentication

The datasource can pass through authentication headers:

```yaml
options:
  endpoint: http://localhost:8080/api/sql
  auth: "Bearer your-token-here"
```

When deployed behind an OAuth proxy, the authentication header will be automatically forwarded.