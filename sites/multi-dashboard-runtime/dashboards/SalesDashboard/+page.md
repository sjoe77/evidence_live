# Claims Analysis Dashboard - Runtime Evidence Processing

## Claims Status Overview - Live Filtering with Flight SQL

### Multi-Input Filtering Test

**Status Filter:**
<Dropdown name=status_filter>
    <DropdownOption valueLabel="All Statuses" value="" />
    <DropdownOption valueLabel="Pending" value="Pending" />
    <DropdownOption valueLabel="Resolved" value="Resolved" />
    <DropdownOption valueLabel="Rejected" value="Rejected" />
</Dropdown>

**Claim Type Filter:**
<Dropdown name=claim_type_filter>
    <DropdownOption valueLabel="All Types" value="" />
    <DropdownOption valueLabel="Auto" value="Auto" />
    <DropdownOption valueLabel="Home" value="Home" />
    <DropdownOption valueLabel="Health" value="Health" />
    <DropdownOption valueLabel="Life" value="Life" />
</Dropdown>

**Country Filter:**
<Dropdown name=country_filter>
    <DropdownOption valueLabel="All Countries" value="" />
    <DropdownOption valueLabel="USA" value="USA" />
    <DropdownOption valueLabel="Canada" value="Canada" />
    <DropdownOption valueLabel="UK" value="UK" />
</Dropdown>

**Minimum Claims Threshold:**
<TextInput name=min_claims_threshold placeholder="Enter minimum number (e.g., 5)" />

### Current Filter State (Debug Display)
- **Status**: {inputs.status_filter.value || "All Statuses"} (label: {inputs.status_filter.label || "None"})
- **Claim Type**: {inputs.claim_type_filter.value || "All Types"} (label: {inputs.claim_type_filter.label || "None"})
- **Country**: {inputs.country_filter.value || "All Countries"} (label: {inputs.country_filter.label || "None"})
- **Min Threshold**: {inputs.min_claims_threshold.value || "No minimum"}

```sql claims_by_status
-- source: flight_sql
-- Complex multi-condition filtering with Evidence conditionals
SELECT 
  status, 
  count(*) as total_claims,
  round(count(*) * 100.0 / SUM(count(*)) OVER(), 1) as percentage
FROM my_ducklake.main.claims 
WHERE 1=1 
  ${inputs.status_filter.value ? `AND status = '${inputs.status_filter.value}'` : ''}
  ${inputs.claim_type_filter.value ? `AND claim_type = '${inputs.claim_type_filter.value}'` : ''}
  ${inputs.country_filter.value ? `AND country = '${inputs.country_filter.value}'` : ''}
GROUP BY status 
${inputs.min_claims_threshold.value ? `HAVING count(*) >= ${inputs.min_claims_threshold.value}` : ''}
ORDER BY total_claims DESC
```

```sql claims_breakdown_advanced
-- source: flight_sql  
-- Advanced conditional patterns test
SELECT 
  ${inputs.claim_type_filter.value && inputs.country_filter.value ? 
    `CONCAT(claim_type, ' - ', country) as breakdown_category` :
    inputs.claim_type_filter.value ? `claim_type as breakdown_category` :
    inputs.country_filter.value ? `country as breakdown_category` :
    `status as breakdown_category`
  },
  count(*) as total_claims,
  round(avg(case when status = 'Resolved' then 1.0 else 0.0 end) * 100, 1) as resolution_rate
FROM my_ducklake.main.claims 
WHERE 1=1
  ${inputs.status_filter.value ? `AND status = '${inputs.status_filter.value}'` : ''}
  ${inputs.claim_type_filter.value ? `AND claim_type = '${inputs.claim_type_filter.value}'` : ''}
  ${inputs.country_filter.value ? `AND country = '${inputs.country_filter.value}'` : ''}
GROUP BY breakdown_category
${inputs.min_claims_threshold.value ? `HAVING count(*) >= ${inputs.min_claims_threshold.value}` : ''}
ORDER BY total_claims DESC
LIMIT 10
```



## Key Metrics (Filtered Results)

```sql total_stats_filtered
-- source: flight_sql
-- Filtered metrics using all active filters
SELECT 
  count(*) as total_claims,
  count(DISTINCT status) as status_types,
  count(DISTINCT claim_type) as claim_types,
  count(DISTINCT country) as countries,
  round(avg(case when status = 'Resolved' then 1.0 else 0.0 end) * 100, 1) as resolution_rate,
  '${inputs.status_filter.label || "All"}' as status_filter_applied,
  '${inputs.claim_type_filter.label || "All"}' as type_filter_applied,
  '${inputs.country_filter.label || "All"}' as country_filter_applied
FROM my_ducklake.main.claims
WHERE 1=1
  ${inputs.status_filter.value ? `AND status = '${inputs.status_filter.value}'` : ''}
  ${inputs.claim_type_filter.value ? `AND claim_type = '${inputs.claim_type_filter.value}'` : ''}
  ${inputs.country_filter.value ? `AND country = '${inputs.country_filter.value}'` : ''}
```

<BigValue 
  data={total_stats_filtered} 
  value=total_claims 
  title="Total Claims (Filtered)"
/>

<BigValue 
  data={total_stats_filtered} 
  value=resolution_rate 
  title="Resolution Rate (Filtered)"
  fmt="%"
/>

<BigValue 
  data={total_stats_filtered} 
  value=status_types 
  title="Status Types"
/>

<BigValue 
  data={total_stats_filtered} 
  value=claim_types 
  title="Claim Types"
/>

## Filtered Claims Data Table

```sql recent_claims_filtered
-- source: flight_sql
-- Filtered recent claims using all active filters
SELECT 
  country,
  claim_type,
  status,
  state,
  claim_date,
  -- Show which filters were applied
  '${inputs.status_filter.value || "All"}' as status_filter,
  '${inputs.claim_type_filter.value || "All"}' as type_filter,
  '${inputs.country_filter.value || "All"}' as country_filter
FROM my_ducklake.main.claims
WHERE 1=1
  ${inputs.status_filter.value ? `AND status = '${inputs.status_filter.value}'` : ''}
  ${inputs.claim_type_filter.value ? `AND claim_type = '${inputs.claim_type_filter.value}'` : ''}
  ${inputs.country_filter.value ? `AND country = '${inputs.country_filter.value}'` : ''}
ORDER BY claim_date DESC
LIMIT 20
```

<DataTable data={recent_claims_filtered} title="Filtered Claims Data" />

## Advanced Conditional Visualizations

### Dynamic Breakdown Chart
**Note**: Chart grouping changes based on filters applied

<BarChart 
  data={claims_breakdown_advanced} 
  x=breakdown_category 
  y=total_claims 
  title="Dynamic Claims Breakdown"
  subtitle="Grouping: ${inputs.claim_type_filter.value && inputs.country_filter.value ? 'Type + Country' : inputs.claim_type_filter.value ? 'Claim Type' : inputs.country_filter.value ? 'Country' : 'Status'}" 
/>

### Edge Case Testing & Evidence Input Properties

```sql conditional_edge_cases_test
-- source: flight_sql  
-- Test Evidence input property usage and edge cases
SELECT 
  'Input Properties Test' as test_category,
  -- Test .value vs .label vs .toString() 
  '${inputs.status_filter.value}' as raw_value,
  '${inputs.status_filter.label}' as display_label,
  '${inputs.status_filter}' as full_object_string,
  -- Test empty/null handling
  CASE 
    WHEN '${inputs.status_filter.value}' = '' THEN 'Empty Filter'
    WHEN '${inputs.status_filter.value}' IS NULL THEN 'Null Filter'
    ELSE 'Filter Applied: ${inputs.status_filter.value}'
  END as filter_status,
  -- Test complex conditional logic
  CASE 
    WHEN '${inputs.status_filter.value}' != '' AND '${inputs.claim_type_filter.value}' != '' THEN 
      'Multi-filter: ${inputs.status_filter.value} + ${inputs.claim_type_filter.value}'
    WHEN '${inputs.status_filter.value}' != '' THEN 
      'Single filter: Status = ${inputs.status_filter.value}'
    WHEN '${inputs.claim_type_filter.value}' != '' THEN 
      'Single filter: Type = ${inputs.claim_type_filter.value}'
    ELSE 'No filters applied'
  END as conditional_test_result,
  COUNT(*) as record_count
FROM my_ducklake.main.claims
WHERE 1=1
  ${inputs.status_filter.value ? `AND status = '${inputs.status_filter.value}'` : ''}
  ${inputs.claim_type_filter.value ? `AND claim_type = '${inputs.claim_type_filter.value}'` : ''}
  ${inputs.country_filter.value ? `AND country = '${inputs.country_filter.value}'` : ''}
```

<DataTable data={conditional_edge_cases_test} title="Conditional Logic Test Results" />

---

**✅ Runtime Evidence Processing with Advanced Conditionals Active!**
- **Dashboard**: Real DuckLake claims data with complex filtering
- **Source**: `flight_sql` via OAuth proxy authentication  
- **Processing**: Evidence markdown compiled server-side with runtime template evaluation
- **Features**: Multi-input filtering, conditional SQL generation, dynamic visualizations
- **Test Coverage**: Edge cases, input properties, complex boolean logic

### Original Status Chart (Filtered)
<BarChart 
  data={claims_by_status} 
  x=status 
  y=total_claims 
  title="Claims by Status - Filtered Results"
  subtitle="Filters Applied: Status(${inputs.status_filter.label || 'All'}), Type(${inputs.claim_type_filter.label || 'All'}), Country(${inputs.country_filter.label || 'All'})" 
/>