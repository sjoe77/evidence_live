SELECT status, count(*) as total_claims
FROM my_ducklake.main.claims 
GROUP BY status
ORDER BY total_claims DESC