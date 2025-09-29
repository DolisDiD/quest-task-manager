-- Проверка и создание bucket'а для карточек
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Проверяем существующие bucket'ы
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY created_at;

-- 2. Создаем bucket 'cards' если его нет
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cards',
    'cards',
    true,
    5242880, -- 5MB лимит
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Создаем RLS политики для bucket'а 'cards'
-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Anyone can view card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete card images" ON storage.objects;

-- Создаем новые политики
CREATE POLICY "Anyone can view card images" ON storage.objects
FOR SELECT USING (bucket_id = 'cards');

CREATE POLICY "Authenticated users can upload card images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'cards' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update card images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'cards' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete card images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'cards' 
    AND auth.role() = 'authenticated'
);

-- 4. Проверяем результат
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'cards';
