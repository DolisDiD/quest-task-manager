-- Отключаем RLS для таблицы cards
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;

-- Проверяем, что RLS отключен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'cards';
