import fs from 'fs';
import path from 'path';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		const dashboardPath = path.join(process.cwd(), 'dashboards', params.dashboard, '+page.md');
		
		if (fs.existsSync(dashboardPath)) {
			const content = fs.readFileSync(dashboardPath, 'utf-8');
			return new Response(content, {
				headers: {
					'Content-Type': 'text/plain'
				}
			});
		} else {
			return new Response('Dashboard not found', { status: 404 });
		}
	} catch (error) {
		return new Response('Error reading dashboard', { status: 500 });
	}
}