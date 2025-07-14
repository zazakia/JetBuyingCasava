-- Check existing schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('cassavajet', 'jetagritracker', 'jetagritracker')
ORDER BY schema_name;

-- Check tables in both schemas
SELECT 
    table_schema,
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema IN ('cassavajet', 'jetagritracker')
ORDER BY 
    table_schema, 
    table_name;
