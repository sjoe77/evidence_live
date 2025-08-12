import fs from 'fs';
import path from 'path';
import { error } from '@sveltejs/kit';
import { extractQueries } from '@evidence-dev/preprocess';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const { dashboard } = params;
  
  // Validate dashboard name (security: prevent directory traversal)
  if (!dashboard || !/^[a-zA-Z0-9_-]+$/.test(dashboard)) {
    throw error(404, 'Dashboard not found');
  }
  
  const dashboardDir = path.join(process.cwd(), 'dashboards', dashboard);
  const pageFile = path.join(dashboardDir, '+page.md');
  
  try {
    // Check if dashboard directory and page file exist
    if (!fs.existsSync(dashboardDir) || !fs.existsSync(pageFile)) {
      throw error(404, `Dashboard '${dashboard}' not found`);
    }
    
    // Read dashboard content
    const content = fs.readFileSync(pageFile, 'utf-8');
    
    // Extract metadata from markdown
    const lines = content.split('\n');
    const title = lines.find(line => line.startsWith('# '))?.replace('# ', '') || dashboard;
    const description = lines.find(line => line.startsWith('**') && line.endsWith('**'))?.replace(/\*\*/g, '') || 'Analytics dashboard';
    
    // Get file stats
    const stats = fs.statSync(pageFile);
    const lastUpdated = stats.mtime.toLocaleDateString();
    
    console.log(`[DASHBOARD] Loading '${dashboard}' from: ${dashboardDir}`);
    
    return {
      dashboard,
      title,
      description,
      lastUpdated,
      content,
      dashboardDir: `dashboards/${dashboard}/` // For display purposes
    };
    
  } catch (err) {
    if (err.status === 404) {
      throw err;
    }
    console.error(`[DASHBOARD] Error loading dashboard '${dashboard}':`, err);
    throw error(500, 'Error loading dashboard');
  }
}