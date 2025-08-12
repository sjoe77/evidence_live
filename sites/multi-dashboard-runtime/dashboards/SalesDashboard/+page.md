# Sales Dashboard

**Comprehensive sales analytics and performance tracking**

This dashboard lives in its own directory and will be served at `/dashboards/SalesDashboard`.

## Monthly Sales Performance

```sql monthly_sales
SELECT 
    'January' as month,
    85000 as revenue,
    450 as orders,
    189.0 as avg_order_value
UNION ALL
SELECT 'February', 92000, 520, 177.0
UNION ALL
SELECT 'March', 78000, 380, 205.0
UNION ALL
SELECT 'April', 105000, 600, 175.0
UNION ALL
SELECT 'May', 98000, 550, 178.0
UNION ALL
SELECT 'June', 110000, 625, 176.0
```

## Revenue Visualization

<LineChart data={monthly_sales} x=month y=revenue title="Monthly Revenue Trend" />

## Performance Metrics

<DataTable data={monthly_sales} />

## Key Statistics

```sql total_stats
SELECT 
    SUM(revenue) as total_revenue,
    SUM(orders) as total_orders,
    ROUND(AVG(avg_order_value), 2) as overall_avg_order_value
FROM (${monthly_sales})
```

<BigValue data={total_stats} value=total_revenue fmt=usd title="Total Revenue" />
<BigValue data={total_stats} value=total_orders fmt=num0 title="Total Orders" />
<BigValue data={total_stats} value=overall_avg_order_value fmt=usd title="Average Order Value" />

## Top Products

```sql top_products
SELECT 
    'Product A' as product,
    25000 as sales
UNION ALL
SELECT 'Product B', 18500
UNION ALL
SELECT 'Product C', 22000
UNION ALL
SELECT 'Product D', 15500
UNION ALL
SELECT 'Product E', 19000
```

<BarChart data={top_products} x=product y=sales title="Top Products by Sales" />

---

**Dashboard Path**: `/dashboards/SalesDashboard`  
**Directory**: `dashboards/SalesDashboard/` *(future S3 folder)*  
**Features**: Full Evidence components, SQL queries, interactive charts