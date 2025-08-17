// vite.config.js
import { sveltekit } from "file:///Users/rajesh/evidence_live/node_modules/.pnpm/@sveltejs+kit@2.8.4_@sveltejs+vite-plugin-svelte@3.0.2_svelte@4.2.19_vite@5.4.14/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { sourceQueryHmr, configVirtual, queryDirectoryHmr } from "file:///Users/rajesh/evidence_live/packages/lib/sdk/src/build-dev/vite/plugins.js";
import { evidenceThemes } from "file:///Users/rajesh/evidence_live/packages/ui/tailwind/src/vite-plugin/vite-plugin.js";
import tailwindcss from "file:///Users/rajesh/evidence_live/node_modules/.pnpm/@tailwindcss+vite@4.0.6_vite@5.4.14/node_modules/@tailwindcss/vite/dist/index.mjs";
var config = {
  plugins: [
    tailwindcss(),
    sveltekit(),
    configVirtual(),
    sourceQueryHmr(),
    queryDirectoryHmr,
    evidenceThemes()
  ],
  optimizeDeps: {
    include: ["echarts-stat", "echarts"],
    exclude: ["svelte-icons"]
  },
  ssr: {
    external: [
      "@evidence-dev/db-orchestrator",
      "@evidence-dev/telemetry",
      "blueimp-md5",
      "@evidence-dev/sdk/plugins"
    ]
  },
  server: {
    fs: {
      strict: process.env.NODE_ENV !== "development"
    },
    hmr: {
      overlay: false
    }
  },
  build: {
    rollupOptions: {
      external: [/^@evidence-dev\/tailwind\/fonts\//]
    }
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcmFqZXNoL2V2aWRlbmNlX2xpdmUvc2l0ZXMvbXVsdGktZGFzaGJvYXJkLXJ1bnRpbWVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yYWplc2gvZXZpZGVuY2VfbGl2ZS9zaXRlcy9tdWx0aS1kYXNoYm9hcmQtcnVudGltZS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcmFqZXNoL2V2aWRlbmNlX2xpdmUvc2l0ZXMvbXVsdGktZGFzaGJvYXJkLXJ1bnRpbWUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHsgc291cmNlUXVlcnlIbXIsIGNvbmZpZ1ZpcnR1YWwsIHF1ZXJ5RGlyZWN0b3J5SG1yIH0gZnJvbSAnQGV2aWRlbmNlLWRldi9zZGsvYnVpbGQvdml0ZSc7XG5pbXBvcnQgeyBldmlkZW5jZVRoZW1lcyB9IGZyb20gJ0BldmlkZW5jZS1kZXYvdGFpbHdpbmQvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcblxuLyoqIEB0eXBlIHtpbXBvcnQoJ3ZpdGUnKS5Vc2VyQ29uZmlnfSAqL1xuY29uc3QgY29uZmlnID0ge1xuXHRwbHVnaW5zOiBbXG5cdFx0dGFpbHdpbmRjc3MoKSxcblx0XHRzdmVsdGVraXQoKSxcblx0XHRjb25maWdWaXJ0dWFsKCksXG5cdFx0c291cmNlUXVlcnlIbXIoKSxcblx0XHRxdWVyeURpcmVjdG9yeUhtcixcblx0XHRldmlkZW5jZVRoZW1lcygpXG5cdF0sXG5cdG9wdGltaXplRGVwczoge1xuXHRcdGluY2x1ZGU6IFsnZWNoYXJ0cy1zdGF0JywgJ2VjaGFydHMnXSxcblx0XHRleGNsdWRlOiBbJ3N2ZWx0ZS1pY29ucyddXG5cdH0sXG5cdHNzcjoge1xuXHRcdGV4dGVybmFsOiBbXG5cdFx0XHQnQGV2aWRlbmNlLWRldi9kYi1vcmNoZXN0cmF0b3InLFxuXHRcdFx0J0BldmlkZW5jZS1kZXYvdGVsZW1ldHJ5Jyxcblx0XHRcdCdibHVlaW1wLW1kNScsXG5cdFx0XHQnQGV2aWRlbmNlLWRldi9zZGsvcGx1Z2lucydcblx0XHRdXG5cdH0sXG5cdHNlcnZlcjoge1xuXHRcdGZzOiB7XG5cdFx0XHRzdHJpY3Q6IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAnZGV2ZWxvcG1lbnQnXG5cdFx0fSxcblx0XHRobXI6IHtcblx0XHRcdG92ZXJsYXk6IGZhbHNlXG5cdFx0fVxuXHR9LFxuXHRidWlsZDoge1xuXHRcdHJvbGx1cE9wdGlvbnM6IHtcblx0XHRcdGV4dGVybmFsOiBbL15AZXZpZGVuY2UtZGV2XFwvdGFpbHdpbmRcXC9mb250c1xcLy9dXG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZWLFNBQVMsaUJBQWlCO0FBQ3ZYLFNBQVMsZ0JBQWdCLGVBQWUseUJBQXlCO0FBQ2pFLFNBQVMsc0JBQXNCO0FBQy9CLE9BQU8saUJBQWlCO0FBR3hCLElBQU0sU0FBUztBQUFBLEVBQ2QsU0FBUztBQUFBLElBQ1IsWUFBWTtBQUFBLElBQ1osVUFBVTtBQUFBLElBQ1YsY0FBYztBQUFBLElBQ2QsZUFBZTtBQUFBLElBQ2Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ2IsU0FBUyxDQUFDLGdCQUFnQixTQUFTO0FBQUEsSUFDbkMsU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0osVUFBVTtBQUFBLE1BQ1Q7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0gsUUFBUSxRQUFRLElBQUksYUFBYTtBQUFBLElBQ2xDO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSixTQUFTO0FBQUEsSUFDVjtBQUFBLEVBQ0Q7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNOLGVBQWU7QUFBQSxNQUNkLFVBQVUsQ0FBQyxtQ0FBbUM7QUFBQSxJQUMvQztBQUFBLEVBQ0Q7QUFDRDtBQUVBLElBQU8sc0JBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
