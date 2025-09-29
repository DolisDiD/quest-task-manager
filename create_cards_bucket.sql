-- Создание bucket для карточек в Supabase Storage
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем bucket для карточек
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards',
  'cards',
  true,
  5242880, -- 5MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS политики для bucket'а cards
-- Политика для просмотра файлов (все могут читать)
CREATE POLICY "Anyone can view card images" ON storage.objects
FOR SELECT USING (bucket_id = 'cards');

-- Политика для загрузки файлов (только аутентифицированные пользователи)
CREATE POLICY "Authenticated users can upload card images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cards' 
  AND auth.role() = 'authenticated'
);

-- Политика для обновления файлов (только владельцы)
CREATE POLICY "Users can update their own card images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cards' 
  AND auth.role() = 'authenticated'
);

-- Политика для удаления файлов (только владельцы)
CREATE POLICY "Users can delete their own card images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cards' 
  AND auth.role() = 'authenticated'
);
