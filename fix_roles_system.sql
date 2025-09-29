-- Исправление системы ролей
-- Удаляем проблемные RLS политики и пересоздаем их

-- Удаляем все RLS политики для user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- Удаляем все RLS политики для invitation_codes
DROP POLICY IF EXISTS "Users can view codes they created" ON invitation_codes;
DROP POLICY IF EXISTS "Users can view codes they can use" ON invitation_codes;
DROP POLICY IF EXISTS "Users can create codes if they have permission" ON invitation_codes;

-- Удаляем все RLS политики для subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;

-- Создаем простые RLS политики без рекурсии
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view codes they created" ON invitation_codes
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view unused codes" ON invitation_codes
  FOR SELECT USING (is_active = true AND used_by IS NULL);

CREATE POLICY "Users can create codes" ON invitation_codes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update codes they created" ON invitation_codes
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Проверяем, что таблицы существуют
SELECT 'user_roles' as table_name, count(*) as count FROM user_roles
UNION ALL
SELECT 'invitation_codes' as table_name, count(*) as count FROM invitation_codes
UNION ALL
SELECT 'subscriptions' as table_name, count(*) as count FROM subscriptions
UNION ALL
SELECT 'role_limits' as table_name, count(*) as count FROM role_limits;
