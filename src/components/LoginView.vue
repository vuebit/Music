<template>
  <div class="login-container">
    <div class="auth-card" v-if="!isLoggedIn">
      <div class="auth-header text-center">
        <div class="brand-icon mb-2"><i class="bi bi-shield-lock-fill"></i></div>
        <h1 class="h4 fw-semibold mb-1">خوش آمدید</h1>
        <p class="text-secondary small mb-0">برای دسترسی به کنسول وارد شوید</p>
      </div>

      <div class="auth-body">
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-envelope text-secondary"></i></span>
              <div class="form-floating flex-grow-1">
                <input type="email" class="form-control" v-model="email" placeholder="name@gmail.com" required>
                <label>آدرس ایمیل</label>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock text-secondary"></i></span>
              <div class="form-floating flex-grow-1 position-relative">
                <input :type="showPass ? 'text' : 'password'" class="form-control" v-model="password" placeholder="رمز عبور" required>
                <label>رمز عبور</label>
                <button class="toggle-password" type="button" @click="showPass = !showPass">
                  <i :class="showPass ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
                </button>
              </div>
            </div>
          </div>

          <div id="loginError" v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

        
          <button class="btn btn-primary w-100 py-2 rounded-3" type="submit" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'در حال ورود...' : 'ورود به کنسول' }}
          </button>
        </form>
      </div>
      
      <div class="auth-footer text-center text-secondary">
        <small>کاربران تست: admin@gmail.com / 123456</small>
      </div>
    </div>

    <!-- اگر لاگین بود، کامپوننت اصلی برنامه را نشان بده -->
    <div v-else class="w-100 h-100">
       <slot /> <!-- اینجا محتوای اصلی برنامه قرار می‌گیرد -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


const email = ref('')
const password = ref('')
const showPass = ref(false)
const loading = ref(false)
const error = ref('')
const isLoggedIn = ref(false)

// دیتابیس ساده کاربران
const users = [
  { email: "admin@gmail.com", password: "123456", name: "مدیر سیستم" },
  { email: "user@gmail.com", password: "password", name: "کاربر عادی" }
]

function handleLogin() {
  loading.value = true
  error.value = ''

  setTimeout(() => {
    const user = users.find(u => u.email === email.value && u.password === password.value)
    
    if (user) {
      isLoggedIn.value = true
      // ذخیره وضعیت در لوکال استوریج
      localStorage.setItem('wvfrm_auth', 'true')
    } else {
      error.value = 'ایمیل یا رمز عبور اشتباه است.'
      loading.value = false
    }
  }, 800)
}

// چک کردن وضعیت قبلی هنگام لود
if (localStorage.getItem('wvfrm_auth')) {
  isLoggedIn.value = true
}
</script>

<style>
/* ایمپورت استایل‌های لاگین */
@import '../assets/login.css'; 
/* نکته: مطمئن شوید فایل login.css را ساخته‌اید و کدهای CSS قبلی را در آن گذاشته‌اید */
/* همچنین لینک بوت‌استرپ و آیکون‌ها باید در index.html اصلی باشند */
</style>