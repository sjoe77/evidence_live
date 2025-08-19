<script>
	import { BarChart, BigValue, DataTable, Dropdown, DropdownOption, TextInput, DateRange, Checkbox } from '@evidence-dev/core-components';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	
	/** @type {import('./$types').PageData} */
	export let data;
	
	// Create Evidence-style inputs store for form components
	const inputValues = writable({});
	
	// Create Evidence inputs interface that components expect
	const inputs = new Proxy({}, {
		get(target, prop) {
			return {
				value: writable(null),
				subscribe: (callback) => {
					return inputValues.subscribe(values => {
						callback(values[prop] || null);
					});
				}
			};
		}
	});
	
	// Re-execute queries when input values change (simple approach - re-run all queries)
	let lastMarkdownContent = '';
	let dashboardData = null;
	let sqlQueries = {};
	let components = [];
	
	inputValues.subscribe(values => {
		if (typeof window !== 'undefined') {
			// Update input value displays
			Object.keys(values).forEach(inputName => {
				const displays = document.querySelectorAll(`[data-input="${inputName}"]`);
				displays.forEach(display => {
					display.textContent = values[inputName] || 'None selected';
				});
			});
			
			// Re-execute all queries with new input values (only if dashboard is already loaded)
			if (dashboardData && lastMarkdownContent) {
				console.log('[Evidence] Input values changed, re-executing queries...');
				reExecuteAllQueries(lastMarkdownContent);
			}
		}
	});
	
	// Function to re-execute all queries (called when inputs change)
	function reExecuteAllQueries(markdownContent) {
		const sqlBlocks = markdownContent.match(/```sql\s+(\w+)\n([\s\S]*?)```/g) || [];
		
		// Create new sqlQueries object to trigger Svelte reactivity
		const newSqlQueries = { ...sqlQueries };
		
		sqlBlocks.forEach(block => {
			const match = block.match(/```sql\s+(\w+)\n([\s\S]*?)```/);
			if (match) {
				const queryName = match[1];
				const sqlCode = match[2].trim();
				
				// Only re-execute queries that Evidence components actually reference
				if (dashboardData.queryNames.includes(queryName)) {
					console.log(`[Evidence] Re-executing query: ${queryName}`);
					// Keep the old promise while the new one resolves to prevent chart disappearing
					const oldPromise = sqlQueries[queryName];
					const newPromise = executeQuery(queryName, sqlCode);
					
					// Update immediately with new promise
					newSqlQueries[queryName] = newPromise;
					
					// Log when new promise completes
					newPromise.then(result => {
						console.log(`[Evidence] Re-executed query ${queryName} completed with ${result.length} rows`);
					}).catch(error => {
						console.error(`[Evidence] Re-executed query ${queryName} failed:`, error);
						// Fallback to old promise if new one fails
						newSqlQueries[queryName] = oldPromise;
						sqlQueries = { ...newSqlQueries };
					});
				}
			}
		});
		
		// Add small delay to let DOM settle before triggering chart re-render
		setTimeout(() => {
			sqlQueries = newSqlQueries;
		}, 100);
	}
	
	// Debug the data being passed
	console.log('[DASHBOARD DEBUG] Received data keys:', Object.keys(data || {}));
	console.log('[DASHBOARD DEBUG] Dashboard name:', data?.dashboard);
	console.log('[DASHBOARD DEBUG] Data object:', data);
	console.log('[DASHBOARD DEBUG] Data type:', typeof data);
	console.log('[DASHBOARD DEBUG] Data is null:', data === null);
	console.log('[DASHBOARD DEBUG] Data is undefined:', data === undefined);
	
	// Get Evidence's query function from page data (provided by +layout.js)
	const query = data.__db?.query || (() => {
		console.log('[DASHBOARD] No query function available from data.__db - using fallback');
		return Promise.resolve([]);
	});
	
	// Function to interpolate template literals in SQL
	function interpolateSQL(sql, inputValues) {
		let interpolated = sql;
		
		// Handle conditional expressions properly
		// Look for ${inputs.input_name.value ? `AND condition` : ''} patterns
		const conditionalPattern = /\$\{inputs\.(\w+)\.value\s*\?\s*`([^`]+)`\s*:\s*[^}]*\}/g;
		interpolated = interpolated.replace(conditionalPattern, (match, inputName, condition) => {
			const value = inputValues[inputName];
			if (value !== undefined && value !== null && value !== '') {
				console.log(`[SQL Interpolation] Applying condition for ${inputName}='${value}': ${condition}`);
				// Replace ${inputs.input_name.value} within the condition with the actual value (no extra quotes)
				return condition.replace(/\$\{inputs\.\w+\.value\}/g, value);
			} else {
				console.log(`[SQL Interpolation] Removing condition for ${inputName} (no value selected)`);
				return ''; // Remove the entire condition when no value
			}
		});
		
		// Handle simple ${inputs.input_name.value} replacements
		const simplePattern = /\$\{inputs\.(\w+)\.value\}/g;
		interpolated = interpolated.replace(simplePattern, (match, inputName) => {
			const value = inputValues[inputName];
			if (value !== undefined && value !== null && value !== '') {
				console.log(`[SQL Interpolation] Replacing ${match} with '${value}'`);
				return `'${value}'`;
			} else {
				console.log(`[SQL Interpolation] ${match} is empty, using NULL`);
				return 'NULL';
			}
		});
		
		console.log(`[SQL Interpolation] Original: ${sql}`);
		console.log(`[SQL Interpolation] Interpolated: ${interpolated}`);
		
		return interpolated;
	}

	// Execute queries with template interpolation
	function executeQuery(queryName, sqlCode) {
		const currentInputValues = $inputValues;
		const interpolatedSQL = interpolateSQL(sqlCode, currentInputValues);
		
		console.log(`[Evidence] Executing query: ${queryName}`);
		console.log(`[Evidence] Interpolated SQL: ${interpolatedSQL}`);
		
		return query(interpolatedSQL).then(result => {
			console.log(`[Evidence] Query ${queryName} completed successfully`);
			console.log(`[Evidence] Raw result:`, result);
			console.log(`[Evidence] Result type:`, typeof result);
			console.log(`[Evidence] Is array:`, Array.isArray(result));
			
			// Handle different data formats that Evidence query function might return
			if (Array.isArray(result)) {
				console.log(`[Evidence] Using array data directly`);
				return result;
			} else if (result && typeof result === 'object') {
				console.log(`[Evidence] Result keys:`, Object.keys(result));
				
				// Check if it has a data property (common format)
				if (result.data && Array.isArray(result.data)) {
					console.log(`[Evidence] Using result.data array`);
					return result.data;
				}
				
				// Check if it has results property (DuckLake format)
				if (result.results && Array.isArray(result.results)) {
					console.log(`[Evidence] Converting DuckLake format to Evidence format`);
					const { columns, results } = result;
					return results.map(row => {
						const obj = {};
						columns.forEach((col, index) => {
							obj[col] = row[index];
						});
						return obj;
					});
				}
				
				// If it's a single object, wrap in array
				console.log(`[Evidence] Wrapping single object in array`);
				return [result];
			}
			
			console.log(`[Evidence] Returning empty array for invalid result`);
			return [];
		}).catch(error => {
			console.error(`[Evidence] Query ${queryName} error:`, error);
			return [];
		});
	}
	
	// Wait for data to be available before doing anything
	$: dataReady = data && typeof data === 'object';
	$: pageTitle = dataReady ? `Evidence - ${data.dashboard || 'Loading...'}` : 'Evidence - Loading...';
	
	// Component registry for dynamic loading
	const componentMap = {
		'BarChart': BarChart,
		'BigValue': BigValue,
		'DataTable': DataTable,
		'Dropdown': Dropdown,
		'DropdownOption': DropdownOption,
		'TextInput': TextInput,
		'DateRange': DateRange,
		'Checkbox': Checkbox,
		'QueryViewer': null // Skip QueryViewer components - they're for development only
	};
	
	onMount(async () => {
		console.log(`[Runtime Evidence] Rendering dashboard: ${data?.dashboard || 'UNDEFINED'}`);
		console.log(`[Runtime Evidence] Data ready: ${dataReady}`);
		
		if (!dataReady) {
			console.error('[Runtime Evidence] ERROR: Data not ready yet');
			return;
		}
		
		if (data?.compiledComponent && !data?.compilationError) {
			try {
				// Parse the server-processed data
				dashboardData = JSON.parse(data?.compiledComponent || '{}');
				components = dashboardData.components;
				
				console.log(`[Runtime Evidence] Found ${components.length} components:`, 
					components.map(c => `${c.name}(${Object.keys(c.props).join(', ')})`));
				console.log(`[Runtime Evidence] Queries needed:`, dashboardData.queryNames);
				
				// Read original markdown to extract SQL queries
				const response = await fetch(`/api/dashboard-content/${data?.dashboard}`);
				if (response.ok) {
					const markdownContent = await response.text();
					lastMarkdownContent = markdownContent; // Store for re-execution
					
					// Extract and execute only the queries that Evidence actually uses
					const sqlBlocks = markdownContent.match(/```sql\s+(\w+)\n([\s\S]*?)```/g) || [];

					sqlBlocks.forEach(block => {
						const match = block.match(/```sql\s+(\w+)\n([\s\S]*?)```/);
						if (match) {
							const queryName = match[1];
							const sqlCode = match[2].trim();
							
							// Only execute queries that Evidence components actually reference
							if (dashboardData.queryNames.includes(queryName)) {
								sqlQueries[queryName] = executeQuery(queryName, sqlCode);
							}
						}
					});
				}

				// After all queries complete, replace placeholders with actual components
				console.log('[Runtime Evidence] Components array for replacement:', components);
				console.log('[Runtime Evidence] Non-QueryViewer components:', components.filter(c => c.name !== 'QueryViewer'));
				setTimeout(() => {
					replaceComponentPlaceholders();
					// Clean up any remaining undefined text in the DOM
					cleanupUndefinedText();
				}, 2000);
				
			} catch (error) {
				console.error(`[Runtime Evidence] Error processing component:`, error);
			}
		}
	});

	// Function to replace placeholder divs with actual Svelte components
	function replaceComponentPlaceholders() {
		if (typeof window === 'undefined') return;

		console.log(`[Runtime Evidence] Replacing component placeholders...`);
		
		const placeholders = document.querySelectorAll('.evidence-component-placeholder');
		console.log(`[Runtime Evidence] Found ${placeholders.length} placeholders`);

		placeholders.forEach((placeholder) => {
			const componentIndex = placeholder.getAttribute('data-component-index');
			const replacementDiv = document.getElementById(`component-replacement-${componentIndex}`);
			
			console.log(`[Runtime Evidence] Looking for replacement div: component-replacement-${componentIndex}`);
			console.log(`[Runtime Evidence] ReplacementDiv found:`, !!replacementDiv);
			
			if (replacementDiv) {
				console.log(`[Runtime Evidence] Found replacement, swapping placeholder ${componentIndex}`);
				// Replace the placeholder with the actual component
				try {
					replacementDiv.style.display = 'block';
					placeholder.parentNode.replaceChild(replacementDiv, placeholder);
				} catch (error) {
					console.error(`[Runtime Evidence] Error swapping placeholder ${componentIndex}:`, error);
					console.error(`[Runtime Evidence] replacementDiv:`, replacementDiv);
					console.error(`[Runtime Evidence] placeholder:`, placeholder);
				}
			} else {
				console.warn(`[Runtime Evidence] No replacement found for placeholder ${componentIndex}`);
			}
		});
	}

	// Function to clean up any remaining undefined text in the DOM
	function cleanupUndefinedText() {
		if (typeof window === 'undefined') return;

		console.log('[Runtime Evidence] Cleaning up undefined text from DOM...');
		
		// Get all text nodes and clean up undefined
		const walker = document.createTreeWalker(
			document.querySelector('.evidence-dashboard'),
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		let textNode;
		const nodesToFix = [];
		
		while (textNode = walker.nextNode()) {
			if (textNode.textContent && textNode.textContent.includes('undefined')) {
				nodesToFix.push(textNode);
			}
		}

		console.log(`[Runtime Evidence] Found ${nodesToFix.length} text nodes with 'undefined'`);

		nodesToFix.forEach(node => {
			console.log(`[Runtime Evidence] Cleaning text: "${node.textContent.substring(0, 100)}"`);
			node.textContent = node.textContent.replace(/undefined/g, '').replace(/\s{2,}/g, ' ').trim();
		});
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

{#if !dataReady}
	<div class="loading">
		<p>Loading Evidence dashboard...</p>
	</div>
{:else if data.compilationError}
	<div class="error-content">
		<h1>Compilation Error</h1>
		<p>Failed to process dashboard "<strong>{data.dashboard}</strong>":</p>
		<pre style="background: #fee; padding: 1rem; border-radius: 4px; border: 1px solid #fcc;">{data.compilationError}</pre>
		<p><strong>Dashboard file:</strong> <code>/dashboards/{data.dashboard}/+page.md</code></p>
	</div>
{:else if data.dashboardExists}
	<!-- Render Evidence-processed content with components in their exact positions -->
	<div class="evidence-dashboard">
		{#if dashboardData && dashboardData.html}
			{@html dashboardData.html}
			{#if typeof window !== 'undefined'}
				{setTimeout(() => {
					// Immediate cleanup of undefined text
					const dashboard = document.querySelector('.evidence-dashboard');
					if (dashboard) {
						dashboard.innerHTML = dashboard.innerHTML.replace(/undefined/g, '');
					}
				}, 100)}
			{/if}
		{:else}
			<p>Loading dashboard content...</p>
		{/if}
	</div>

	<!-- Render actual components that will replace placeholders -->
	{#each components.filter(c => c.name !== 'QueryViewer') as component, placeholderIndex}
		{#if componentMap[component.name] && component.props && component.name !== 'Dropdown'}
			<!-- Handle data-driven components (charts, tables) -->
			{#if component.props.data && sqlQueries[component.props.data]}
				{#await sqlQueries[component.props.data] then queryData}
					{#if queryData && Array.isArray(queryData)}
						<div id="component-replacement-{placeholderIndex}" style="display: none;" class="evidence-component-ready">
							<!-- Debug: Log component data -->
							{console.log(`[COMPONENT DEBUG] ${component.name} receiving data:`, queryData)}
							{console.log(`[COMPONENT DEBUG] ${component.name} data length:`, queryData.length)}
							{console.log(`[COMPONENT DEBUG] ${component.name} props:`, component.props)}
							{console.log(`[COMPONENT DEBUG] ${component.name} first row keys:`, queryData[0] ? Object.keys(queryData[0]) : 'No data')}
							{console.log(`[COMPONENT DEBUG] ${component.name} first row:`, queryData[0])}
							<svelte:component 
								this={componentMap[component.name]} 
								data={queryData}
								value={component.props?.value}
								x={component.props?.x}
								y={component.props?.y}
								title={component.props?.title}
								subtitle={component.props?.subtitle}
								fmt={component.props?.fmt}
							/>
						</div>
					{:else}
						<div id="component-replacement-{placeholderIndex}" style="display: none;" class="evidence-component-ready">
							<div style="padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;">
								<strong>Data Error:</strong> Component {component?.name || 'Unknown'} received invalid data format
								<pre>{JSON.stringify(queryData || 'undefined', null, 2)}</pre>
							</div>
						</div>
					{/if}
				{/await}
			<!-- Handle input components (no data prop needed) -->
			{:else}
				<div id="component-replacement-{placeholderIndex}" style="display: none;" class="evidence-component-ready">
					{#if component.name === 'Dropdown'}
						<!-- Evidence Dropdown expects data prop with options, need to extract from nested DropdownOptions -->
						{console.log('[DROPDOWN DEBUG] Dropdown component:', component)}
						{console.log('[DROPDOWN DEBUG] All components:', components)}
						<svelte:component 
							this={componentMap[component.name]} 
							name={component.props?.name}
							title={component.props?.title}
							data={[
								{value: "1", valueLabel: "Option One"},
								{value: "2", valueLabel: "Option Two"}, 
								{value: "3", valueLabel: "Option Three"}
							]}
						/>
					{:else if component.name === 'DropdownOption'}
						<!-- Skip DropdownOption - should be handled as children of Dropdown -->
					{:else}
						<svelte:component 
							this={componentMap[component.name]} 
							name={component.props?.name}
							title={component.props?.title}
						/>
					{/if}
				</div>
			{/if}
		{:else if component.name === 'Dropdown'}
			<!-- Hybrid Evidence Dropdown Implementation -->
			<div id="component-replacement-{placeholderIndex}" style="display: none;" class="evidence-component-ready">
				{console.log('[DROPDOWN HYBRID] Component props:', component.props)}
				{console.log('[DROPDOWN HYBRID] Dropdown options:', component.props?.dropdownOptions)}
				
				{#if component.props?.dropdownOptions && component.props.dropdownOptions.length > 0}
					<!-- Custom dropdown implementation that works with our hybrid approach -->
					<div class="evidence-dropdown-wrapper">
						<label for="dropdown-{component.props.name}" class="evidence-dropdown-label">
							{component.props.title || component.props.name || 'Select an option'}
						</label>
						<select 
							id="dropdown-{component.props.name}"
							class="evidence-dropdown-select"
							on:change={(e) => {
								const selectedValue = e.target.value;
								inputValues.update(values => ({
									...values,
									[component.props.name]: selectedValue
								}));
								console.log(`[DROPDOWN] ${component.props.name} changed to:`, selectedValue);
							}}
						>
							<option value="">-- Select --</option>
							{#each component.props.dropdownOptions as option}
								<option value={option.value}>{option.valueLabel}</option>
							{/each}
						</select>
						<div class="selected-value">
							Selected: {$inputValues[component.props.name] || 'None'}
						</div>
					</div>
				{:else}
					<div style="padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px;">
						<strong>Dropdown Error:</strong> No options found for {component.props?.name}
					</div>
				{/if}
			</div>
		{/if}
	{/each}
{:else if !data.dashboardExists}
	<div class="error-content">
		<h1>Dashboard Not Found</h1>
		<p>The dashboard "<strong>{data.dashboard}</strong>" does not exist.</p>
		<p>Create it at: <code>/dashboards/{data.dashboard}/+page.md</code></p>
	</div>
{:else}
	<div class="loading">
		<p>Loading Evidence dashboard...</p>
	</div>
{/if}

<style>
	.dashboard-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.error-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
	}
	
	pre {
		background: #f8f8f8;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
	}
	
	code {
		background: #e0e0e0;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
	}
	
	/* Hybrid Evidence Dropdown Styling */
	.evidence-dropdown-wrapper {
		margin: 1rem 0;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #fafafa;
	}
	
	.evidence-dropdown-label {
		display: block;
		font-weight: bold;
		margin-bottom: 0.5rem;
		color: #333;
	}
	
	.evidence-dropdown-select {
		width: 100%;
		max-width: 300px;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		background: white;
	}
	
	.selected-value {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #e8f4f8;
		border-left: 3px solid #2196F3;
		font-weight: bold;
	}
	
	.input-value-display {
		background: #e8f4f8;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-weight: bold;
		border: 1px solid #2196F3;
	}
</style>