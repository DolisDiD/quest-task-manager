-- Окончательное исправление функции draw_card
-- Выполните этот код в Supabase SQL Editor

-- 1. Сначала удаляем все старые версии функции
DROP FUNCTION IF EXISTS draw_card(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS draw_card(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS draw_card;

-- 2. Проверяем, что таблицы существуют и имеют правильную структуру
-- Если этих таблиц нет, создаем их
CREATE TABLE IF NOT EXISTS cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pack_id UUID NOT NULL,
    title TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('base', 'rare', 'epic', 'legendary')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    qty_base INTEGER DEFAULT 0,
    qty_rare INTEGER DEFAULT 0,
    qty_epic INTEGER DEFAULT 0,
    qty_legendary INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

CREATE TABLE IF NOT EXISTS card_packs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    is_builtin BOOLEAN DEFAULT false,
    owner_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем простую и надежную функцию draw_card
CREATE OR REPLACE FUNCTION draw_card(
    p_user_id UUID,
    p_pack_id UUID,
    p_difficulty TEXT
)
RETURNS TABLE(
    card_id UUID,
    rarity TEXT,
    upgraded JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    selected_card_id UUID;
    selected_rarity TEXT;
BEGIN
    -- Выбираем случайную карточку из указанного пакета
    SELECT 
        c.id,
        c.rarity
    INTO 
        selected_card_id,
        selected_rarity
    FROM cards c
    WHERE c.pack_id = p_pack_id 
        AND c.rarity IN ('base', 'rare')
    ORDER BY random()
    LIMIT 1;

    -- Если карточка найдена
    IF selected_card_id IS NOT NULL THEN
        -- Добавляем карточку пользователю или увеличиваем количество
        INSERT INTO user_cards (user_id, card_id, qty_base, qty_rare, qty_epic, qty_legendary, created_at, updated_at)
        VALUES (
            p_user_id, 
            selected_card_id,
            CASE WHEN selected_rarity = 'base' THEN 1 ELSE 0 END,
            CASE WHEN selected_rarity = 'rare' THEN 1 ELSE 0 END,
            0,
            0,
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id, card_id) 
        DO UPDATE SET
            qty_base = CASE 
                WHEN selected_rarity = 'base' THEN user_cards.qty_base + 1 
                ELSE user_cards.qty_base 
            END,
            qty_rare = CASE 
                WHEN selected_rarity = 'rare' THEN user_cards.qty_rare + 1 
                ELSE user_cards.qty_rare 
            END,
            updated_at = NOW();

        -- Возвращаем результат
        RETURN QUERY SELECT selected_card_id, selected_rarity, NULL::JSONB;
    ELSE
        -- Если карточка не найдена, возвращаем пустой результат
        RETURN;
    END IF;
END;
$$;

-- 4. Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION draw_card(UUID, UUID, TEXT) TO authenticated;

-- 5. Включаем RLS для таблиц
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_packs ENABLE ROW LEVEL SECURITY;

-- 6. Создаем RLS политики
-- Политики для cards
DROP POLICY IF EXISTS "Users can view cards" ON cards;
CREATE POLICY "Users can view cards" ON cards FOR SELECT USING (true);

-- Политики для user_cards
DROP POLICY IF EXISTS "Users can view their own cards" ON user_cards;
CREATE POLICY "Users can view their own cards" ON user_cards FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own cards" ON user_cards;
CREATE POLICY "Users can insert their own cards" ON user_cards FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own cards" ON user_cards;
CREATE POLICY "Users can update their own cards" ON user_cards FOR UPDATE USING (user_id = auth.uid());

-- Политики для card_packs
DROP POLICY IF EXISTS "Users can view card packs" ON card_packs;
CREATE POLICY "Users can view card packs" ON card_packs FOR SELECT USING (true);

-- 7. Создаем тестовые данные, если их нет
INSERT INTO card_packs (id, title, description, is_builtin) 
VALUES (
    'a0384274-e165-4536-9296-c6ddc6633bce',
    'Базовый пакет',
    'Стандартный пакет карточек',
    true
) ON CONFLICT (id) DO NOTHING;

-- Создаем несколько тестовых карточек
INSERT INTO cards (pack_id, title, rarity) VALUES
    ('a0384274-e165-4536-9296-c6ddc6633bce', 'Карточка 1', 'base'),
    ('a0384274-e165-4536-9296-c6ddc6633bce', 'Карточка 2', 'base'),
    ('a0384274-e165-4536-9296-c6ddc6633bce', 'Карточка 3', 'base'),
    ('a0384274-e165-4536-9296-c6ddc6633bce', 'Редкая карточка 1', 'rare'),
    ('a0384274-e165-4536-9296-c6ddc6633bce', 'Редкая карточка 2', 'rare')
ON CONFLICT DO NOTHING;

-- 8. Тестируем функцию
-- SELECT * FROM draw_card('fbac6997-4244-432b-b80b-d33cb02741fc', 'a0384274-e165-4536-9296-c6ddc6633bce', 'rare');
