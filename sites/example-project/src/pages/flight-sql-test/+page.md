# Flight SQL Test Dashboard

This dashboard tests the Flight SQL HTTP datasource integration with Evidence.
<!-- Force rebuild and trigger preprocessing -->

## Connection Test

```sql test_query  
-- source: flight_sql_mock
SELECT 
    1 as id, 
    'Hello Flight SQL' as message, 
    CURRENT_DATE as today,
    'Success' as status
```

<DataTable data={test_query} />

**Status**: {test_query[0].status}  
**Message**: {test_query[0].message}  
**Today**: {test_query[0].today}

## Sales Chart Test

```sql sales_data
-- source: flight_sql_mock
SELECT 
    'Product A' as product,
    100 as sales,
    '2024-01-01'::date as order_date
UNION ALL
SELECT 'Product B', 200, '2024-01-02'::date
UNION ALL  
SELECT 'Product C', 150, '2024-01-03'::date
UNION ALL
SELECT 'Product A', 120, '2024-01-04'::date
UNION ALL
SELECT 'Product B', 180, '2024-01-05'::date
UNION ALL
SELECT 'Product C', 220, '2024-01-06'::date
```

### Line Chart
<LineChart data={sales_data} x=order_date y=sales series=product />

### Bar Chart  
<BarChart data={sales_data} x=product y=sales />

### Data Table
<DataTable data={sales_data} />

## Query Chaining Test

```sql total_sales
-- source: flight_sql_mock
SELECT 
    SUM(sales) as total_sales,
    COUNT(*) as num_records
FROM (${sales_data})
```

**Total Sales**: {total_sales[0].total_sales}  
**Number of Records**: {total_sales[0].num_records}

<BigValue data={total_sales} value=total_sales title="Total Sales" />

## Evidence Features Test

### Filters and Parameters
<Dropdown name=selected_product data={sales_data} value=product title="Select Product" />

```sql filtered_sales
-- source: flight_sql_mock
SELECT * FROM (${sales_data})
WHERE product = '${inputs.selected_product.value}' OR '${inputs.selected_product.value}' IS NULL
```

<DataTable data={filtered_sales} />

### Chart Interactions
Click on any point in the chart below to see interactions work:

<LineChart data={sales_data} x=order_date y=sales series=product />

---

*This dashboard verifies that all Evidence features work properly with the Flight SQL HTTP datasource.*