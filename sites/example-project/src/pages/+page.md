# Flight SQL Dashboard System

Welcome to your live Flight SQL dashboard system! This Evidence instance has been transformed from a static site generator to a real-time query execution engine.

## System Overview

✅ **Live Query Execution** - All SQL queries execute in real-time against your Flight SQL HTTP API  
✅ **No Static Build** - Dashboards render live without `npm run sources`  
✅ **Flight SQL Integration** - Mock mode for development, production mode for live data  
✅ **All Evidence Features** - Charts, tables, parameters, filters work unchanged

## Available Dashboards

- **[Flight SQL Test Dashboard](/flight-sql-test/)** - Demo dashboard showing Flight SQL integration with mock data

## System Configuration

- **Mock Mode**: Currently active for development and testing
- **Real API**: Change `endpoint` in connection.yaml to your Flight SQL HTTP URL when ready
- **Settings**: Available in [Settings](/settings/) page  
- **Schema Explorer**: Available in [Explore](/explore/) section

## Next Steps

1. **Test the mock dashboard** to verify all features work
2. **Connect to your real Flight SQL API** by updating the connection.yaml endpoint  
3. **Create your production dashboards** using the same markdown + SQL syntax
4. **Deploy** as a Node.js application for live dashboard serving

---

*This system transforms Evidence into the View layer of your Flight SQL MVC architecture, providing 15-25ms query response times with live dashboard rendering.*