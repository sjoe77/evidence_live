# Multi-Dashboard Evidence System

Welcome to your **multi-dashboard Evidence runtime** - a single server that can serve unlimited dashboards from separate directories.

## 📊 Organization Dashboards

**[View All Dashboards →](/dashboards)**

## System Architecture

✅ **Multi-Dashboard Support** - Single Evidence runtime serves multiple dashboards  
✅ **Separate Directories** - Each dashboard lives in `dashboards/Name/` folder  
✅ **Dynamic Routing** - `/dashboards/{name}` works for any dashboard automatically  
✅ **S3 Ready** - Dashboard directories can be S3 folders in production  
✅ **Flight SQL Integration** - Live queries with mock mode for development

## How It Works

1. **Dashboard Discovery** - Automatically finds dashboards in separate directories
2. **Dynamic Loading** - Single `[dashboard]` route handles all dashboards  
3. **Content Isolation** - Each dashboard independent in its own folder
4. **Live Queries** - SQL queries execute in real-time via Flight SQL

## Development

- **Port**: Running on 3030 (non-conflicting)
- **Mock Mode**: Flight SQL mock active for testing
- **Settings**: Available in [Settings](/settings/) page

---

*Ready for multi-tenant dashboard deployment with S3 folder integration*