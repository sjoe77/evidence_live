<script>
  export let data;
</script>

<svelte:head>
  <title>{data.title} - Organization Dashboards</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6">
  <div class="mb-6">
    <a href="/dashboards" class="text-blue-600 hover:text-blue-800">← Back to Dashboards</a>
  </div>
  
  <div class="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
    <h2 class="text-lg font-semibold mb-2">✅ Dynamic Dashboard Loading</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div>
        <strong>Dashboard:</strong> <code>{data.dashboard}</code>
      </div>
      <div>
        <strong>Source Directory:</strong> <code>{data.dashboardDir}</code>
      </div>
      <div>
        <strong>Last Updated:</strong> {data.lastUpdated}
      </div>
    </div>
  </div>
  
  <h1 class="text-4xl font-bold mb-4">{data.title}</h1>
  <p class="text-lg text-gray-600 mb-8">{data.description}</p>
  
  <div class="p-6 bg-blue-50 border border-blue-200 rounded-lg mb-8">
    <h2 class="text-xl font-semibold mb-2">🎯 Dynamic Routing Success!</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 class="font-semibold mb-2">Architecture Benefits:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>✅ Single <code>[dashboard]</code> route handles ALL dashboards</li>
          <li>✅ No individual routes needed per dashboard</li>
          <li>✅ Content loaded dynamically from separate directories</li>
          <li>✅ Ready for S3 folder implementation</li>
        </ul>
      </div>
      <div>
        <h3 class="font-semibold mb-2">URL Examples:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li><code>/dashboards/SalesDashboard</code></li>
          <li><code>/dashboards/TestDashboard</code></li>
          <li><code>/dashboards/AnyNewDashboard</code></li>
          <li>Works for any dashboard in <code>dashboards/</code></li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="p-6 bg-purple-50 border border-purple-200 rounded-lg mb-8">
    <h2 class="text-xl font-semibold mb-2">🚧 Next Implementation Step</h2>
    <p class="mb-4">The dynamic routing is working! Next step is to process the Evidence markdown content:</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div class="p-3 bg-white rounded">
        <strong>1. SQL Processing</strong><br>
        Extract and execute SQL queries from markdown
      </div>
      <div class="p-3 bg-white rounded">
        <strong>2. Component Rendering</strong><br>
        Render Evidence components with live data
      </div>
      <div class="p-3 bg-white rounded">
        <strong>3. Interactive Features</strong><br>
        Enable filters, parameters, chart interactions
      </div>
    </div>
  </div>
  
  <div class="mt-8 p-4 border-l-4 border-gray-300 bg-gray-50">
    <h3 class="font-semibold mb-2">Raw Dashboard Content Preview:</h3>
    <pre class="text-sm overflow-x-auto whitespace-pre-wrap bg-white p-3 rounded border">{data.content ? data.content.substring(0, 800) + (data.content.length > 800 ? '\n\n... [Content truncated] ...' : '') : 'No content found'}</pre>
  </div>
  
  <div class="mt-6 p-4 bg-gray-100 rounded">
    <h3 class="font-semibold mb-2">Dashboard Metadata:</h3>
    <ul class="text-sm space-y-1">
      <li><strong>Title:</strong> {data.title}</li>
      <li><strong>Description:</strong> {data.description}</li>
      <li><strong>Directory:</strong> {data.dashboardDir}</li>
      <li><strong>URL Pattern:</strong> /dashboards/{data.dashboard}</li>
    </ul>
  </div>
</div>