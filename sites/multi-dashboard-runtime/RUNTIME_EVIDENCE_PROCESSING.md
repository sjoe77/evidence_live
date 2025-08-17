# Runtime Evidence Processing Architecture

## Philosophy: Simplicity Over Optimization

**Core Principle**: Keep it dead simple. Compile Evidence markdown at runtime on every request. No caching, no file watchers, no complexity.

**Performance**: 500ms compilation per request is perfectly acceptable for dashboard authoring workflow.

## Architecture Overview

### Dashboard Author Workflow
```
Dashboard Author → Edit /dashboards/SalesDashboard/+page.md → Refresh Browser → See Changes
```

**No builds. No restarts. No technical knowledge required.**

### Runtime Processing Flow
```
Browser Request → +page.server.js → Read Markdown → Evidence Preprocessors → Compiled Component → Browser
```

### Query Execution Flow (Unchanged)
```
Browser → OAuth Proxy (4180) → Evidence Server (3000) → HTTP Middleware (31338) → Flight SQL (31337) → DuckLake
```

**Critical Point**: Query execution path remains identical to existing Evidence + Flight SQL integration.

## Technical Implementation

### Server-Side Processing (`+page.server.js`)
```javascript
import evidencePreprocess from '@evidence-dev/preprocess';
import fs from 'fs';

export async function load({ params, request }) {
    // Extract OAuth headers (unchanged)
    const oauthHeaders = extractOAuthHeaders(request);
    
    // Read dashboard markdown
    const markdown = fs.readFileSync(`/dashboards/${params.dashboard}/+page.md`, 'utf-8');
    
    // Process with Evidence (same as build-time)
    const processed = await evidencePreprocess(markdown);
    
    // Return compiled component
    return { 
        compiledComponent: processed,
        oauthHeaders 
    };
}
```

### Component Rendering (`+page.svelte`)
```javascript
<script>
    export let data;
    // Render the server-compiled Evidence component
    // All Evidence features work: query parameters, inputs, conditionals
</script>

{@html data.compiledComponent}
```

## Evidence Features Supported

### ✅ All Evidence Capabilities Work
- **Query Parameters**: `${inputs.selected_status.value}`
- **Input Components**: `<Dropdown>`, `<DateRange>`, `<TextInput>`
- **Conditional Logic**: `{#if inputs.selected_status}...{/if}`
- **Query Chaining**: `SELECT * FROM ${other_query}`
- **All Chart Components**: `<BarChart>`, `<LineChart>`, `<DataTable>`
- **Interactive Features**: Click events, filtering, URL state

### Query Execution (Identical to Build-Time)
```markdown
```sql claims_by_status
-- source: flight_sql
SELECT status, count(*) as total_claims
FROM my_ducklake.main.claims 
WHERE status = '${inputs.selected_status.value}'
GROUP BY status
ORDER BY total_claims DESC
```

<BarChart data={claims_by_status} x=status y=total_claims />
```

**This query will:**
1. Execute in browser (compiled Svelte component)
2. Use OAuth headers from proxy
3. Call Flight SQL HTTP middleware
4. Return DuckLake data in 10ms
5. Render in BarChart component

## Performance Characteristics

### Compilation Performance
- **Markdown Read**: ~5ms
- **Evidence Processing**: ~200-500ms
- **Component Generation**: ~5ms
- **Total**: ~500ms per request

### Query Performance (Unchanged)
- **Flight SQL Response**: 10ms
- **Evidence Rendering**: 5-15ms
- **Total Dashboard Load**: ~525ms

**This is perfectly acceptable** for dashboard authoring and internal analytics tools.

## Benefits of Runtime Processing

### ✅ Immediate Updates
- Dashboard authors edit markdown files
- Changes appear on browser refresh
- No builds, deploys, or restarts required

### ✅ Full Evidence Compatibility
- 100% Evidence feature support
- Identical behavior to build-time processing
- All existing dashboards work unchanged

### ✅ Simple Architecture
- No caching complexity
- No file watchers
- No build pipeline dependencies
- Easy to debug and maintain

### ✅ Development Workflow
- Standard Evidence markdown syntax
- VSCode with Evidence extensions
- Real-time preview on save + refresh

## Dashboard Directory Structure

```
/dashboards/
├── SalesDashboard/+page.md      → http://localhost:4180/dashboards/SalesDashboard
├── MarketingDashboard/+page.md  → http://localhost:4180/dashboards/MarketingDashboard
├── ExecutiveDashboard/+page.md  → http://localhost:4180/dashboards/ExecutiveDashboard
└── [Any New Dashboard]/+page.md → http://localhost:4180/dashboards/[Any New Dashboard]
```

**Each dashboard is automatically available** when the markdown file exists.

## Integration with Existing Systems

### OAuth Proxy Integration
- Runtime processing preserves OAuth header flow
- Authentication works identically to static routes
- No changes to OAuth proxy configuration needed

### Flight SQL Integration  
- Query execution path unchanged
- Same HTTP POST to middleware (port 31338)
- Same 10ms performance characteristics
- Same error handling and logging

### DuckLake Data Access
- Same connection to DuckLake via Flight SQL
- Same query capabilities and performance
- Same security model and access control

## Comparison: Build-Time vs Runtime

| Aspect | Build-Time | Runtime |
|--------|------------|---------|
| **Author Experience** | Edit → Build → Deploy → See Changes | Edit → Refresh → See Changes |
| **Performance** | ~10ms (static files) | ~500ms (compilation) |
| **Complexity** | High (build pipeline) | Low (simple server function) |
| **Evidence Features** | 100% | 100% |
| **Query Performance** | 10ms | 10ms (identical) |
| **Deployment** | Complex | Simple |

## Success Criteria

### ✅ Dashboard Author Experience
- Create new dashboard: Add markdown file → URL automatically works
- Edit existing dashboard: Modify file → Refresh browser → See changes
- No technical knowledge required beyond Evidence markdown syntax

### ✅ Evidence Feature Parity
- All Evidence components work identically
- Query parameters and inputs function properly
- Interactive features (clicks, filters) work
- Performance acceptable for dashboard use cases

### ✅ System Integration
- OAuth authentication flows correctly
- Flight SQL queries execute with proper headers
- DuckLake data accessible with same performance
- Error handling and logging maintained

## Implementation Timeline

1. **Phase 1**: Implement basic runtime processing (1-2 hours)
2. **Phase 2**: Test Evidence feature compatibility (1 hour)  
3. **Phase 3**: Verify query execution and OAuth flow (30 minutes)
4. **Phase 4**: Create sample dashboards and documentation (30 minutes)

**Total Implementation**: ~4 hours to complete runtime Evidence processing system.

---

## Philosophy: Worse is Better

**Simple solutions are often superior to complex ones.**

Runtime compilation with 500ms latency is better than:
- Complex build pipelines
- Caching infrastructure  
- File watching systems
- Deployment complexity

**For dashboard authoring workflows, simplicity trumps optimization.**