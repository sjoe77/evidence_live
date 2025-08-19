# Claims Analysis Dashboard - Runtime Evidence Processing

## Claims Status Overview - Live Filtering with Flight SQL

<Dropdown name=status_filter>
    <DropdownOption valueLabel="All Statuses" value="" />
    <DropdownOption valueLabel="Pending" value="Pending" />
    <DropdownOption valueLabel="Resolved" value="Resolved" />
    <DropdownOption valueLabel="Rejected" value="Rejected" />
</Dropdown>

**Selected Status Filter**: {inputs.status_filter.value || "All Statuses"}

```sql claims_by_status
-- source: flight_sql
SELECT 
  status, 
  count(*) as total_claims,
  round(count(*) * 100.0 / SUM(count(*)) OVER(), 1) as percentage
FROM my_ducklake.main.claims 
WHERE 1=1 
  ${inputs.status_filter.value ? `AND status = '${inputs.status_filter.value}'` : ''}
GROUP BY status 
ORDER BY total_claims DESC
```



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
  country,
  claim_type,
  status,
  state,
  claim_date
FROM my_ducklake.main.claims
ORDER BY claim_date DESC
LIMIT 10
```

<DataTable data={recent_claims} title="Recent Claims" />

---

**✅ Runtime Evidence Processing Active!**
- **Dashboard**: Real DuckLake claims data
- **Source**: `flight_sql` via OAuth proxy authentication
- **Processing**: Evidence markdown compiled server-side
- **Philosophy**: Simple runtime compilation. Edit → Refresh → See changes.

<BarChart 
  data={claims_by_status} 
  x=status 
  y=total_claims 
  title="Claims by Status - Live DuckLake Data"
  subtitle="Real-time data from Flight SQL → DuckLake" 
/>