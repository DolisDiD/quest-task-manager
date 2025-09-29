-- Создание системы ролей и кодов приглашений
-- Этап 1: Создание таблиц

-- Таблица ролей пользователей
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('admin', 'archimage', 'explorer')),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_type)
);

-- Таблица кодов приглашений
CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('archimage', 'explorer')),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица подписок
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('archimage')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица лимитов для ролей
CREATE TABLE IF NOT EXISTS role_limits (
  role_type VARCHAR(20) PRIMARY KEY,
  max_packs INTEGER DEFAULT 0,
  max_invitation_codes INTEGER DEFAULT 0,
  can_create_packs BOOLEAN DEFAULT false,
  can_create_codes BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false
);

-- Вставляем лимиты для ролей
INSERT INTO role_limits (role_type, max_packs, max_invitation_codes, can_create_packs, can_create_codes, can_manage_users) VALUES 
('admin', 999999, 999999, true, true, true),
('archimage', 3, 10, true, true, false),
('explorer', 0, 0, false, false, false)
ON CONFLICT (role_type) DO NOTHING;

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_created_by ON invitation_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active ON invitation_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS политики для user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_type = 'admin' 
      AND is_active = true
    )
  );

-- RLS политики для invitation_codes
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view codes they created" ON invitation_codes
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view codes they can use" ON invitation_codes
  FOR SELECT USING (is_active = true AND used_by IS NULL);

CREATE POLICY "Users can create codes if they have permission" ON invitation_codes
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_type IN ('admin', 'archimage')
      AND is_active = true
    )
  );

-- RLS политики для subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_type = 'admin' 
      AND is_active = true
    )
  );
