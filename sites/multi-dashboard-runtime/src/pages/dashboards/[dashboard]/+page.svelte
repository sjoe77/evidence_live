<script>
	import DynamicDashboard from '$lib/DynamicDashboard.svelte';
	
	/** @type {import('./$types').PageData} */
	export let data;
	
	// Get Evidence's query function from page data (provided by +layout.js)
	const query = data.__db?.query || (() => {
		console.log('[DASHBOARD] No query function available from data.__db - using fallback');
		return Promise.resolve([]);
	});
	
	// Log the runtime Evidence processing
	console.log(`[Runtime Evidence] Rendering dashboard: ${data.dashboard}`);
	console.log(`[Runtime Evidence] Dashboard exists: ${data.dashboardExists}`);
	console.log(`[Runtime Evidence] Compilation error: ${data.compilationError || 'None'}`);
	console.log(`[Runtime Evidence] Compiled component length: ${data.compiledComponent?.length || 0} characters`);
</script>

<svelte:head>
	<title>Evidence - {data.dashboard}</title>
</svelte:head>

{#if data.dashboardExists && !data.compilationError}
	<!-- Render actual Evidence dashboard as compiled Svelte component -->
	<DynamicDashboard {data} {query} />
	
	<div style="margin-top: 3rem; padding: 1rem; background: #e8f5e8; border-radius: 4px; border-left: 4px solid #10b981;">
		<h3>✅ Runtime Evidence Processing Active!</h3>
		<p><strong>Dashboard:</strong> {data.dashboard}</p>
		<p><strong>Processing:</strong> Live Svelte component compilation</p>
		<p><strong>Queries:</strong> Flight SQL executed in real-time</p>
		<p><strong>Components:</strong> BarChart, BigValue, DataTable rendered natively</p>
		<p><em>Solution: Pre-compiled Svelte components instead of runtime HTML injection</em></p>
	</div>
{:else if data.compilationError}
	<div class="error-content">
		<h1>Compilation Error</h1>
		<p>Failed to process dashboard "<strong>{data.dashboard}</strong>":</p>
		<pre style="background: #fee; padding: 1rem; border-radius: 4px; border: 1px solid #fcc;">{data.compilationError}</pre>
		<p><strong>Dashboard file:</strong> <code>/dashboards/{data.dashboard}/+page.md</code></p>
	</div>
{:else}
	<div class="error-content">
		<h1>Dashboard Not Found</h1>
		<p>The dashboard "<strong>{data.dashboard}</strong>" does not exist.</p>
		<p>Create it at: <code>/dashboards/{data.dashboard}/+page.md</code></p>
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
</style>