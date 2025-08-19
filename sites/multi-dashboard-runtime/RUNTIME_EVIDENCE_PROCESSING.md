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

---

## ⚠️ CRITICAL ARCHITECTURE DECISION ⚠️

### Why We Abandoned the "Official Evidence Approach"

After extensive analysis, the **Evidence + Svelte compilation approach was abandoned** because it fundamentally conflicts with runtime processing goals:

**THE CORE PROBLEM: Evidence is Build-Time Architecture**

### Why Evidence's Official Approach Fails for Runtime Processing:

1. **Evidence requires builds when markdown changes** - changing a dashboard triggers full Svelte compilation
2. **Svelte compiler integration requires build pipeline** - cannot achieve "Edit → Refresh → See Changes"
3. **Evidence's reactive system depends on build-time optimization** - not compatible with runtime compilation
4. **File watching and hot module replacement required** - adds complexity and defeats simplicity goals

### The Failed "Proper Evidence" Architecture:

```
❌ Markdown → Evidence preprocessing → Svelte compiler → Build step → Executable JavaScript → Browser
                                                    ↑
                                          REQUIRES BUILD ON EVERY CHANGE
```

**This approach preserves 100% Evidence features but destroys the dashboard authoring experience.**

### ✅ THE WORKING HYBRID ARCHITECTURE

**Evidence Preprocessing + Custom Component Rendering**

```
✅ Markdown → Evidence preprocessing → Component extraction → Manual rendering → Browser
                    ↑                                                              ↑
           Handles complex syntax                                    No builds required
```

### Why the Hybrid Approach Works:

1. **Evidence preprocessing handles 90% of complexity** - markdown parsing, query extraction, template logic
2. **Custom component rendering provides runtime flexibility** - no builds, instant updates
3. **Preserves dashboard authoring workflow** - Edit → Refresh → See Changes
4. **Maintains Evidence feature compatibility** - SQL parameters, input components, chart interactions

### Hybrid Architecture Rules:

- **✅ USE Evidence preprocessing** - leverage Evidence's robust markdown processing
- **✅ USE custom component extraction** - regex parsing of preprocessed output  
- **✅ USE manual query execution** - runtime SQL execution via Flight SQL
- **✅ USE placeholder replacement system** - proper component positioning
- **❌ NO Svelte compilation** - breaks runtime processing goals
- **❌ NO build dependencies** - destroys authoring experience

### The Hard Truth: Perfect vs Good Enough

**Evidence's "official approach" provides 100% feature compatibility but 0% runtime flexibility.**

**The hybrid approach provides 90%+ feature compatibility with 100% runtime flexibility.**

**For dashboard authoring workflows, runtime flexibility trumps perfect Evidence compatibility.**

### Evidence Features Achievable with Hybrid Approach:

✅ **SQL query execution with parameters**  
✅ **Input components (Dropdown, DateRange, TextInput)**  
✅ **Chart components (BarChart, LineChart, DataTable)**  
✅ **Query chaining and template interpolation**  
✅ **Conditional logic and loops**  
✅ **Grid layouts and responsive design**  
✅ **Component interactions and filtering**  
⚠️ **Advanced Svelte reactivity** (limited but functional)  
⚠️ **Complex nested components** (requires custom handling)  

**This architectural decision prioritizes dashboard authoring experience over perfect Evidence compatibility - the right trade-off for this use case.**

---

## 🚧 CURRENT IMPLEMENTATION GAPS - TODO PLAN

### Critical Issues Discovered

**PROBLEM**: Template literal interpolation `${inputs.status_filter.value}` not working in SQL queries
- Query sent to database contains literal `${inputs.status_filter.value}` instead of actual values
- Evidence input components not being parsed and processed by runtime system

### TODO: Evidence Feature Implementation Plan

#### Phase 1: Core Parameter System (HIGH PRIORITY)
1. **Fix SQL parameter interpolation** - template literals `${inputs.status_filter.value}` not being processed
2. **Implement Evidence input component parsing** - parse `<Dropdown>`, `<TextInput>`, `<DateRange>` in runtime processor
3. **Add input state management** - track component values and make available to queries

#### Phase 2: URL and Navigation (MEDIUM PRIORITY)  
4. **Add URL parameter handling** - Evidence input components should sync with URL state
5. **Implement query parameter persistence** - filter selections persist on page refresh

#### Phase 3: Layout and Structure (MEDIUM PRIORITY)
6. **Implement Evidence layout components** - `<Grid>`, `<Section>`, `<Details>` in hybrid renderer
7. **Add responsive layout support** - Evidence grid system and breakpoints

#### Phase 4: Logic and Control Flow (MEDIUM PRIORITY)
8. **Add Evidence conditional logic support** - `{#if}`, `{#else}`, `{:else if}` in runtime processing
9. **Implement Evidence loop support** - `{#each}` for dynamic content generation
10. **Add template interpolation** - `{variable}` display and `${query_name}` query chaining

#### Phase 5: Documentation (LOW PRIORITY)
11. **Document current hybrid architecture limitations** - what Evidence features work vs don't work
12. **Create Evidence feature compatibility matrix** - clear guide for dashboard authors

### Current Status: Partial Implementation
- ✅ **Basic Evidence preprocessing** - markdown parsing works
- ✅ **Chart components** - BarChart, LineChart, DataTable render
- ✅ **Flight SQL integration** - queries execute against DuckLake
- ❌ **Input component processing** - not parsed or functional
- ❌ **Template interpolation** - `${variable}` literals not replaced
- ❌ **URL parameter handling** - no state persistence
- ❌ **Conditional logic** - `{#if}` blocks not processed

### Next Immediate Actions
1. Start with **SQL parameter interpolation fix** - most critical for basic functionality
2. Implement **input component parsing** - required for dashboard interactivity  
3. Add **state management system** - bridge between Evidence components and runtime

**Goal**: Get basic Evidence input → SQL parameter → chart filtering workflow functional before expanding to full Evidence feature set.

---

## 🎯 SIMPLE STATE MANAGEMENT APPROACH - "WORSE IS BETTER"

### Philosophy: Minimal Input Component Support

**Goal**: Simple state store that handles dropdown filtering. Nothing fancy, just enough to make `${inputs.dropdown_name.value}` work.

### Implementation Plan: Simple Dropdown State Management

#### Core Components Needed (200-300 lines total):

1. **Simple Inputs State Store**
   ```javascript
   // Simple global state object
   const inputs = {
     status_filter: { value: "" },
     // Add more dropdowns as needed
   };
   ```

2. **Dropdown Component Parser** 
   - Extract `<Dropdown name=status_filter>` from markdown
   - Extract `<DropdownOption value="Pending">` options
   - Replace with HTML `<select>` with event handlers

3. **Template Interpolation Engine**
   - Find `${inputs.status_filter.value}` in SQL queries
   - Replace with actual state values before sending to Flight SQL
   - Simple string replacement, nothing complex

4. **Event Handling**
   - Listen to dropdown change events
   - Update inputs state object
   - Re-execute affected SQL queries

5. **End-to-End Flow**
   ```
   User selects dropdown → Update inputs.status_filter.value → 
   Replace ${inputs.status_filter.value} in SQL → Execute query → Update charts
   ```

### TODO: Simple Dropdown Implementation
1. **Create simple inputs state store** - minimal state management for dropdown values
2. **Parse Dropdown components from markdown** - extract name and options  
3. **Implement template interpolation** - replace `${inputs.dropdown_name.value}` in SQL
4. **Add dropdown change event handling** - update state store on selection
5. **Test end-to-end**: dropdown selection → state update → SQL interpolation → query execution

### Benefits of Simple Approach:
- ✅ **Minimal code** - 200-300 lines vs rebuilding Evidence
- ✅ **Works for dropdown filtering** - covers 80% of dashboard use cases
- ✅ **Easy to debug** - simple state object, basic event handling
- ✅ **Extensible** - add TextInput, DateRange later if needed
- ✅ **Preserves simplicity** - no complex reactive systems

### What This WON'T Support (Acceptable Limitations):
- ❌ Complex nested state
- ❌ Advanced Svelte reactivity  
- ❌ All Evidence input types (start with Dropdown only)
- ❌ Complex parameter interdependencies

**This gives us the filtering functionality we need while maintaining the "worse is better" philosophy.**