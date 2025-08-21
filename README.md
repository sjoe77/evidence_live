# Evidence Dashboard Template

A production-ready Evidence dashboard template with Flight SQL integration for DuckLake data sources.

## 🚀 Quick Start

### 1. Clone this template
```bash
git clone https://github.com/your-org/evidence-dashboard-template.git my-dashboard
cd my-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure your data source
Edit `sources/flight_sql/connection.yaml`:
```yaml
name: flight_sql
type: flight-sql-http
options:
  endpoint: "http://localhost:4180/query"  # Your Flight SQL endpoint
  timeout: 30000
```

### 4. Start development
```bash
npm run dev
```
Open http://localhost:3000 to see your dashboard.

## 📊 What's Included

### Sample Dashboard (`pages/index.md`)
- **Claims Analytics**: Bar charts showing claims by status and country
- **Key Metrics**: Big value cards for total claims and resolution rate  
- **Data Table**: Recent claims with filtering and sorting
- **Live Data**: All queries execute against your Flight SQL/DuckLake stack

### Evidence Features Demonstrated
- 📈 **Charts**: BarChart with live data
- 📋 **Tables**: DataTable with pagination
- 🎯 **Metrics**: BigValue cards
- 🔄 **Live Queries**: Real-time SQL execution

## 🔧 Development Workflow

### Local Development with DuckLake Stack
1. **Start your DuckLake stack**:
   ```bash
   cd /path/to/ducklake_auth_stack
   source .venv/bin/activate
   ./run_stack_simple.sh
   ```

2. **Start Evidence dashboard**:
   ```bash
   npm run dev
   ```

3. **Edit and see changes**:
   - Modify `pages/index.md`
   - Save file → Browser auto-refreshes
   - All SQL queries execute against live DuckLake data

### Authentication Integration
The template is configured for OAuth proxy integration:
- **Development**: Direct connection to `localhost:4180`
- **Production**: Environment variable `FLIGHT_SQL_ENDPOINT` 
- **CORS**: Configured for cross-origin requests from Evidence

## 🚀 Deployment

### GitHub Actions (Recommended)
1. **Set environment variables** in your GitHub repository:
   ```
   FLIGHT_SQL_ENDPOINT=https://your-production-endpoint.com/query
   AWS_ACCESS_KEY_ID=your-aws-key (optional)
   AWS_SECRET_ACCESS_KEY=your-aws-secret (optional)
   S3_BUCKET=your-s3-bucket (optional)
   ```

2. **Push to main branch**:
   ```bash
   git add -A
   git commit -m "Deploy dashboard"
   git push origin main
   ```

3. **Built dashboard** automatically deployed to:
   - S3 bucket (if configured)
   - GitHub Actions artifacts (always available)

### Manual Deployment
```bash
npm run build
# Upload ./build/ directory to your static hosting
```

## 📁 Project Structure

```
evidence-dashboard-template/
├── pages/
│   └── index.md                    # Main dashboard
├── sources/
│   └── flight_sql/
│       └── connection.yaml         # Data source configuration
├── evidence.config.yaml            # Evidence settings
├── package.json                    # Dependencies
├── .github/workflows/
│   └── deploy.yml                  # Automated deployment
└── README.md                       # This file
```

## 🔄 Customizing Your Dashboard

### Add New Pages
Create markdown files in `pages/`:
```bash
# Add new dashboard page
touch pages/sales-report.md
```

### Modify Queries
Edit SQL in your markdown files:
```sql
-- Your SQL queries here
SELECT * FROM your_table 
WHERE your_condition = 'value'
```

### Add Evidence Components
Use any Evidence component:
```markdown
<LineChart data={your_query} x=date y=value />
<DataTable data={your_query} />
<BigValue data={your_query} value=metric />
```

## 🔗 Flight SQL Integration

### Connection Configuration
The template uses `@evidence-dev/flight-sql-http` datasource:
- **HTTP POST** requests to your Flight SQL endpoint
- **JSON payload**: `{"query": "SELECT ...", "timeout": 30000}`
- **Response format**: `{"columns": [...], "results": [[...]]}`

### Data Flow
```
Evidence Dashboard → Flight SQL HTTP → OAuth Proxy → DuckLake → Your Data
```

### Environment Variables
- **Development**: `localhost:4180/query`
- **Production**: `$FLIGHT_SQL_ENDPOINT` from GitHub secrets

## 📚 Resources

- **Evidence Documentation**: https://docs.evidence.dev
- **Evidence Components**: https://docs.evidence.dev/components
- **Flight SQL**: https://arrow.apache.org/docs/format/FlightSql.html
- **DuckDB**: https://duckdb.org/docs/

## 🛠️ Troubleshooting

### Connection Issues
```bash
# Test your Flight SQL endpoint
curl -X POST http://localhost:4180/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1 as test"}'
```

### Development Issues
```bash
# Check Evidence logs
npm run dev --verbose

# Clear Evidence cache
rm -rf .evidence
```

### Build Issues
```bash
# Check build output
npm run build --verbose

# Verify dependencies
npm list @evidence-dev/evidence
```

## 🎯 Next Steps

1. **Customize the dashboard** for your specific data and use cases
2. **Add more pages** for different team needs
3. **Configure deployment** to your preferred hosting platform
4. **Set up monitoring** for your dashboard in production
5. **Share with your team** and gather feedback

---

**🚀 Happy Dashboarding with Evidence + Flight SQL + DuckLake!**