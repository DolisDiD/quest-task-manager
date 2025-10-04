-- RPC функция для выдачи карточек при выполнении квестов
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
BEGIN
  -- Определяем веса редкости в зависимости от сложности
  CASE p_difficulty
    WHEN 'common' THEN
      v_rarity_weights := '{"base": 0.7, "rare": 0.25, "epic": 0.05, "legendary": 0.0}'::JSONB;
    WHEN 'rare' THEN
      v_rarity_weights := '{"base": 0.4, "rare": 0.45, "epic": 0.13, "legendary": 0.02}'::JSONB;
    WHEN 'epic' THEN
      v_rarity_weights := '{"base": 0.2, "rare": 0.35, "epic": 0.35, "legendary": 0.1}'::JSONB;
    WHEN 'legendary' THEN
      v_rarity_weights := '{"base": 0.1, "rare": 0.25, "epic": 0.4, "legendary": 0.25}'::JSONB;
    ELSE
      v_rarity_weights := '{"base": 0.5, "rare": 0.3, "epic": 0.15, "legendary": 0.05}'::JSONB;
  END CASE;

  -- Генерируем случайное число для определения редкости
  v_random := random();
  v_cumulative_weight := 0;
  v_rarity := 'base'; -- значение по умолчанию

  -- Определяем редкость на основе весов
  FOR v_rarity IN SELECT jsonb_object_keys(v_rarity_weights) LOOP
    v_cumulative_weight := v_cumulative_weight + (v_rarity_weights->v_rarity)::NUMERIC;
    IF v_random <= v_cumulative_weight THEN
      EXIT;
    END IF;
  END LOOP;

  -- Выбираем случайную карточку указанной редкости из пачки
  SELECT c.id, c.title, c.rarity
  INTO v_card
  FROM cards c
  WHERE c.pack_id = p_pack_id 
    AND c.rarity = v_rarity
  ORDER BY random()
  LIMIT 1;

  -- Если карточка найдена, добавляем её в коллекцию пользователя
  IF v_card.id IS NOT NULL THEN
    -- Проверяем, есть ли уже эта карточка у пользователя
    SELECT * INTO v_user_card
    FROM user_cards
    WHERE user_id = p_user_id AND card_id = v_card.id;

    IF v_user_card IS NOT NULL THEN
      -- Увеличиваем количество
      CASE v_rarity
        WHEN 'base' THEN
          v_new_qty := v_user_card.qty_base + 1;
          UPDATE user_cards 
          SET qty_base = v_new_qty, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
        WHEN 'rare' THEN
          v_new_qty := v_user_card.qty_rare + 1;
          UPDATE user_cards 
          SET qty_rare = v_new_qty, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
        WHEN 'epic' THEN
          v_new_qty := v_user_card.qty_epic + 1;
          UPDATE user_cards 
          SET qty_epic = v_new_qty, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
        WHEN 'legendary' THEN
          v_new_qty := v_user_card.qty_legendary + 1;
          UPDATE user_cards 
          SET qty_legendary = v_new_qty, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
      END CASE;
    ELSE
      -- Создаем новую запись
      INSERT INTO user_cards (user_id, card_id, qty_base, qty_rare, qty_epic, qty_legendary, created_at, updated_at)
      VALUES (
        p_user_id, 
        v_card.id,
        CASE WHEN v_rarity = 'base' THEN 1 ELSE 0 END,
        CASE WHEN v_rarity = 'rare' THEN 1 ELSE 0 END,
        CASE WHEN v_rarity = 'epic' THEN 1 ELSE 0 END,
        CASE WHEN v_rarity = 'legendary' THEN 1 ELSE 0 END,
        NOW(),
        NOW()
      );
    END IF;

    -- Проверяем возможность слияния (если у пользователя 3+ карточки одной редкости)
    v_upgraded := NULL;
    CASE v_rarity
      WHEN 'base' THEN
        IF v_new_qty >= 3 THEN
          v_upgraded := jsonb_build_object(
            'card_id', v_card.id,
            'from', 'base',
            'to', 'rare',
            'count', 3
          );
          -- Уменьшаем количество базовых карточек
          UPDATE user_cards 
          SET qty_base = qty_base - 3, qty_rare = qty_rare + 1, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
        END IF;
      WHEN 'rare' THEN
        IF v_new_qty >= 3 THEN
          v_upgraded := jsonb_build_object(
            'card_id', v_card.id,
            'from', 'rare',
            'to', 'epic',
            'count', 3
          );
          -- Уменьшаем количество редких карточек
          UPDATE user_cards 
          SET qty_rare = qty_rare - 3, qty_epic = qty_epic + 1, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
        END IF;
      WHEN 'epic' THEN
        IF v_new_qty >= 3 THEN
          v_upgraded := jsonb_build_object(
            'card_id', v_card.id,
            'from', 'epic',
            'to', 'legendary',
            'count', 3
          );
          -- Уменьшаем количество эпических карточек
          UPDATE user_cards 
          SET qty_epic = qty_epic - 3, qty_legendary = qty_legendary + 1, updated_at = NOW()
          WHERE user_id = p_user_id AND card_id = v_card.id;
        END IF;
    END CASE;

    -- Возвращаем результат
    RETURN QUERY SELECT v_card.id, v_rarity::TEXT, v_upgraded;
  ELSE
    -- Если карточка не найдена, возвращаем пустой результат
    RETURN;
  END IF;
END;
$$;

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION draw_card(UUID, UUID, TEXT) TO authenticated;

-- Комментарий к функции
COMMENT ON FUNCTION draw_card(UUID, UUID, TEXT) IS 'Выдает карточку пользователю при выполнении квеста с учетом сложности и весов редкости';
