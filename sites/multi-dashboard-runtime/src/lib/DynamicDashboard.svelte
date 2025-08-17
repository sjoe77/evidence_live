<!-- 
    MDSvex comes in handy here because it takes frontmatter and shoves it into the metadata object.
    This means that all we need to do is build out the expected page metadata
-->
<script>
	import { BarChart, BigValue, DataTable } from '@evidence-dev/core-components';
	
	// Receive props from parent
	export let data;
	export let query;
	
	// Real SQL queries from dashboard markdown - these will hit your ducklake!
	$: claims_by_status = query(`
		-- source: flight_sql
		SELECT 
		  status, 
		  count(*) as count
		FROM my_ducklake.main.claims 
		GROUP BY status 
		ORDER BY count DESC
	`);
	
	$: total_stats = query(`
		-- source: flight_sql
		SELECT 
		  count(*) as total,
		  count(DISTINCT status) as statuses,
		  count(DISTINCT claim_type) as types
		FROM my_ducklake.main.claims
	`);
	
	$: recent_claims = query(`
		-- source: flight_sql
		SELECT 
		  country,
		  claim_type,
		  status,
		  state,
		  claim_date
		FROM my_ducklake.main.claims
		ORDER BY claim_date DESC
		LIMIT 5
	`);
</script>

<svelte:head>
	<title>Claims Analysis Dashboard - Runtime Evidence Processing</title>
</svelte:head>

<h1>Claims Analysis Dashboard - Runtime Evidence Processing</h1>

<h2>Claims Status Overview</h2>

{#await claims_by_status then data}
	<BarChart 
	  data={data} 
	  x="status" 
	  y="count" 
	  title="Claims by Status - Live DuckLake Data"
	  subtitle="Real-time data from Flight SQL → DuckLake" 
	/>
{/await}

<h2>Key Metrics</h2>

{#await total_stats then data}
	<BigValue 
	  data={data} 
	  value="total" 
	  title="Total Claims"
	/>
	
	<BigValue 
	  data={data} 
	  value="types" 
	  title="Claim Types"
	/>
{/await}

<h2>Claims Data Table</h2>

{#await recent_claims then data}
	<DataTable data={data} title="Recent Claims" />
{/await}

---

**✅ Runtime Evidence Processing Active!**
- **Dashboard**: REAL DuckLake claims data from localhost:4180
- **Source**: `flight_sql` hitting your ducklake stack  
- **Processing**: Live SQL queries executed at runtime
- **Philosophy**: Simple runtime compilation. Edit → Refresh → See changes.