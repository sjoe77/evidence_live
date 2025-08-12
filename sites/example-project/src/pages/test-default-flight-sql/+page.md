# Test Default Flight SQL

This page tests that ALL queries default to Flight SQL without needing `-- source:` comments.

## Query WITHOUT Source Comment

```sql no_source_test
SELECT 
    'No source comment!' as message,
    42 as number,
    CURRENT_DATE as today
```

<DataTable data={no_source_test} />

**Message**: {no_source_test[0].message}  
**Number**: {no_source_test[0].number}

## Sales Data WITHOUT Source Comment

```sql sales_without_source
SELECT 
    'Product X' as product,
    500 as sales,
    '2024-02-01' as order_date
UNION ALL
SELECT 'Product Y', 300, '2024-02-02'
UNION ALL
SELECT 'Product Z', 700, '2024-02-03'
```

<LineChart data={sales_without_source} x=order_date y=sales series=product />

---

*All queries on this page use Flight SQL by default - no `-- source:` comments needed!*