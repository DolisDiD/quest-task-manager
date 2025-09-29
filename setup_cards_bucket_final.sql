-- Финальная настройка bucket'а 'cards' для всех пользователей
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем bucket 'cards' если его еще нет
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards',
  'cards',
  true,
  5242880, -- 5MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Anyone can view card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own card images" ON storage.objects;

-- Создаем новые RLS политики для bucket'а 'cards'
-- Политика для просмотра файлов (все могут читать)
CREATE POLICY "Anyone can view card images" ON storage.objects
FOR SELECT USING (bucket_id = 'cards');

-- Политика для загрузки файлов (только аутентифицированные пользователи)
CREATE POLICY "Authenticated users can upload card images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cards' 
  AND auth.role() = 'authenticated'
);

-- Политика для обновления файлов (только аутентифицированные пользователи)
CREATE POLICY "Authenticated users can update card images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cards' 
  AND auth.role() = 'authenticated'
);

-- Политика для удаления файлов (только аутентифицированные пользователи)
CREATE POLICY "Authenticated users can delete card images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cards' 
  AND auth.role() = 'authenticated'
);
