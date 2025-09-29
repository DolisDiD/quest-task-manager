# Ручная настройка bucket'а 'cards' в Supabase

## Способ 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Storage** → **Buckets**
4. Нажмите **"New bucket"**
5. Заполните поля:
   - **Name**: `cards`
   - **Public bucket**: ✅ (включено)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
6. Нажмите **"Create bucket"**

## Способ 2: Через SQL Editor

1. Откройте Supabase Dashboard
2. Перейдите в **SQL Editor**
3. Выполните следующий SQL:

```sql
-- Создаем bucket 'cards'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards',
  'cards',
  true,
  5242880, -- 5MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Создаем RLS политики
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
```

## Способ 3: Проверка существующих bucket'ов

Выполните в SQL Editor:

```sql
SELECT * FROM storage.buckets;
```

Это покажет все существующие bucket'ы в вашем проекте.

## После создания bucket'а

1. Обновите страницу приложения (Ctrl+F5)
2. Попробуйте загрузить изображение для карточки
3. Если все еще есть ошибки, проверьте консоль браузера (F12)
