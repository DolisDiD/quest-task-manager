-- RPC функция для выдачи карточек при завершении квеста
-- Выполните этот скрипт в Supabase SQL Editor

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
  v_cards_to_draw INTEGER;
  v_card RECORD;
  v_dropped_cards UUID[];
  v_result RECORD;
  v_upgraded JSONB;
BEGIN
  -- Определяем количество карточек в зависимости от сложности
  IF p_difficulty = 'rare' THEN
    v_cards_to_draw := 1;
  ELSIF p_difficulty = 'legendary' THEN
    v_cards_to_draw := 2;
  ELSE
    v_cards_to_draw := 1; -- По умолчанию 1 карточка
  END IF;

  -- Выбираем случайные карточки из пачки
  FOR i IN 1..v_cards_to_draw LOOP
    SELECT c.id, c.rarity
    INTO v_card
    FROM cards c
    WHERE c.pack_id = p_pack_id
    ORDER BY RANDOM()
    LIMIT 1;

    IF v_card.id IS NOT NULL THEN
      -- Добавляем карточку в массив выпавших
      v_dropped_cards := array_append(v_dropped_cards, v_card.id);
      
      -- Добавляем карточку пользователю или увеличиваем количество
      INSERT INTO user_cards (user_id, card_id, qty_base, qty_rare, qty_epic, qty_legendary)
      VALUES (
        p_user_id,
        v_card.id,
        CASE WHEN v_card.rarity = 'base' THEN 1 ELSE 0 END,
        CASE WHEN v_card.rarity = 'rare' THEN 1 ELSE 0 END,
        CASE WHEN v_card.rarity = 'epic' THEN 1 ELSE 0 END,
        CASE WHEN v_card.rarity = 'legendary' THEN 1 ELSE 0 END
      )
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET
        qty_base = user_cards.qty_base + (CASE WHEN v_card.rarity = 'base' THEN 1 ELSE 0 END),
        qty_rare = user_cards.qty_rare + (CASE WHEN v_card.rarity = 'rare' THEN 1 ELSE 0 END),
        qty_epic = user_cards.qty_epic + (CASE WHEN v_card.rarity = 'epic' THEN 1 ELSE 0 END),
        qty_legendary = user_cards.qty_legendary + (CASE WHEN v_card.rarity = 'legendary' THEN 1 ELSE 0 END);

      -- Проверяем на слияние карточек (3 одинаковые = 1 следующего уровня)
      IF v_card.rarity = 'base' THEN
        -- Проверяем, есть ли 3 базовые карточки
        IF (SELECT qty_base FROM user_cards WHERE user_id = p_user_id AND card_id = v_card.id) >= 3 THEN
          -- Создаем эпическую карточку
          INSERT INTO user_cards (user_id, card_id, qty_base, qty_rare, qty_epic, qty_legendary)
          VALUES (p_user_id, v_card.id, -3, 0, 1, 0)
          ON CONFLICT (user_id, card_id)
          DO UPDATE SET
            qty_base = user_cards.qty_base - 3,
            qty_epic = user_cards.qty_epic + 1;
          
          v_upgraded := jsonb_build_object(
            'card_id', v_card.id,
            'from', 'base',
            'to', 'epic'
          );
        END IF;
      ELSIF v_card.rarity = 'rare' THEN
        -- Проверяем, есть ли 3 редкие карточки
        IF (SELECT qty_rare FROM user_cards WHERE user_id = p_user_id AND card_id = v_card.id) >= 3 THEN
          -- Создаем легендарную карточку
          INSERT INTO user_cards (user_id, card_id, qty_base, qty_rare, qty_epic, qty_legendary)
          VALUES (p_user_id, v_card.id, 0, -3, 0, 1)
          ON CONFLICT (user_id, card_id)
          DO UPDATE SET
            qty_rare = user_cards.qty_rare - 3,
            qty_legendary = user_cards.qty_legendary + 1;
          
          v_upgraded := jsonb_build_object(
            'card_id', v_card.id,
            'from', 'rare',
            'to', 'legendary'
          );
        END IF;
      END IF;

      -- Возвращаем информацию о выпавшей карточке
      RETURN QUERY SELECT v_card.id, v_card.rarity, v_upgraded;
    END IF;
  END LOOP;
END;
$$;

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION draw_card(UUID, UUID, TEXT) TO authenticated;
