-- Create sync_status_view in the JetAgriTracker schema
CREATE OR REPLACE VIEW JetAgriTracker.sync_status_view AS
WITH last_sync AS (
    SELECT 
        table_name,
        MAX(updated_at) as last_sync_time
    FROM 
        JetAgriTracker.sync_log
    WHERE 
        synced = true
    GROUP BY 
        table_name
)
SELECT 
    'farmers' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.farmers) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'farmers') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'farmers' AND synced = false) as pending_changes

UNION ALL

SELECT 
    'lands' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.lands) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'lands') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'lands' AND synced = false) as pending_changes

UNION ALL

SELECT 
    'crops' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.crops) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'crops') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'crops' AND synced = false) as pending_changes

UNION ALL

SELECT 
    'transactions' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.transactions) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'transactions') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'transactions' AND synced = false) as pending_changes;

-- Grant permissions to authenticated users
GRANT SELECT ON JetAgriTracker.sync_status_view TO authenticated;

COMMENT ON VIEW JetAgriTracker.sync_status_view IS 'Provides sync status information for all tables in the JetAgriTracker schema';

-- Verify the view was created
SELECT 'sync_status_view created successfully in JetAgriTracker schema' as status;
