// Система валидации для Quest Manager
// Обеспечивает безопасность и корректность данных на клиенте

// Базовые валидаторы
export const validators = {
  // Email валидация
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Некорректный email адрес';
  },

  // Пароль валидация
  password: (value) => {
    if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
    if (!/[A-Z]/.test(value)) return 'Пароль должен содержать заглавную букву';
    if (!/[a-z]/.test(value)) return 'Пароль должен содержать строчную букву';
    if (!/\d/.test(value)) return 'Пароль должен содержать цифру';
    return true;
  },

  // Имя пользователя
  name: (value) => {
    if (!value || value.trim().length < 2) return 'Имя должно содержать минимум 2 символа';
    if (value.length > 50) return 'Имя не должно превышать 50 символов';
    if (!/^[а-яё\s\w-]+$/i.test(value)) return 'Имя содержит недопустимые символы';
    return true;
  },

  // Название квеста
  questTitle: (value) => {
    if (!value || value.trim().length < 3) return 'Название квеста должно содержать минимум 3 символа';
    if (value.length > 100) return 'Название квеста не должно превышать 100 символов';
    return true;
  },

  // Описание квеста
  questDescription: (value) => {
    if (value && value.length > 500) return 'Описание не должно превышать 500 символов';
    return true;
  },


  // Дата валидация
  date: (value) => {
    if (!value) return true; // Дата необязательна
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Некорректная дата';
    
    // Получаем текущую дату без времени (только дата)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Устанавливаем время для введенной даты в начало дня для корректного сравнения
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    
    if (inputDate < today) return 'Дата не может быть в прошлом';
    return true;
  },

  // Название карточки
  cardTitle: (value) => {
    if (!value || value.trim().length < 2) return 'Название карточки должно содержать минимум 2 символа';
    if (value.length > 50) return 'Название карточки не должно превышать 50 символов';
    return true;
  },

  // Название пачки карточек
  packTitle: (value) => {
    if (!value || value.trim().length < 3) return 'Название пачки должно содержать минимум 3 символа';
    if (value.length > 100) return 'Название пачки не должно превышать 100 символов';
    return true;
  },

  // Код приглашения
  invitationCode: (value) => {
    if (!value || value.trim().length < 8) return 'Код должен содержать минимум 8 символов';
    if (value.length > 20) return 'Код не должен превышать 20 символов';
    if (!/^[A-Z0-9-]+$/.test(value)) return 'Код может содержать только заглавные буквы, цифры и дефисы';
    return true;
  }
};

// Функция для валидации формы
export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const result = rule(value);
    
    if (result !== true) {
      errors[field] = result;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Схемы валидации для разных форм
export const validationSchemas = {
  // Регистрация
  register: {
    name: validators.name,
    email: validators.email,
    password: validators.password,
    confirmPassword: (value, formData) => {
      if (value !== formData.password) return 'Пароли не совпадают';
      return true;
    }
  },

  // Вход
  login: {
    email: validators.email,
    password: (value) => value ? true : 'Введите пароль'
  },

  // Создание квеста
  quest: {
    title: validators.questTitle,
    description: validators.questDescription,
    dueDate: validators.date
  },

  // Создание карточки
  card: {
    title: validators.cardTitle,
    rarity: (value) => {
      const validRarities = ['base', 'rare', 'epic', 'legendary'];
      return validRarities.includes(value) || 'Некорректная редкость';
    }
  },

  // Создание пачки
  pack: {
    title: validators.packTitle,
    description: validators.questDescription
  },

  // Активация кода
  activateCode: {
    code: validators.invitationCode
  }
};

// Функция для санитизации данных
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .replace(/\s+/g, ' '); // Нормализуем пробелы
};

// Функция для проверки прав доступа
export const checkPermission = (userRole, permission) => {
  const permissions = {
    admin: ['can_create_packs', 'can_create_codes', 'can_manage_users', 'can_view_all'],
    archimage: ['can_create_packs', 'can_create_codes'],
    explorer: []
  };
  
  return permissions[userRole?.role_type]?.includes(permission) || false;
};

// Функция для валидации файлов изображений
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!file) return 'Выберите файл';
  if (file.size > maxSize) return 'Размер файла не должен превышать 5MB';
  if (!allowedTypes.includes(file.type)) return 'Поддерживаются только JPEG, PNG, WebP и GIF';
  
  return true;
};

// Хук для валидации форм
export const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (data) => {
    const result = validateForm(data, schema);
    setErrors(result.errors);
    return result.isValid;
  };
  
  const validateField = (field, value, formData = {}) => {
    const rule = schema[field];
    if (!rule) return true;
    
    const result = rule(value, formData);
    if (result !== true) {
      setErrors(prev => ({ ...prev, [field]: result }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    return result === true;
  };
  
  const markFieldTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  const reset = () => {
    setErrors({});
    setTouched({});
  };
  
  return {
    errors,
    touched,
    validate,
    validateField,
    markFieldTouched,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

