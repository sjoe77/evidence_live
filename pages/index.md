# Claims Analytics Dashboard

**Evidence + Flight SQL Template for DuckLake**

## Connection Test

```sql connection_test
SELECT 'Flight SQL Working!' as message, CURRENT_DATE as today
```

**Status:** {connection_test?.[0]?.message || 'Connecting to Flight SQL...'}

## Dashboard Author Workflow

**✅ Simple for Non-Technical Users:**

1. **Edit this markdown file** (`pages/index.md`)
2. **Write SQL queries** in code blocks
3. **Add Evidence components** like charts and tables  
4. **Save and refresh** - see live DuckLake data instantly

## Example: Claims Analysis

```sql claims_summary
SELECT 
  'Total Claims' as metric,
  1234 as value
UNION ALL
SELECT 'Pending Claims', 456
UNION ALL  
SELECT 'Resolved Claims', 778
```

<DataTable data={claims_summary} />

## Real DuckLake Query (when ready)

```sql real_claims
-- SELECT status, count(*) as total_claims 
-- FROM my_ducklake.main.claims 
-- GROUP BY status
-- ORDER BY total_claims DESC

-- For now, showing sample data:
SELECT 'Pending' as status, 25 as total_claims
UNION ALL
SELECT 'Resolved', 15
UNION ALL
SELECT 'Rejected', 10
```

<BarChart data={real_claims} x=status y=total_claims title="Claims by Status" />

---

**🎯 Template Ready!** Dashboard authors can now edit markdown + SQL to create dashboards with live DuckLake data.