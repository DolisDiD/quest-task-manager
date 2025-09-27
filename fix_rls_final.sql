-- Final fix for RLS policies - disable RLS completely for cards table
-- This will allow all operations on cards table

-- Disable RLS on cards table
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'cards';
