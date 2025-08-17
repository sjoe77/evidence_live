import fs from 'fs';
import path from 'path';
import evidencePreprocess from '@evidence-dev/preprocess';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, request }) {
	console.log(`[Runtime Evidence] Loading dashboard: ${params.dashboard}`);
	
	// Extract OAuth headers for Evidence authentication
	const headers = request.headers;
	const oauthHeaders = {};
	
	const idToken = headers.get('x-id-token');
	const email = headers.get('x-email');
	const clientId = headers.get('x-client-id');
	
	if (idToken) oauthHeaders['X-ID-Token'] = idToken;
	if (email) oauthHeaders['X-Email'] = email;
	if (clientId) oauthHeaders['X-Client-ID'] = clientId;
	
	console.log(`[Runtime Evidence] OAuth headers available: ${Object.keys(oauthHeaders).length > 0 ? 'Yes' : 'No'}`);

	// Load dashboard content from author's file
	const dashboardPath = path.join(process.cwd(), 'dashboard-content', params.dashboard, '+page.md');
	
	let compiledComponent = '';
	let dashboardExists = false;
	let compilationError = null;
	
	try {
		if (fs.existsSync(dashboardPath)) {
			dashboardExists = true;
			const startTime = Date.now();
			
			// Read raw markdown
			const markdown = fs.readFileSync(dashboardPath, 'utf-8');
			console.log(`[Runtime Evidence] ✅ Loaded markdown: ${markdown.length} characters`);
			
			// Process with Evidence preprocessors properly  
			console.log(`[Runtime Evidence] 🔄 Starting Evidence preprocessing...`);
			
			// Get the Evidence preprocessors
			const preprocessors = evidencePreprocess(false);
			console.log(`[Runtime Evidence] Found ${preprocessors.length} preprocessors`);
			
			// Apply each preprocessor in sequence
			let content = markdown;
			let filename = dashboardPath;
			
			for (let i = 0; i < preprocessors.length; i++) {
				const preprocessor = preprocessors[i];
				console.log(`[Runtime Evidence] Processing with preprocessor ${i}...`);
				
				if (preprocessor && preprocessor.markup) {
					try {
						const result = await preprocessor.markup({ 
							content, 
							filename 
						});
						
						if (result && result.code !== undefined) {
							content = result.code;
							console.log(`[Runtime Evidence] ✅ Preprocessor ${i} success - output: ${content.length} chars`);
						} else if (result === undefined) {
							console.log(`[Runtime Evidence] ⏭️  Preprocessor ${i} skipped (not applicable)`);
						} else {
							console.log(`[Runtime Evidence] ⚠️  Preprocessor ${i} returned:`, typeof result);
						}
					} catch (error) {
						console.error(`[Runtime Evidence] ❌ Preprocessor ${i} failed:`, error.message);
						// Don't fail the whole pipeline for one preprocessor
						continue;
					}
				}
			}
			
			const processed = { code: content };
			
			compiledComponent = processed.code;
			const duration = Date.now() - startTime;
			
			console.log(`[Runtime Evidence] ✅ Compilation completed in ${duration}ms`);
			console.log(`[Runtime Evidence] Output preview: ${compiledComponent.substring(0, 200)}...`);
			
		} else {
			console.log(`[Runtime Evidence] ❌ Dashboard not found: ${dashboardPath}`);
			compiledComponent = `<h1>Dashboard Not Found</h1><p>The dashboard "${params.dashboard}" does not exist.</p><p>Create it at: <code>/dashboards/${params.dashboard}/+page.md</code></p>`;
		}
	} catch (error) {
		console.error(`[Runtime Evidence] ❌ Compilation error:`, error);
		compilationError = error.message;
		compiledComponent = `<h1>Compilation Error</h1><p>Failed to process dashboard "${params.dashboard}":</p><pre>${error.message}</pre>`;
	}

	return {
		dashboard: params.dashboard,
		compiledComponent,
		dashboardExists,
		compilationError,
		oauthHeaders
	};
}