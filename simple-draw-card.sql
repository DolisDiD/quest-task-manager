-- Простая и надежная версия функции draw_card
-- Выполните этот код в Supabase SQL Editor

-- Удаляем старую функцию
DROP FUNCTION IF EXISTS draw_card(UUID, UUID, TEXT);

-- Создаем простую функцию без сложной логики
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
  -- Просто выбираем случайную карточку из пакета
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
    -- Добавляем или обновляем карточку у пользователя
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
  END IF;
END;
$$;

-- Даем права на выполнение
GRANT EXECUTE ON FUNCTION draw_card(UUID, UUID, TEXT) TO authenticated;

-- Комментарий
COMMENT ON FUNCTION draw_card(UUID, UUID, TEXT) IS 'Простая функция выдачи карточек при выполнении квестов';
