import fs from 'fs';
import path from 'path';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // Dashboard discovery - scan dashboards directory
  const dashboardsDir = path.join(process.cwd(), 'dashboards');
  
  const dashboards = [];
  
  try {
    if (!fs.existsSync(dashboardsDir)) {
      console.log('Dashboards directory not found, creating sample data...');
      return {
        dashboards: [
          {
            name: 'SalesDashboard',
            title: 'Sales Dashboard',
            description: 'Comprehensive sales analytics and performance tracking',
            lastUpdated: new Date().toLocaleDateString(),
            icon: '📈'
          },
          {
            name: 'TestDashboard', 
            title: 'Test Dashboard',
            description: 'Multi-dashboard functionality test',
            lastUpdated: new Date().toLocaleDateString(),
            icon: '🧪'
          }
        ]
      };
    }
    
    const dashboardFolders = fs.readdirSync(dashboardsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folderName of dashboardFolders) {
      const dashboardPath = path.join(dashboardsDir, folderName);
      const pageFile = path.join(dashboardPath, '+page.md');
      
      // Check if dashboard has a +page.md file
      if (fs.existsSync(pageFile)) {
        // Read first few lines to extract title/description
        const content = fs.readFileSync(pageFile, 'utf-8');
        const lines = content.split('\n');
        const title = lines.find(line => line.startsWith('# '))?.replace('# ', '') || folderName;
        const description = lines.find(line => line.startsWith('**') && line.endsWith('**'))?.replace(/\*\*/g, '') || 'Analytics dashboard';
        
        // Get last modified time
        const stats = fs.statSync(pageFile);
        const lastUpdated = stats.mtime.toLocaleDateString();
        
        // Assign icon based on dashboard name
        const icon = getIconForDashboard(folderName);
        
        dashboards.push({
          name: folderName,
          title,
          description,
          lastUpdated,
          icon
        });
      }
    }
  } catch (error) {
    console.error('Error reading dashboards directory:', error);
  }

  return {
    dashboards
  };
}

function getIconForDashboard(name) {
  const iconMap = {
    'SalesDashboard': '📈',
    'TestDashboard': '🧪', 
    'MarketingDashboard': '📢',
    'ExecutiveDashboard': '👔',
    'FinanceDashboard': '💰',
    'OperationsDashboard': '⚙️'
  };
  
  return iconMap[name] || '📊';
}