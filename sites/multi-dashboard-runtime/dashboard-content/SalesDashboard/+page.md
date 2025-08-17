# Claims Analysis Dashboard - Runtime Evidence Processing

## Claims Status Overview

```sql claims_by_status
-- source: flight_sql
SELECT 
  status, 
  count(*) as total_claims,
  round(count(*) * 100.0 / SUM(count(*)) OVER(), 1) as percentage
FROM my_ducklake.main.claims 
GROUP BY status 
ORDER BY total_claims DESC
```

<BarChart 
  data={claims_by_status} 
  x=status 
  y=total_claims 
  title="Claims by Status - Live DuckLake Data"
  subtitle="Real-time data from Flight SQL → DuckLake" 
/>

## Key Metrics

```sql total_stats
-- source: flight_sql
SELECT 
  count(*) as total_claims,
  count(DISTINCT status) as status_types,
  round(avg(case when status = 'Resolved' then 1.0 else 0.0 end) * 100, 1) as resolution_rate
FROM my_ducklake.main.claims
```

<BigValue 
  data={total_stats} 
  value=total_claims 
  title="Total Claims"
/>

<BigValue 
  data={total_stats} 
  value=resolution_rate 
  title="Resolution Rate"
  fmt="%"
/>

## Claims Data Table

```sql recent_claims
-- source: flight_sql
SELECT 
  claim_id,
  status,
  amount,
  created_date
FROM my_ducklake.main.claims
ORDER BY created_date DESC
LIMIT 10
```

<DataTable data={recent_claims} title="Recent Claims" />

---

**✅ Runtime Evidence Processing Active!**
- **Dashboard**: Real DuckLake claims data
- **Source**: `flight_sql` via OAuth proxy authentication
- **Processing**: Evidence markdown compiled server-side
- **Philosophy**: Simple runtime compilation. Edit → Refresh → See changes.