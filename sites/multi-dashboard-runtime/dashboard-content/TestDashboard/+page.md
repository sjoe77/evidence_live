# Interactive Claims Dashboard - Runtime Evidence

## Status Filter

```sql available_statuses
-- source: flight_sql
SELECT DISTINCT status as value, status as label 
FROM my_ducklake.main.claims 
ORDER BY status
```

<Dropdown data={available_statuses} name="selected_status" title="Filter by Status" />

## Filtered Claims Analysis

```sql filtered_claims
-- source: flight_sql
SELECT 
  claim_id,
  status,
  amount,
  created_date,
  CASE 
    WHEN amount > 5000 THEN 'High Value'
    WHEN amount > 1000 THEN 'Medium Value' 
    ELSE 'Low Value'
  END as value_category
FROM my_ducklake.main.claims
WHERE status = COALESCE('${inputs.selected_status.value}', status)
ORDER BY created_date DESC
LIMIT 20
```

<DataTable data={filtered_claims} title="Filtered Claims (Top 20)" />

## Claims by Value Category

```sql claims_by_value
-- source: flight_sql
SELECT 
  CASE 
    WHEN amount > 5000 THEN 'High Value (>$5K)'
    WHEN amount > 1000 THEN 'Medium Value ($1K-$5K)' 
    ELSE 'Low Value (<$1K)'
  END as value_category,
  count(*) as claim_count,
  sum(amount) as total_amount,
  round(avg(amount), 2) as avg_amount
FROM my_ducklake.main.claims
WHERE status = COALESCE('${inputs.selected_status.value}', status)
GROUP BY 
  CASE 
    WHEN amount > 5000 THEN 'High Value (>$5K)'
    WHEN amount > 1000 THEN 'Medium Value ($1K-$5K)' 
    ELSE 'Low Value (<$1K)'
  END
ORDER BY total_amount DESC
```

<BarChart 
  data={claims_by_value} 
  x=value_category 
  y=claim_count 
  title="Claims Distribution by Value Category"
  subtitle="Filtered by: {inputs.selected_status.value || 'All Statuses'}"
/>

## Performance Metrics

```sql performance_stats
-- source: flight_sql
SELECT 
  count(*) as filtered_claims,
  sum(amount) as total_value,
  round(avg(amount), 2) as avg_claim_value,
  min(created_date) as earliest_claim,
  max(created_date) as latest_claim
FROM my_ducklake.main.claims
WHERE status = COALESCE('${inputs.selected_status.value}', status)
```

<BigValue 
  data={performance_stats} 
  value=filtered_claims 
  title="Filtered Claims Count"
/>

<BigValue 
  data={performance_stats} 
  value=total_value 
  title="Total Value" 
  fmt="$#,##0"
/>

<BigValue 
  data={performance_stats} 
  value=avg_claim_value 
  title="Average Claim Value" 
  fmt="$#,##0.00"
/>

---

**🔥 Runtime Evidence Processing + Real Flight SQL Data!**

- **Interactive Features**: Dropdown filtering with query parameters
- **Live Data**: Real DuckLake claims via Flight SQL HTTP middleware  
- **Authentication**: OAuth proxy handles all authentication seamlessly
- **Performance**: ~10ms query execution + ~500ms runtime compilation
- **Developer Experience**: Edit markdown → Refresh → See changes immediately