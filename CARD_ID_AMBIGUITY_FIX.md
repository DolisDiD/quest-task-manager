# Исправление ошибки "column reference 'card_id' is ambiguous"

## Проблема
При выполнении квестов возникала ошибка: `Ошибка выдачи карточки: column reference "card_id" is ambiguous`

## Причина
Ошибка возникала в функции `loadCollection` в файле `src/App.jsx` на строке 583. При использовании Supabase запроса с `cards!inner` JOIN, PostgreSQL не мог определить, какую именно колонку `card_id` использовать:
- В таблице `user_cards` есть колонка `card_id` (внешний ключ)
- В контексте JOIN'а PostgreSQL интерпретировал это как неоднозначность

## Решение

### 1. Исправление в коде (УЖЕ ВЫПОЛНЕНО)
В файле `src/App.jsx` изменен запрос:
```javascript
// БЫЛО:
.select('card_id, qty_base, qty_rare, qty_epic, qty_legendary, cards!inner(id, pack_id, title, rarity, image_url)')

// СТАЛО:
.select('user_cards.card_id, qty_base, qty_rare, qty_epic, qty_legendary, cards!inner(id, pack_id, title, rarity, image_url)')
```

### 2. Дополнительные исправления в базе данных (ОПЦИОНАЛЬНО)
Выполните SQL скрипт `fix-card-id-ambiguity.sql` для создания представления `user_collection_view`, которое решает проблему на уровне базы данных.

## Проверка исправления

1. **Перезапустите приложение**
2. **Выполните квест** - карточка должна выпасть без ошибок
3. **Проверьте коллекцию** - карточки должны отображаться корректно

## Альтернативные решения

Если проблема сохраняется, можно использовать:

### Решение A: Разделение запросов
```javascript
// Сначала получаем user_cards
const { data: userCards } = await supabase
  .from('user_cards')
  .select('card_id, qty_base, qty_rare, qty_epic, qty_legendary')
  .eq('user_id', user.id);

// Затем получаем данные карточек
const cardIds = userCards.map(uc => uc.card_id);
const { data: cards } = await supabase
  .from('cards')
  .select('id, pack_id, title, rarity, image_url')
  .in('id', cardIds)
  .eq('pack_id', packId);
```

### Решение B: Использование представления
```javascript
const { data, error } = await supabase
  .from('user_collection_view')
  .select('*')
  .eq('user_id', user.id)
  .eq('pack_id', packId);
```

## Файлы изменены
- ✅ `src/App.jsx` - исправлен запрос в loadCollection
- ✅ `fix-card-id-ambiguity.sql` - создан SQL скрипт для дополнительных исправлений
- ✅ `CARD_ID_AMBIGUITY_FIX.md` - создана документация

## Статус
🟢 **ИСПРАВЛЕНО** - Основная проблема решена изменением запроса в коде.
