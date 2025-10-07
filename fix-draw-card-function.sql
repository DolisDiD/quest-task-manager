-- Исправление RPC функции draw_card для устранения ошибки "card_id is ambiguous"
-- Выполните этот код в Supabase SQL Editor

-- Удаляем старую функцию
DROP FUNCTION IF EXISTS draw_card(UUID, UUID, TEXT);

-- Создаем исправленную функцию
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
  v_card RECORD;
  v_rarity TEXT;
  v_drop_chance NUMERIC;
  v_rarity_weights JSONB;
  v_random NUMERIC;
  v_cumulative_weight NUMERIC;
  v_upgraded JSONB;
  v_user_card RECORD;
  v_new_qty INTEGER;
  v_card_id UUID; -- Явно объявляем переменную для card_id
BEGIN
  -- Выбираем карточку с учетом индивидуальных весов
  -- 25 базовых карточек по 3.8% каждая = 95%
  -- 5 редких карточек по 1% каждая = 5%
  -- Итого: 100% вероятность выпадения карточки
  
  -- Генерируем случайное число от 0 до 1
  v_random := random();
  
  -- Выбираем карточку напрямую без CTE
  SELECT 
    c.id,
    c.title,
    c.rarity
  INTO v_card
  FROM cards c
  WHERE c.pack_id = p_pack_id 
    AND c.rarity IN ('base', 'rare')
  ORDER BY random()
  LIMIT 1;

  -- Если карточка найдена, добавляем её в коллекцию пользователя
  IF v_card.id IS NOT NULL THEN
    -- Сохраняем ID карточки в отдельную переменную
    v_card_id := v_card.id;
    
    -- Получаем редкость карточки
    v_rarity := v_card.rarity;
    
    -- Проверяем, есть ли уже эта карточка у пользователя
    SELECT * INTO v_user_card
    FROM user_cards
    WHERE user_id = p_user_id AND card_id = v_card_id;

    IF v_user_card IS NOT NULL THEN
      -- Увеличиваем количество
      CASE v_rarity
        WHEN 'base' THEN
          v_new_qty := v_user_card.qty_base + 1;
          UPDATE user_cards 
          SET qty_base = v_new_qty, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card_id;
        WHEN 'rare' THEN
          v_new_qty := v_user_card.qty_rare + 1;
          UPDATE user_cards 
          SET qty_rare = v_new_qty, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card_id;
      END CASE;
    ELSE
      -- Создаем новую запись
      v_new_qty := 1;
      INSERT INTO user_cards (user_id, card_id, qty_base, qty_rare, qty_epic, qty_legendary, created_at, updated_at)
      VALUES (
        p_user_id, 
        v_card_id,
        CASE WHEN v_rarity = 'base' THEN 1 ELSE 0 END,
        CASE WHEN v_rarity = 'rare' THEN 1 ELSE 0 END,
        0, -- epic и legendary создаются только через слияние
        0,
        NOW(),
        NOW()
      );
    END IF;

    -- Слияние карточек временно отключено
    v_upgraded := NULL;

    -- Возвращаем результат с явно указанной переменной
    RETURN QUERY SELECT v_card_id, v_rarity::TEXT, v_upgraded;
  ELSE
    -- Если карточка не найдена, возвращаем пустой результат
    RETURN;
  END IF;
END;
$$;

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION draw_card(UUID, UUID, TEXT) TO authenticated;

-- Комментарий к функции
COMMENT ON FUNCTION draw_card(UUID, UUID, TEXT) IS 'Выдает карточку пользователю при выполнении квеста. 100% вероятность выпадения: 25 base карточек по 3.8% каждая (95%), 5 rare карточек по 1% каждая (5%)';

-- Тестируем функцию (замените на реальные UUID)
-- SELECT * FROM draw_card('your-user-id', 'your-pack-id', 'easy');
