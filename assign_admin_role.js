// Скрипт для назначения роли админа
// Запустите этот скрипт в консоли браузера на странице вашего приложения

async function assignAdminRole() {
  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Ошибка получения пользователя:', userError);
      return;
    }
    
    if (!user) {
      console.error('Пользователь не авторизован');
      return;
    }
    
    console.log('Найден пользователь:', user.email, 'ID:', user.id);
    
    // Проверяем существующие роли
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    
    if (rolesError) {
      console.error('Ошибка получения ролей:', rolesError);
      return;
    }
    
    console.log('Существующие роли:', existingRoles);
    
    // Деактивируем все существующие роли
    if (existingRoles && existingRoles.length > 0) {
      const { error: deactivateError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (deactivateError) {
        console.error('Ошибка деактивации ролей:', deactivateError);
        return;
      }
      
      console.log('Существующие роли деактивированы');
    }
    
    // Создаем новую роль админа
    const { data: newRole, error: createError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_type: 'admin',
        is_active: true
      })
      .select('*')
      .single();
    
    if (createError) {
      console.error('Ошибка создания роли админа:', createError);
      return;
    }
    
    console.log('✅ Роль админа успешно назначена!', newRole);
    console.log('Перезагрузите страницу для применения изменений');
    
  } catch (error) {
    console.error('Общая ошибка:', error);
  }
}

// Запускаем функцию
assignAdminRole();

