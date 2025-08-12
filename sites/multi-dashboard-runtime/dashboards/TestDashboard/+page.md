# Test Dashboard

**Multi-dashboard functionality test**

This dashboard lives in its own separate directory and demonstrates the multi-dashboard architecture.

## Sample Data Query

```sql sample_data
SELECT 
    'Dashboard Test' as dashboard,
    1 as id, 
    'Test Record 1' as description,
    100 as value,
    CURRENT_DATE as created_date
UNION ALL
SELECT 'Dashboard Test', 2, 'Test Record 2', 200, CURRENT_DATE
UNION ALL  
SELECT 'Dashboard Test', 3, 'Test Record 3', 150, CURRENT_DATE
```

## Dashboard Components

### Data Table
<DataTable data={sample_data} />

### Chart Visualization  
<BarChart data={sample_data} x=description y=value />

### Big Value
```sql total_value
SELECT SUM(value) as total FROM (${sample_data})
```

<BigValue data={total_value} value=total title="Total Value" />

## Interactive Filter Test

<Dropdown name=selected_record data={sample_data} value=description title="Select Record" />

```sql filtered_data
SELECT * FROM (${sample_data})
WHERE description = '${inputs.selected_record.value}' OR '${inputs.selected_record.value}' IS NULL
```

<DataTable data={filtered_data} />

---

**Dashboard Path**: `/dashboards/TestDashboard`  
**Directory**: `dashboards/TestDashboard/` *(future S3 folder)*  
**Architecture**: Separate dashboard directory, full Evidence features