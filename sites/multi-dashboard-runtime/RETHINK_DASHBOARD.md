# RETHINK DASHBOARD ARCHITECTURE

## Overview: Official Evidence + GitHub Actions + Flight SQL

After extensive testing of runtime hybrid approaches, we're pivoting to **Official Evidence** with intelligent deployment. This gives us full Evidence functionality while maintaining scalable architecture.

---

## Core Architecture Decision

### ❌ Abandoned: Runtime Hybrid Approach
- **Problem**: Fighting Evidence's static rendering design
- **Issues**: ECharts lifecycle problems, complex reactivity, limited Evidence features
- **Conclusion**: Runtime compilation breaks Evidence's reactive component system

### ✅ New Approach: Official Evidence + Smart Deployment
- **Strategy**: Use Evidence as designed, but with intelligent per-dashboard builds
- **Benefits**: Full Evidence functionality, perfect developer experience, scalable deployment
- **Philosophy**: Work WITH Evidence's architecture, not against it

---

## Architecture Overview

### Development Flow
```
Dashboard Author → Edit Markdown → npm run dev → Instant Evidence Experience
                                     ↓
                              Live Flight SQL Data (via OAuth)
```

### Production Flow  
```
Dashboard Author → Push to GitHub → GitHub Action Build → Deploy to S3 → Live Dashboard
```

### Runtime Flow
```
Browser → Static Evidence App (S3) → OAuth Proxy → Flight SQL → DuckLake
```

---

## Repository Strategy

### Option A: Single Repository (Recommended Start)
```
evidence-dashboards/
├── dashboards/
│   ├── sales-team/
│   │   ├── SalesDashboard/
│   │   └── RevenueDashboard/ 
│   ├── marketing-team/
│   │   ├── CampaignDashboard/
│   │   └── LeadsDashboard/
├── packages/
│   ├── flight-sql-plugin/        # Your Flight SQL Evidence source
│   └── custom-components/        # Any custom Evidence components
└── .github/workflows/
    └── build-dashboard.yml       # Smart build - only changed dashboards
```

**Benefits:**
- Simple management, shared resources
- Smart GitHub Action only builds changed dashboards
- Easy cross-dashboard references
- Single CI/CD pipeline to perfect

### Option B: Multiple Repositories (Enterprise Scale)
```
sales-dashboard-repo/          marketing-dashboard-repo/
├── pages/                    ├── pages/
├── sources/flight_sql/       ├── sources/flight_sql/
└── .github/workflows/        └── .github/workflows/
```

**Benefits:**
- Perfect access control (repo-level permissions)
- Team isolation
- Independent deployment cycles

---

## Development Workflow

### Developer Setup
```bash
# Option 1: Cloud Dev DuckLake (Recommended)
git clone sales-dashboard-repo
cd sales-dashboard-repo
npm install
npm run dev  # Points to https://dev-ducklake.company.com:4180

# Option 2: Local DuckLake Stack
cd ducklake_auth_stack && ./run_stack_simple.sh  # Terminal 1
cd sales-dashboard-repo && npm run dev           # Terminal 2
```

### Developer Experience
```
Edit index.md → Save → Instant browser refresh → See changes with live DuckLake data
```

**Key Points:**
- **No build step needed** for development
- **No `npm run sources`** - Flight SQL provides live data
- **Full Evidence reactivity** - dropdowns, charts, inputs all work perfectly
- **Real data testing** - develop against actual DuckLake data

---

## Authentication Integration

### The OAuth Challenge
**Problem**: Evidence JavaScript fetch() calls to Flight SQL need authentication

**Solution**: Pre-authentication check with graceful OAuth redirect

### Implementation
```javascript
// Evidence Flight SQL source checks auth first
async function ensureAuthenticated() {
  try {
    const response = await fetch(`${FLIGHT_SQL_ENDPOINT}/auth/status`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      // Redirect user to OAuth login
      window.location.href = `${FLIGHT_SQL_ENDPOINT}/auth`;
      return false;
    }
    return true;
  } catch (error) {
    window.location.href = `${FLIGHT_SQL_ENDPOINT}/auth`;
    return false;
  }
}

// Before making queries
if (await ensureAuthenticated()) {
  // Now make API calls with session cookie
  const result = await fetch(`${FLIGHT_SQL_ENDPOINT}/query`, { 
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ sql })
  });
}
```

### Developer Auth Flow
1. **Start Evidence**: `npm run dev`
2. **Open browser**: `http://localhost:3000`  
3. **First query triggers auth check**: No cookie → redirect to OAuth
4. **Login once**: OAuth flow, get session cookie, redirect back
5. **Evidence works**: All subsequent queries authenticated via cookie

### Production Auth Flow
```
Browser → https://dashboards.company.com/sales → OAuth Proxy (cookie check) →
Static Evidence App → Flight SQL API calls (with cookie) → DuckLake
```

---

## CORS Configuration

### Development
```python
# Your OAuth proxy needs to allow Evidence dev server
CORS_ORIGINS = [
    'http://localhost:3000',           # Evidence dev server
    'https://dashboards.company.com'   # Production domain
]
```

### Headers
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Build & Deployment

### GitHub Actions Build Process
```yaml
name: Build & Deploy Dashboard
on:
  push:
    paths: ['dashboards/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # Install Flight SQL plugin + Evidence
      - name: Install Dependencies
        run: |
          cd packages/flight-sql-plugin && npm install && npm run build
          cd dashboards/${{ matrix.dashboard }}
          npm install ../../packages/flight-sql-plugin
          
      # Build Evidence (no sources step needed)
      - name: Build Evidence Dashboard  
        run: |
          cd dashboards/${{ matrix.dashboard }}
          npm run build  # Evidence build with Flight SQL config
          
      # Deploy static files to S3
      - name: Deploy to S3
        run: |
          aws s3 sync ./built s3://dashboards/${{ matrix.dashboard }}/
```

### Evidence Configuration (No Sources)
```yaml
# evidence.config.yaml  
sources:
  main:
    type: flight-sql-http
    endpoint: ${FLIGHT_SQL_ENDPOINT}  # Environment specific

# Skip sources step - Flight SQL provides live data
build:
  skipSources: true
```

### Build Output (Static Files)
```
s3://dashboards/SalesDashboard/
├── index.html              # Evidence dashboard
├── _app/
│   ├── immutable/          # Compiled Svelte/Evidence
│   └── version.json
└── static/                 # Assets
```

---

## Flight SQL Source Implementation

### Evidence Source Plugin Structure
```
packages/flight-sql-plugin/
├── src/
│   ├── index.js           # Evidence source implementation
│   └── browser.js         # Browser-side query execution
├── package.json
└── evidence.plugin.yaml   # Evidence plugin config
```

### Browser Query Execution
```javascript
// Flight SQL source handles reactive queries from browser
export async function executeQuery(sql, options = {}) {
  // Pre-auth check
  if (!(await ensureAuthenticated())) {
    throw new Error('Authentication required');
  }
  
  // Execute query via OAuth proxy
  const response = await fetch(`${endpoint}/query`, {
    method: 'POST',
    credentials: 'include',  // Include session cookie
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  
  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  // Convert DuckLake format to Evidence format
  if (result.columns && result.results) {
    return result.results.map(row => {
      const obj = {};
      result.columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  }
  
  return result;
}
```

---

## Evidence Reactive Queries

### How Input Components Work
```markdown
<Dropdown name="status_filter">
  <DropdownOption value="Pending" />
  <DropdownOption value="Resolved" />
</Dropdown>

```sql claims_by_status
SELECT status, count(*) as total_claims
FROM my_ducklake.main.claims 
WHERE status = '${inputs.status_filter.value}'
GROUP BY status
```

<BarChart data={claims_by_status} x=status y=total_claims />
```

### Reactive Flow
```
User changes dropdown → Evidence reactive store updates → 
SQL template re-evaluated → Browser calls Flight SQL → 
Chart updates with new data
```

**All client-side, no server rebuild needed!**

---

## Deployment Architecture

### Production Stack
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Browser           │    │   OAuth Proxy       │    │   Flight SQL        │
│                     │    │   (Port 4180)       │    │   DuckLake Stack    │
│ Evidence Static App │────→│ Cookie validation   │────→│ HTTP Middleware     │
│ (S3 + CloudFront)   │    │ Header injection    │    │ (Port 31338)        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### URL Structure
```
https://dashboards.company.com/sales     → S3: sales-dashboard/index.html
https://dashboards.company.com/marketing → S3: marketing-dashboard/index.html
```

### Header Flow
```
Browser request → OAuth Proxy → Adds headers:
                                - X-ID-Token: user-jwt-token
                                - X-Email: user@company.com  
                                - X-Client-ID: dashboard-app
                                ↓
                              HTTP Middleware → Flight SQL → DuckLake
```

---

## Configuration Management

### Environment-Specific Configs

**Development:**
```yaml
# evidence.config.yaml
sources:
  main:
    type: flight-sql-http
    endpoint: http://localhost:4180/query  # Local DuckLake
    # OR: https://dev-ducklake.company.com:4180/query  # Cloud dev
```

**Production (GitHub Actions):**
```yaml
sources:
  main:
    type: flight-sql-http  
    endpoint: https://ducklake.company.com:4180/query
```

### Build-Time Environment Variables
```bash
# GitHub Actions environment
FLIGHT_SQL_ENDPOINT=https://ducklake.company.com:4180/query
EVIDENCE_ENV=production

# Developer environment  
FLIGHT_SQL_ENDPOINT=http://localhost:4180/query
EVIDENCE_ENV=development
```

---

## Benefits Summary

### ✅ Full Evidence Functionality
- All Evidence components work perfectly (charts, tables, inputs)
- Complete reactivity (dropdowns filter charts instantly)
- All Evidence features (conditionals, loops, layouts)
- Perfect developer experience (`npm run dev`)

### ✅ Scalable Architecture  
- GitHub Actions handle CPU-intensive builds
- Static deployment to S3/CDN
- Independent dashboard scaling
- Multi-tenant ready (repo per team)

### ✅ Security & Access Control
- OAuth proxy handles all authentication
- Repository-level access control
- Audit trail via git history
- No credentials in Evidence code

### ✅ Operational Simplicity
- No Evidence server runtime needed
- Static file serving only
- Existing DuckLake infrastructure
- Standard web deployment patterns

---

## Migration Path

### Phase 1: Proof of Concept
1. Create single Evidence dashboard with Flight SQL source
2. Test local development workflow
3. Set up GitHub Action for single dashboard
4. Verify OAuth integration

### Phase 2: Multi-Dashboard
1. Expand to 2-3 dashboards
2. Perfect GitHub Action for changed-dashboard detection
3. Set up S3 deployment structure
4. Test production OAuth flow

### Phase 3: Team Adoption
1. Migrate existing dashboards  
2. Train dashboard authors
3. Set up team repository access
4. Document standard practices

### Phase 4: Scale
1. Multiple repositories for team isolation
2. Advanced GitHub Actions (parallel builds)
3. CDN optimization
4. Monitoring and alerting

---

## Technical Decisions

### Why Official Evidence?
- **Proven architecture** - Evidence is battle-tested
- **Full feature set** - no limitations or workarounds
- **Great developer experience** - instant feedback, hot reload
- **Component ecosystem** - all Evidence components work

### Why GitHub Actions?
- **Zero infrastructure** - no build servers to manage
- **Scalable** - automatic parallel builds
- **Version control integration** - git history, PRs, reviews
- **Cost effective** - free for reasonable usage

### Why Static Deployment?
- **Performance** - CDN-cached static files
- **Scalability** - no server scaling needed  
- **Reliability** - static files rarely fail
- **Security** - minimal attack surface

### Why Flight SQL Source?
- **Live data** - no static parquet generation
- **Real-time** - always current data
- **Familiar** - reuses existing DuckLake infrastructure
- **Performant** - 10ms query response times

---

## Next Steps

1. **Create Flight SQL Evidence plugin** - package your existing integration
2. **Set up single Evidence dashboard** - test full workflow
3. **Configure GitHub Action** - automate build and deploy
4. **Test OAuth integration** - ensure auth flow works end-to-end
5. **Document developer onboarding** - make it easy for teams to adopt

This architecture gives us the best of all worlds: Evidence's great developer experience, GitHub's scalable CI/CD, and your high-performance DuckLake data stack.