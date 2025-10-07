-- Исправление проблемы с неоднозначностью card_id
-- Этот файл содержит диагностические запросы и исправления

-- 1. Проверяем структуру таблиц для понимания проблемы
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_cards', 'cards') 
    AND column_name LIKE '%card%'
ORDER BY table_name, ordinal_position;

-- 2. Проверяем существующие индексы
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('user_cards', 'cards')
ORDER BY tablename, indexname;

-- 3. Проверяем внешние ключи
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('user_cards', 'cards');

-- 4. Создаем представление для безопасного доступа к коллекции пользователя
-- Это представление решает проблему неоднозначности на уровне базы данных
CREATE OR REPLACE VIEW user_collection_view AS
SELECT 
    uc.user_id,
    uc.card_id as user_card_id,
    uc.qty_base,
    uc.qty_rare,
    uc.qty_epic,
    uc.qty_legendary,
    uc.created_at as user_card_created_at,
    uc.updated_at as user_card_updated_at,
    c.id as card_id,
    c.pack_id,
    c.title as card_title,
    c.rarity,
    c.image_url,
    c.created_at as card_created_at,
    c.updated_at as card_updated_at
FROM user_cards uc
INNER JOIN cards c ON uc.card_id = c.id;

-- 5. Даем права на представление
GRANT SELECT ON user_collection_view TO authenticated;

-- 6. Создаем RLS политику для представления
ALTER VIEW user_collection_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collection" ON user_collection_view
FOR SELECT USING (user_id = auth.uid());

-- 7. Комментарий к представлению
COMMENT ON VIEW user_collection_view IS 'Безопасное представление коллекции пользователя без неоднозначности card_id';

-- 8. Тестовый запрос для проверки
-- SELECT * FROM user_collection_view WHERE user_id = 'your-user-id-here' LIMIT 5;
