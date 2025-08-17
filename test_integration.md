# Integration Testing Guide

## Testing the Evidence + DuckLake Auth Stack Integration

### 1. Start the DuckLake Auth Stack
```bash
cd /Users/rajesh/ducklake_auth_stack
python run_stack.py
```

This starts:
- OAuth Proxy (port 4180) 
- HTTP Middleware (port 31338)
- Flight SQL Server (port 31337)

### 2. Start Evidence Runtime
```bash
cd /Users/rajesh/evidence_live/sites/multi-dashboard-runtime
npm run dev
```

This starts Evidence on port 3000.

### 3. Test Authentication Flow

**URL to Test**: `http://localhost:4180/dashboards/SalesDashboard`

**Expected Flow**:
1. Browser → OAuth Proxy (4180)
2. OAuth authentication (if not logged in)
3. OAuth Proxy → Evidence Runtime (3000) 
4. Evidence → OAuth Proxy → HTTP Middleware (31338) → Flight SQL (31337)
5. Dashboard renders with live data

### 4. Verify Integration Points

#### A. OAuth Proxy Routes
- ✅ `/dashboards` routes to Evidence (port 3000)
- ✅ Authentication headers injected: `X-ID-Token`, `X-Email`, `X-Client-ID`

#### B. Evidence Configuration  
- ✅ Flight SQL datasource pointing to OAuth proxy `/query` endpoint
- ✅ Evidence accepting authentication headers via server hooks
- ✅ Port changed from 3030 to 3000

#### C. Data Flow
```
Browser Request → OAuth Proxy (4180) → Evidence (3000) 
                     ↓
Evidence SQL Query → OAuth Proxy (4180) → HTTP Middleware (31338) → Flight SQL (31337)
                     ↓ 
Dashboard Rendering ← Evidence (3000) ← OAuth Proxy (4180) ← HTTP Middleware Response
```

### 5. Debug Logs to Check

**OAuth Proxy Logs**:
- Look for `/dashboards` route handling
- Authentication header injection
- Proxy requests to Evidence

**Evidence Logs**:
- Authentication header reception
- SQL query execution via Flight SQL datasource
- Dashboard rendering

**HTTP Middleware Logs**:
- SQL query reception from Evidence
- Authentication context processing
- Query execution against Flight SQL

### 6. Test Dashboards

Available test dashboards:
- `/dashboards/SalesDashboard` - Sales analytics with charts
- `/dashboards/TestDashboard` - Simple test dashboard

### 7. Success Criteria

- ✅ Authentication required to access dashboards
- ✅ Dashboards render with live data from ducklake
- ✅ All Evidence components work (charts, tables, filters)
- ✅ User context propagated through entire chain
- ✅ Fast query performance (15-25ms total latency)

### 8. Troubleshooting

**Common Issues**:
- Port conflicts (ensure Evidence on 3000, not 3030)
- Authentication headers not forwarding
- CORS issues between services
- Flight SQL datasource configuration errors

**Debug Commands**:
```bash
# Check service status
python run_stack.py --status

# View logs
python run_stack.py --logs

# Test HTTP middleware directly
curl "http://localhost:4180/query?q=SELECT%20status,%20count(*)%20FROM%20my_ducklake.main.claims%20group%20by%20status"
```