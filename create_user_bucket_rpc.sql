-- RPC функция для создания bucket'а пользователя
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем функцию для создания bucket'а пользователя
CREATE OR REPLACE FUNCTION create_user_bucket(bucket_name TEXT, user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Вставляем новый bucket в storage.buckets
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        bucket_name,
        bucket_name,
        true,
        5242880, -- 5MB лимит
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
    
    -- Создаем RLS политики для bucket'а пользователя
    -- Политика для просмотра файлов (все могут читать)
    EXECUTE format('
        CREATE POLICY "Anyone can view user card images" ON storage.objects
        FOR SELECT USING (bucket_id = %L)
    ', bucket_name);
    
    -- Политика для загрузки файлов (только владелец)
    EXECUTE format('
        CREATE POLICY "User can upload to their bucket" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = %L 
            AND auth.uid() = %L
        )
    ', bucket_name, user_id);
    
    -- Политика для обновления файлов (только владелец)
    EXECUTE format('
        CREATE POLICY "User can update their bucket files" ON storage.objects
        FOR UPDATE USING (
            bucket_id = %L 
            AND auth.uid() = %L
        )
    ', bucket_name, user_id);
    
    -- Политика для удаления файлов (только владелец)
    EXECUTE format('
        CREATE POLICY "User can delete their bucket files" ON storage.objects
        FOR DELETE USING (
            bucket_id = %L 
            AND auth.uid() = %L
        )
    ', bucket_name, user_id);
    
    -- Возвращаем успешный результат
    result := json_build_object('success', true, 'bucket_name', bucket_name);
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Bucket уже существует
        result := json_build_object('success', true, 'bucket_name', bucket_name, 'message', 'Bucket already exists');
        RETURN result;
    WHEN OTHERS THEN
        -- Ошибка создания
        result := json_build_object('success', false, 'error', SQLERRM);
        RETURN result;
END;
$$;

-- Даем права на выполнение функции аутентифицированным пользователям
GRANT EXECUTE ON FUNCTION create_user_bucket(TEXT, UUID) TO authenticated;
