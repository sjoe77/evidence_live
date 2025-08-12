# Evidence Flight SQL Integration - TODO

## Current Status ✅

### Working Components
- ✅ **Flight SQL HTTP Datasource** - Mock mode functional, queries execute in 10-15ms
- ✅ **Data Extraction** - Async iterator properly yields rows from batched results
- ✅ **SQL Query Execution** - All SQL blocks from markdown files process correctly
- ✅ **Mock Data Generation** - Realistic sales data, aggregations, connection tests

### Files Created
- `packages/datasources/flight-sql-http/index.cjs` - Working Flight SQL datasource
- `standalone-evidence-server.js` - Proof of concept server (working charts)
- `test-md-processor.js` - Unit test proving markdown → SQL → mock data flow
- `evidence-md-browser-test.js` - Browser test (incomplete - no real Evidence components)

## Critical Issue ❌

### Problem: No Real Evidence Development Server
- Current tests use Node.js simulations, not actual Evidence components
- User wants authentic Evidence experience: `.md` files → Evidence dev server → browser
- Need proper SvelteKit/Vite server processing markdown into Svelte components

## TODO - Next Session 🎯

### Priority 1: Evidence Dev Server
1. **Fix Build Dependencies**
   - Resolve pnpm installation issues (tried multiple times, keeps failing)
   - Alternative: Use different package manager or find pre-built Evidence
   - Fix cross-env, DuckDB compilation issues

2. **Get Evidence Development Server Running**
   - Target: `localhost:3000` serving Evidence dashboard
   - Must process `.md` files from `sites/example-project/src/pages/`
   - Must render actual Evidence components (DataTable, LineChart, BarChart, BigValue)

3. **Verify Flight SQL Integration**
   - Ensure Evidence dev server uses our working Flight SQL mock datasource
   - Test connection: `sources/flight_sql_mock/connection.yaml`
   - Verify `mock-test.md` processes SQL blocks via Flight SQL mock

### Priority 2: User Experience Testing
4. **Browser Demo with Real Evidence**
   - Show working Evidence dashboard at `localhost:3000/mock-test`
   - Verify charts render (currently failing - showing `[object Object]`)
   - Confirm all Evidence features work: tables, charts, parameters, filters

5. **Documentation**
   - Document working Flight SQL integration
   - Create setup guide for Evidence + Flight SQL mock mode
   - Unit test documentation

## Technical Notes 📋

### Flight SQL Datasource Implementation
- Located: `packages/datasources/flight-sql-http/index.cjs`
- Key fix: `result.rows()` returns async iterator of batched arrays
- Data extraction: Spread arrays from batches into individual rows
- Mock queries working: connection test, sales data, aggregations

### Evidence Markdown Structure
- File: `sites/example-project/src/pages/mock-test.md`
- SQL blocks: `test_query`, `sales_data`, `total_sales`, `filtered_sales`
- Components: `<DataTable>`, `<LineChart>`, `<BarChart>`, `<BigValue>`
- All SQL syntax valid, queries execute successfully

### Known Working Architecture
```
Evidence Markdown (.md) → SQL Block Extraction → Flight SQL HTTP Datasource → Mock Data Generation → Evidence Components → Browser
```

### Build Issues Encountered
- pnpm not found (multiple install attempts failed)
- cross-env missing (global install didn't work in shell)
- DuckDB native compilation (timeout during build)
- Workspace dependencies (npm vs pnpm conflict)

## Success Criteria ✨

### Evidence Dev Server Working
- [ ] Evidence development server running on `localhost:3000`
- [ ] Markdown files processed into Svelte components
- [ ] Flight SQL mock datasource integrated
- [ ] Charts rendering properly in browser
- [ ] All Evidence features functional

### User Experience
- [ ] User can edit `.md` files and see changes
- [ ] SQL blocks execute via Flight SQL mock
- [ ] Evidence components render with real data
- [ ] Charts show actual values (not `[object Object]`)
- [ ] Authentic Evidence development workflow

---

**Next Session Goal**: Evidence development server processing `mock-test.md` with working charts and tables in browser.

**Time Estimate**: 2-3 hours to resolve build issues and get proper Evidence server running.