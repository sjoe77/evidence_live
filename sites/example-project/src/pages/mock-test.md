# Flight SQL Mock Mode Test Dashboard

This dashboard tests the Flight SQL HTTP datasource in **mock mode** - perfect for unit testing and development without a real Flight SQL backend.

## Mock Connection Test

```sql test_query
SELECT 1 as id, 'Hello Flight SQL' as message, CURRENT_DATE as today
```

<DataTable data={test_query} />

**Status**: {test_query[0].status}  
**Message**: {test_query[0].message}  
**Today**: {test_query[0].today}

## Mock Sales Data

```sql sales_data  
SELECT product, sales, date FROM sales_table ORDER BY date
```

### Line Chart (Mock Data)
<LineChart data={sales_data} x=date y=sales series=product />

### Bar Chart (Mock Data)
<BarChart data={sales_data} x=product y=sales />

### Data Table (Mock Data)
<DataTable data={sales_data} />

## Mock Aggregation

```sql total_sales
SELECT SUM(sales) as total_sales, COUNT(*) as num_records FROM sales_table
```

**Total Sales**: {total_sales[0].total_sales}  
**Number of Records**: {total_sales[0].num_records}

<BigValue data={total_sales} value=total_sales title="Total Sales (Mock)" />

## Evidence Features with Mock Data

### Dropdown Filter (Mock Data)
<Dropdown name=product_filter data={sales_data} value=product title="Select Product" />

```sql filtered_sales
SELECT * FROM sales_table 
WHERE product = '${inputs.product_filter.value}' OR '${inputs.product_filter.value}' IS NULL
```

<DataTable data={filtered_sales} />

---

✅ **Mock Mode Benefits:**
- No Flight SQL server required
- Fast development iteration
- Predictable test data
- Perfect for unit testing

🔄 **Switch to Real Mode:** Change `endpoint: "mock"` to your actual Flight SQL endpoint in `sources/flight_sql_mock/connection.yaml`