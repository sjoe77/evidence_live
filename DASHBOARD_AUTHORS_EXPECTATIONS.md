Dashboard Authors Should NOT Know About /src/pages/

  Dashboard Authors Only Work Here:
  /dashboards/
  ├── SalesDashboard/+page.md     ← Authors edit this
  ├── TestDashboard/+page.md      ← Authors edit this
  └── NewDashboard/+page.md       ← Authors create new ones here

  Evidence Framework (Hidden from Authors):
  /src/pages/dashboards/[dashboard]/+page.md    ← Framework code (authors never touch)

  The Goal: Seamless Author Experience

  What Authors Should Experience:
  1. Create /dashboards/MyNewDashboard/+page.md
  2. Visit http://localhost:4180/dashboards/MyNewDashboard
  3. See their dashboard immediately (no builds, no technical knowledge needed)

  What I Mean by "Dynamic Loading"

  The Evidence framework needs to automatically:
  1. Detect: When URL is /dashboards/SalesDashboard
  2. Load: Content from /dashboards/SalesDashboard/+page.md
  3. Render: That content through Evidence's markdown processor
  4. Display: The dashboard to the user

  Authors never see or care about:
  - SvelteKit routes
  - +page.server.js files
  - Framework internals
  - Build processes