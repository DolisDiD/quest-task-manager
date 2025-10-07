-- Диагностика проблемы с карточками
-- Выполните эти запросы в Supabase SQL Editor по очереди

-- 1. Проверяем структуру таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('cards', 'user_cards', 'card_packs')
ORDER BY table_name, ordinal_position;

-- 2. Проверяем, есть ли карточки в базе
SELECT COUNT(*) as total_cards FROM cards;
SELECT COUNT(*) as total_packs FROM card_packs;

-- 3. Проверяем, есть ли карточки в пакетах
SELECT 
    cp.id as pack_id,
    cp.title as pack_title,
    COUNT(c.id) as cards_count
FROM card_packs cp
LEFT JOIN cards c ON cp.id = c.pack_id
GROUP BY cp.id, cp.title
ORDER BY cp.title;

-- 4. Проверяем, есть ли карточки с правильными редкостями
SELECT 
    rarity,
    COUNT(*) as count
FROM cards 
GROUP BY rarity
ORDER BY rarity;

-- 5. Проверяем, существует ли функция draw_card
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'draw_card';

-- 6. Тестируем функцию с реальными данными (замените на ваши UUID)
-- Сначала найдите ID пакета:
-- SELECT id, title FROM card_packs LIMIT 1;

-- Затем протестируйте функцию (замените на реальные UUID):
-- SELECT * FROM draw_card('your-user-id-here', 'your-pack-id-here', 'easy');

-- 7. Проверяем RLS политики
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('cards', 'user_cards', 'card_packs')
ORDER BY tablename, policyname;
