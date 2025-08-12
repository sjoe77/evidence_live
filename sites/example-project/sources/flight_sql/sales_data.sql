-- Sample sales data for testing charts
SELECT 
    'Product A' as product,
    100 as sales,
    '2024-01-01'::date as date
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