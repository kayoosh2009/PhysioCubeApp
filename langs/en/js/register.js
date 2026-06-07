// register.js

// 1. Вставь сюда свои данные из Supabase (Project Settings -> API)
const SUPABASE_URL = 'https://skssnhvmckezjkrfyrus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrc3NuaHZtY2tlemprcmZ5cnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTc0ODAsImV4cCI6MjA5NTg5MzQ4MH0.upK5CvCQ9pMNuqhwVi8VKREakbhCAPIAn-5z4Y2zD4o';

// Инициализация клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const msgEl = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Останавливаем стандартную перезагрузку страницы
    
    // Очищаем предыдущие сообщения
    msgEl.textContent = '';
    msgEl.className = '';

    // Собираем данные из полей по их id
    const payload = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      personalId: document.getElementById('personalId').value.trim(),
      gender: document.getElementById('gender').value,
      sport: document.getElementById('sport').value.trim(),
      hospital: document.getElementById('hospital').value
    };

    // Простая валидация
    if (!payload.email || !payload.password || !payload.firstName || !payload.lastName) {
      return showMsg('Please fill in all required fields', 'error');
    }

    try {
      // 2. Регистрируем пользователя в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password
      });

      if (authError) throw authError;

      // 3. Сохраняем дополнительные данные в таблицу 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id, // Связываем с пользователем из Auth
            first_name: payload.firstName,
            last_name: payload.lastName,
            personal_id: payload.personalId,
            gender: payload.gender,
            sport: payload.sport,
            hospital: payload.hospital
          }
        ]);

      if (profileError) throw profileError;

      // Успех
      showMsg('✅ Account created successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '../main.html'; // Или туда, куда нужно перенаправить
      }, 2000);

    } catch (err) {
      // Показываем ошибку от Supabase
      showMsg(err.message || 'Registration failed. Please try again.', 'error');
      console.error('Registration error:', err);
    }
  });

  // Вспомогательная функция для вывода сообщений
  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = type; // 'success' или 'error' (стили уже есть в твоем CSS)
  }
});