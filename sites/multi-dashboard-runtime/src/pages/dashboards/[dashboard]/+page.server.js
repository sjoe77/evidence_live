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
	const dashboardPath = path.join(process.cwd(), 'dashboards', params.dashboard, '+page.md');
	
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
			
			// Use Evidence's actual preprocessing system
			console.log(`[Runtime Evidence] Using Evidence's built-in preprocessing...`);
			
			const preprocessors = evidencePreprocess(false);
			console.log(`[Runtime Evidence] Found ${preprocessors.length} Evidence preprocessors`);
			
			let content = markdown;
			let filename = dashboardPath;
			
			// Apply Evidence preprocessors in sequence
			for (let i = 0; i < preprocessors.length; i++) {
				const preprocessor = preprocessors[i];
				console.log(`[Runtime Evidence] Applying preprocessor ${i}...`);
				
				if (preprocessor && preprocessor.markup) {
					try {
						const result = await preprocessor.markup({ 
							content, 
							filename 
						});
						
						if (result && result.code !== undefined) {
							content = result.code;
							console.log(`[Runtime Evidence] ✅ Preprocessor ${i} success - ${content.length} chars`);
						} else if (result === undefined) {
							console.log(`[Runtime Evidence] ⏭️  Preprocessor ${i} skipped`);
						} else {
							console.log(`[Runtime Evidence] ⚠️  Preprocessor ${i} returned:`, typeof result);
						}
					} catch (error) {
						console.error(`[Runtime Evidence] ❌ Preprocessor ${i} failed:`, error.message);
						continue;
					}
				}
			}
			
			// Parse Evidence's processed template dynamically
			console.log(`[Runtime Evidence] 🔧 Parsing Evidence template structure...`);
			
			// Extract Evidence components and their props from the template
			const components = [];
			const componentRegex = /<(\w+)\s+([^>]+)(?:\/>|>[\s\S]*?<\/\1>)/g;
			let match;
			
			while ((match = componentRegex.exec(content)) !== null) {
				const componentName = match[1];
				const propsString = match[2];
				const fullMatch = match[0];
				
				// Skip non-Evidence components (lowercase HTML tags)
				if (componentName[0] === componentName[0].toLowerCase()) continue;
				
				// Parse props from the string
				const props = {};
				const propRegex = /(\w+)=(?:{([^}]+)}|"([^"]+)"|(\w+))/g;
				let propMatch;
				
				while ((propMatch = propRegex.exec(propsString)) !== null) {
					const propName = propMatch[1];
					const propValue = propMatch[2] || propMatch[3] || propMatch[4]; // handle {}, "", or bare values
					
					// Special handling for Evidence prop formats
					if (propName === 'value' || propName === 'x' || propName === 'y') {
						// Remove quotes if present - these should be field names
						props[propName] = propValue.replace(/['"]/g, '');
					} else {
						props[propName] = propValue;
					}
				}
				
				// Special handling for Dropdown with nested DropdownOptions
				if (componentName === 'Dropdown') {
					const dropdownOptions = [];
					const optionRegex = /<DropdownOption\s+([^>]+)\s*\/>/g;
					let optionMatch;
					
					while ((optionMatch = optionRegex.exec(fullMatch)) !== null) {
						const optionPropsString = optionMatch[1];
						const optionProps = {};
						const optionPropRegex = /(\w+)=(?:{([^}]+)}|"([^"]+)"|(\w+))/g;
						let optionPropMatch;
						
						while ((optionPropMatch = optionPropRegex.exec(optionPropsString)) !== null) {
							const propName = optionPropMatch[1];
							const propValue = optionPropMatch[2] || optionPropMatch[3] || optionPropMatch[4];
							optionProps[propName] = propValue;
						}
						
						dropdownOptions.push({
							value: optionProps.value,
							valueLabel: optionProps.valueLabel
						});
					}
					
					// Add the options as a special prop
					if (dropdownOptions.length > 0) {
						props.dropdownOptions = dropdownOptions;
					}
					
					console.log(`[Runtime Evidence] Extracted ${dropdownOptions.length} dropdown options for ${props.name}`);
				}
				
				components.push({
					name: componentName,
					props: props,
					fullMatch: match[0]
				});
			}
			
			console.log(`[Runtime Evidence] Found ${components.length} Evidence components:`, 
				components.map(c => `${c.name}(${Object.keys(c.props).join(', ')})`));
			
			// Extract queries referenced in components
			const queryNames = new Set();
			components.forEach(comp => {
				if (comp.props.data && !comp.props.data.includes('"')) {
					queryNames.add(comp.props.data);
				}
			});
			
			console.log(`[Runtime Evidence] Queries needed:`, Array.from(queryNames));
			
			// DEBUG: Show what Evidence preprocessing actually outputs
			console.log(`[Runtime Evidence] Raw content sample:`, content.substring(0, 1500));
			console.log(`[Runtime Evidence] Looking for undefined patterns...`);
			
			// Debug: Find all potential undefined sources
			const undefinedMatches = content.match(/undefined/g);
			if (undefinedMatches) {
				console.log(`[Runtime Evidence] Found ${undefinedMatches.length} 'undefined' occurrences`);
				
				// Show context around undefined
				const lines = content.split('\n');
				lines.forEach((line, index) => {
					if (line.includes('undefined')) {
						console.log(`[Runtime Evidence] Line ${index}: "${line}"`);
					}
				});
			}
			
			// Create clean HTML structure with proper component positioning
			let htmlContent = content
				// Remove Svelte-specific blocks
				.replace(/{#if typeof metadata[^}]+}[\s\S]*?{\/if}/g, '')
				.replace(/<svelte:head>[\s\S]*?<\/svelte:head>/g, '')
				.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
				// Remove query viewer blocks but keep markers
				.replace(/{#if\s+(\w+)\s*}[\s\S]*?{\/if}/g, (match, queryName) => {
					return `<div class="query-marker" data-query="${queryName}"></div>`;
				})
				// FIRST: Handle input value display like {inputs.hardcoded.value}
				.replace(/{inputs\.(\w+)\.value}/g, (match, inputName) => {
					return `<span class="input-value-display" data-input="${inputName}">None selected</span>`;
				})
				// AGGRESSIVE: Remove ALL undefined occurrences first
				.replace(/undefined/g, '')
				// THEN: Remove specific Evidence metadata expressions
				.replace(/{\$?evidencemeta[\w\.\[\]]*}/g, '')
				.replace(/{\$?metadata[\w\.\[\]]*}/g, '')
				.replace(/{\$?data[\w\.\[\]]*}/g, '')
				.replace(/{\$?page[\w\.\[\]]*}/g, '')
				.replace(/{typeof\s+[^}]+}/g, '')
				.replace(/{\w+\?\.\w+[\w\.\[\]]*}/g, '')  // Optional chaining expressions
				// Remove Evidence variable patterns that become undefined
				.replace(/{\$[\w\.\[\]]+}/g, '')
				.replace(/{@[\w\s]+}/g, '')
				// Clean up any standalone curly braces that might remain
				.replace(/{\s*}/g, '')
				// Clean up multiple spaces
				.replace(/\s{3,}/g, ' ')
				// Clean up extra whitespace and newlines
				.replace(/\n\s*\n\s*\n/g, '\n\n')
				.replace(/^\s+|\s+$/gm, '');

			// Track component index for proper ordering (only count non-QueryViewer components)
			let componentIndex = 0;
			
			// Replace Evidence components with placeholders that include positioning info
			htmlContent = htmlContent.replace(/<(\w+)\s+([^>]+)(?:\/>|>[\s\S]*?<\/\1>)/g, (match, componentName, props) => {
				if (componentName[0] === componentName[0].toLowerCase()) return match; // Skip HTML tags
				
				// Skip QueryViewer components entirely
				if (componentName === 'QueryViewer') {
					return ''; // Remove QueryViewer components completely
				}
				
				const placeholder = `<div class="evidence-component-placeholder" 
					data-component-index="${componentIndex}" 
					data-component="${componentName}" 
					data-props="${props.replace(/"/g, '&quot;')}"
					style="margin: 1rem 0; min-height: 200px; border: 1px dashed #ddd; padding: 1rem; text-align: center;">
					Loading ${componentName}...
				</div>`;
				componentIndex++;
				return placeholder;
			});
			
			// Return structured data for client-side rendering
			compiledComponent = JSON.stringify({
				html: htmlContent,
				components: components,
				queryNames: Array.from(queryNames),
				originalTemplate: content
			});
			
			const duration = Date.now() - startTime;
			console.log(`[Runtime Evidence] ✅ Total processing completed in ${duration}ms`);
			
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