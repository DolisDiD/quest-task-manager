-- Проверка RLS политик для таблицы cards
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'cards';

-- Создание/обновление RLS политик для таблицы cards
-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view cards" ON cards;
DROP POLICY IF EXISTS "Users can insert cards" ON cards;
DROP POLICY IF EXISTS "Users can update cards" ON cards;
DROP POLICY IF EXISTS "Users can delete cards" ON cards;

-- Создаем новые политики
CREATE POLICY "Users can view cards" ON cards
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cards" ON cards
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cards" ON cards
FOR UPDATE USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete cards" ON cards
FOR DELETE USING (auth.role() = 'authenticated');

-- Проверяем, что RLS включен для таблицы cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Проверяем структуру таблицы cards
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cards' 
ORDER BY ordinal_position;




