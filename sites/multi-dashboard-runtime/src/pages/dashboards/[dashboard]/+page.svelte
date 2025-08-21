<script>
	import { BarChart, BigValue, DataTable, Dropdown, DropdownOption, TextInput, DateRange, Checkbox } from '@evidence-dev/core-components';
	import { onMount, setContext } from 'svelte';
	import { writable, get } from 'svelte/store';
	import { getInputContext, ensureInputContext, getInputSetter, InputStoreKey } from '@evidence-dev/sdk/utils/svelte';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { duckdbSerialize } from '@evidence-dev/sdk/usql';
	
	/** @type {import('./$types').PageData} */
	export let data;
	
	// Initialize Evidence input context system
	const inputStore = writable({});
	ensureInputContext(inputStore);
	const inputs = getInputContext();
	
	// Evidence objects are used directly in template evaluation - no conversion needed
	
	// Re-execute queries when input values change (simple approach - re-run all queries)
	let lastMarkdownContent = '';
	let dashboardData = null;
	let sqlQueries = {};
	let components = [];
	
	// Evidence components handle their own instances automatically
	
	// Evidence handles dropdown integration automatically through the component
	// No manual setup needed when using real Evidence Dropdown component
	
	// Track previous input values to detect changes
	let previousInputValues = {};
	
	// Subscribe to Evidence input changes with change detection
	inputs.subscribe(values => {
		if (typeof window !== 'undefined' && dashboardData && lastMarkdownContent) {
			// Detect specific input changes and re-execute only dependent queries
			Object.keys(values).forEach(inputName => {
				const currentValue = values[inputName];
				const previousValue = previousInputValues[inputName];
				
				// Check if this specific input actually changed
				const hasChanged = JSON.stringify(currentValue) !== JSON.stringify(previousValue);
				
				if (hasChanged) {
					console.log(`[Evidence] Input ${inputName} changed:`, { from: previousValue, to: currentValue });
					reExecuteDependentQueries(inputName, lastMarkdownContent);
				}
			});
			
			// Update previous values for next comparison
			previousInputValues = { ...values };
		}
	});
	
	// Track query dependencies to prevent excessive re-execution
	let queryDependencies = {}; // queryName -> [inputNames]
	
	// Function to detect which inputs a query depends on
	function analyzeQueryDependencies(queryName, sqlCode) {
		const dependencies = [];
		
		// Evidence's pattern for detecting input dependencies
		const inputPattern = /\$\{\s*inputs\s*\.\s*(\w+)[\.\w]*\s*.*?\}/g;
		let match;
		
		while ((match = inputPattern.exec(sqlCode)) !== null) {
			const inputName = match[1];
			if (!dependencies.includes(inputName)) {
				dependencies.push(inputName);
			}
		}
		
		queryDependencies[queryName] = dependencies;
		console.log(`[Evidence] Query ${queryName} depends on inputs:`, dependencies);
		return dependencies;
	}
	
	// Debounced function to re-execute only dependent queries
	let reExecuteTimeout = null;
	function reExecuteDependentQueries(changedInputName, markdownContent) {
		// Clear existing timeout to debounce rapid changes
		if (reExecuteTimeout) {
			clearTimeout(reExecuteTimeout);
		}
		
		reExecuteTimeout = setTimeout(() => {
			console.log(`[Evidence] Input ${changedInputName} changed, finding dependent queries...`);
			
			const sqlBlocks = markdownContent.match(/```sql\s+(\w+)\n([\s\S]*?)```/g) || [];
			const newSqlQueries = { ...sqlQueries };
			
			sqlBlocks.forEach(block => {
				const match = block.match(/```sql\s+(\w+)\n([\s\S]*?)```/);
				if (match) {
					const queryName = match[1];
					const sqlCode = match[2].trim();
					
					// Analyze dependencies if not already done
					if (!queryDependencies[queryName]) {
						analyzeQueryDependencies(queryName, sqlCode);
					}
					
					// Only re-execute if this query depends on the changed input
					const dependencies = queryDependencies[queryName] || [];
					if (dependencies.includes(changedInputName) && dashboardData.queryNames.includes(queryName)) {
						console.log(`[Evidence] Re-executing dependent query: ${queryName}`);
						newSqlQueries[queryName] = executeQuery(queryName, sqlCode);
					}
				}
			});
			
			sqlQueries = newSqlQueries;
		}, 200); // 200ms debounce
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
	
	// Evidence-compatible SQL template evaluation using JavaScript template literals
	function interpolateSQL(sql, inputValues) {
		try {
			// Debug the Evidence input objects structure
			console.log(`[EVIDENCE SQL] Evidence input objects:`, inputValues);
			Object.keys(inputValues).forEach(key => {
				const inputObj = inputValues[key];
				console.log(`[EVIDENCE SQL] Input ${key}:`, {
					value: inputObj?.value,
					label: inputObj?.label,
					toString: typeof inputObj?.toString,
					hasValueProperty: 'value' in (inputObj || {}),
					fullObject: inputObj
				});
			});
			
			// Create a safe execution context with the inputs object
			const context = {
				inputs: inputValues
			};
			
			// Convert template string to evaluable JavaScript
			// Replace ${...} with proper template literal syntax
			const templateCode = `\`${sql}\``;
			
			console.log(`[EVIDENCE SQL] Template code: ${templateCode}`);
			console.log(`[EVIDENCE SQL] Context inputs:`, Object.keys(inputValues));
			
			// Create a function that evaluates the template in the context
			const evaluateTemplate = new Function('inputs', `return ${templateCode}`);
			const result = evaluateTemplate(context.inputs);
			
			console.log(`[EVIDENCE SQL] Original: ${sql}`);
			console.log(`[EVIDENCE SQL] Evaluated: ${result}`);
			
			return result;
		} catch (error) {
			console.error(`[EVIDENCE SQL] Template evaluation error:`, error);
			console.error(`[EVIDENCE SQL] Template: ${sql}`);
			console.error(`[EVIDENCE SQL] Inputs:`, inputValues);
			
			// Fallback to original SQL on error
			return sql;
		}
	}

	// Execute queries with template interpolation
	function executeQuery(queryName, sqlCode) {
		const currentInputValues = get(inputs); // Use Evidence objects directly, not simplified values
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
								// Analyze query dependencies for future optimization
								analyzeQueryDependencies(queryName, sqlCode);
								
								// Execute the query
								sqlQueries[queryName] = executeQuery(queryName, sqlCode);
							}
						}
					});
				}

				// Queries execute automatically when components render
				const allQueryPromises = Object.values(sqlQueries);
				console.log(`[Runtime Evidence] Started ${allQueryPromises.length} queries, components will render when data is available`);
				
				Promise.allSettled(allQueryPromises).then(results => {
					console.log(`[Runtime Evidence] All queries completed:`, results.map(r => r.status));
				}).catch(error => {
					console.error('[Runtime Evidence] Error in query execution:', error);
				});
				
			} catch (error) {
				console.error(`[Runtime Evidence] Error processing component:`, error);
			}
		}
	});

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
	<!-- Direct Evidence component rendering -->
	<div class="evidence-dashboard">
		{#if data?.compiledComponent}
			{@const parsedData = JSON.parse(data.compiledComponent)}
			{@const parsedComponents = parsedData.components || []}
			<!-- Render markdown structure with components inline -->
			<h1 class="markdown" id="claims-analysis-dashboard---runtime-evidence-processing">
				<a href="#claims-analysis-dashboard---runtime-evidence-processing">
					Claims Analysis Dashboard - Runtime Evidence Processing
				</a>
			</h1>
			
			<h2 class="markdown" id="claims-status-overview---live-filtering-with-flight-sql">
				<a href="#claims-status-overview---live-filtering-with-flight-sql">
					Claims Status Overview - Live Filtering with Flight SQL
				</a>
			</h2>

			<!-- Render components directly in their positions -->
			{#each parsedComponents as component, componentIndex}
				{#if component.name === 'Dropdown'}
					<!-- Real Evidence Dropdown Component with child DropdownOptions -->
					<svelte:component 
						this={componentMap[component.name]} 
						name={component.props.name}
						data={undefined}
					>
						{#each component.props.dropdownOptions as option}
							<svelte:component 
								this={componentMap['DropdownOption']}
								value={option.value || ""}
								valueLabel={option.valueLabel || option.value || "No Label"}
							/>
						{/each}
					</svelte:component>
					
					<!-- Debug: Show selected value -->
					{#if $inputs[component.props.name]}
						<div class="selected-value">
							<strong>Selected</strong>: {$inputs[component.props.name]?.label || $inputs[component.props.name]?.value || 'None'}
						</div>
					{/if}

				{:else if component.name === 'BigValue' && component.props?.data && sqlQueries[component.props.data]}
					<!-- Evidence BigValue Component -->
					{#await sqlQueries[component.props.data] then queryData}
						{#if queryData && Array.isArray(queryData) && queryData.length > 0}
							<svelte:component 
								this={componentMap[component.name]} 
								data={queryData}
								value={component.props?.value}
								title={component.props?.title}
								fmt={component.props?.fmt}
							/>
						{:else}
							<div class="evidence-debug">
								<p>BigValue: Dataset is empty or loading...</p>
								<p>Query: {component.props.data}</p>
							</div>
						{/if}
					{/await}

				{:else if component.name === 'DataTable' && component.props?.data && sqlQueries[component.props.data]}
					<!-- Evidence DataTable Component -->
					<h2 class="markdown" id="claims-data-table">
						<a href="#claims-data-table">Claims Data Table</a>
					</h2>
					{#await sqlQueries[component.props.data] then queryData}
						{#if queryData && Array.isArray(queryData) && queryData.length > 0}
							<svelte:component 
								this={componentMap[component.name]} 
								data={queryData}
								title={component.props?.title}
							/>
						{:else}
							<div class="evidence-debug">
								<p>DataTable: Dataset is empty or loading...</p>
								<p>Query: {component.props.data}</p>
							</div>
						{/if}
					{/await}

				{:else if component.name === 'BarChart' && component.props?.data && sqlQueries[component.props.data]}
					<!-- Evidence BarChart Component -->
					{#await sqlQueries[component.props.data] then queryData}
						{#if queryData && Array.isArray(queryData) && queryData.length > 0}
							<svelte:component 
								this={componentMap[component.name]} 
								data={queryData}
								x={component.props?.x}
								y={component.props?.y}
								title={component.props?.title}
								subtitle={component.props?.subtitle}
							/>
						{:else}
							<div class="evidence-debug">
								<p>BarChart: Dataset is empty or loading...</p>
								<p>Query: {component.props.data}</p>
							</div>
						{/if}
					{/await}

				{:else if component.name === 'TextInput'}
					<!-- Evidence TextInput Component -->
					<svelte:component 
						this={componentMap[component.name]}
						name={component.props.name}
						placeholder={component.props.placeholder}
						title={component.props?.title}
					/>
					
					<!-- Debug: Show text input value -->
					{#if $inputs[component.props.name]}
						<div class="selected-value">
							<strong>Text Input</strong>: {$inputs[component.props.name]?.value || 'Empty'}
						</div>
					{/if}

				{:else if component.name === 'QueryViewer'}
					<!-- Skip QueryViewer components -->
				{/if}
			{/each}

			<hr class="markdown">
			<p class="markdown"><strong class="markdown">✅ Runtime Evidence Processing Active!</strong></p>
			<ul class="markdown">
				<li class="markdown"><strong class="markdown">Dashboard</strong>: Real DuckLake claims data</li>
				<li class="markdown"><strong class="markdown">Source</strong>: <code class="markdown">flight_sql</code> via OAuth proxy authentication</li>
				<li class="markdown"><strong class="markdown">Processing</strong>: Evidence markdown compiled server-side</li>
				<li class="markdown"><strong class="markdown">Philosophy</strong>: Simple runtime compilation. Edit → Refresh → See changes.</li>
			</ul>

		{:else}
			<p>Loading dashboard content...</p>
		{/if}
	</div>
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
	
	/* Evidence component styling is handled automatically */
	
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
	
	.evidence-debug {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #f0f8ff;
		border-left: 3px solid #007acc;
		font-size: 0.9rem;
		color: #666;
	}
</style>