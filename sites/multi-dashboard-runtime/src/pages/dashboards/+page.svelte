<script>
  export let data;
</script>

<div class="max-w-6xl mx-auto p-6">
  <h1 class="text-4xl font-bold mb-8">📊 Organization Dashboards</h1>
  
  <p class="text-lg text-gray-600 mb-8">
    Select a dashboard to view analytics and insights for your organization.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each data.dashboards as dashboard}
      <a href="/dashboards/{dashboard.name}" 
         class="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div class="flex items-center mb-4">
          <div class="text-3xl mr-3">{dashboard.icon}</div>
          <h3 class="text-xl font-semibold text-gray-900">{dashboard.title}</h3>
        </div>
        <p class="text-gray-600 mb-4">{dashboard.description}</p>
        <div class="flex justify-between items-center text-sm text-gray-500">
          <span>📁 {dashboard.name}</span>
          <span>🕒 {dashboard.lastUpdated}</span>
        </div>
      </a>
    {/each}
  </div>

  <div class="mt-12 p-6 bg-blue-50 rounded-lg">
    <h2 class="text-2xl font-semibold mb-4">🚀 Dashboard Architecture</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div class="p-4 bg-white rounded">
        <h3 class="font-semibold mb-2">📁 Separate Directories</h3>
        <p>Each dashboard lives in its own folder: <code>dashboards/Name/</code></p>
      </div>
      <div class="p-4 bg-white rounded">
        <h3 class="font-semibold mb-2">🔗 Deep Linking</h3>
        <p>Direct access via <code>/dashboards/Name</code></p>
      </div>
      <div class="p-4 bg-white rounded">
        <h3 class="font-semibold mb-2">☁️ Cloud Ready</h3>
        <p>Directories can be S3 folders in production</p>
      </div>
    </div>
  </div>

</div>

<style>
  a:hover {
    transform: translateY(-2px);
  }
</style>