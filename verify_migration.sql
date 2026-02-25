-- Verify migration success
SELECT 'Template Items' as check_name, COUNT(*) as count FROM checklist_template_items
UNION ALL
SELECT 'Rate Limit Table', COUNT(*) FROM information_schema.tables WHERE table_name = 'user_rate_limits'
UNION ALL
SELECT 'API Usage Table', COUNT(*) FROM information_schema.tables WHERE table_name = 'api_usage_logs'
UNION ALL
SELECT 'Session Checklists', COUNT(*) FROM information_schema.tables WHERE table_name = 'session_checklists';
