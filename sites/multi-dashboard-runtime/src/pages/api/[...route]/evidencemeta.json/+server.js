import fs from 'fs/promises';
import path from 'path';
import preprocessor from '@evidence-dev/preprocess';
import { json } from '@sveltejs/kit';
import { paths, isExampleProject } from '@evidence-dev/sdk/meta';

export const prerender = false;

/** @type {import('./$types').EntryGenerator} */
export const entries = async () => {
	const pagesDir = paths.pagesDirectory;

	const allPages = (await fs.readdir(pagesDir, { recursive: true })).filter((f) =>
		f.endsWith('.md')
	); // Discard everything that isn't a page

	const output = allPages.map((filepath) => {
		// Example Project is special
		const removal = isExampleProject ? '/+page.md' : '.md';
		let result = filepath.slice(0, -removal.length);
		if (filepath.endsWith('index.md')) result = result.replaceAll(/\/?index/g, '');
		return { route: result };
	}).filter((entry) => {
		// Skip dynamic routes that contain brackets - they're handled at runtime
		return !entry.route.includes('[') && !entry.route.includes(']');
	});

	console.log(`[API EVIDENCEMETA] Generated entries for prerendering:`, output.map(e => e.route));

	return output;
};

/** @type {import("./$types").RequestHandler} */
export async function GET({ params: { route } }) {
	if (route === '/settings') {
		const queries = [];
		return json({ queries });
	}
	
	// Handle dynamic dashboard routing
	if (route.startsWith('dashboards/')) {
		console.log(`\n🔍 [API EVIDENCEMETA] Handling dynamic dashboard route: "${route}"`);
		
		// Extract dashboard name from route
		const dashboardName = route.split('/')[1];
		console.log(`[API EVIDENCEMETA] Extracted dashboard name: "${dashboardName}"`);
		
		const dashboardDir = path.join(process.cwd(), 'dashboard-content', dashboardName);
		const dashboardFile = path.join(dashboardDir, '+page.md');
		
		console.log(`[API EVIDENCEMETA] Dashboard directory: ${dashboardDir}`);
		console.log(`[API EVIDENCEMETA] Looking for dashboard file: ${dashboardFile}`);
		
		try {
			// Check if dashboard directory exists
			await fs.access(dashboardDir);
			
			// Try to read the dashboard markdown file
			const content = await fs.readFile(dashboardFile, 'utf8');
			console.log(`[API EVIDENCEMETA] Successfully read dashboard content, length: ${content.length}`);
			
			const partialInjectedContent = preprocessor.injectPartials(content);
			const queries = preprocessor.extractQueries(partialInjectedContent);
			
			console.log(`[API EVIDENCEMETA] Extracted ${queries.length} queries from dashboard`);
			return json({ queries });
			
		} catch (error) {
			console.log(`[API EVIDENCEMETA] Error reading dashboard ${dashboardName}:`, error.message);
			// Return empty queries for missing dashboards
			return json({ queries: [] });
		}
	}
	
	// Handle static page routing (original logic)
	let routesDir;
	if ((await fs.readdir(process.cwd())).includes('src')) {
		routesDir = path.join('src', 'pages'); // example project wackiness
	} else {
		routesDir = path.join('.evidence', 'template', 'src', 'pages');
	}
	const routePath = path.join(process.cwd(), routesDir, route, '+page.md');

	try {
		const content = await fs.readFile(routePath, 'utf8');
		const partialInjectedContent = preprocessor.injectPartials(content);
		const queries = preprocessor.extractQueries(partialInjectedContent);
		return json({ queries });
	} catch (error) {
		console.log(`[API EVIDENCEMETA] Error reading static page ${route}:`, error.message);
		return json({ queries: [] });
	}
}
