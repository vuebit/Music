
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../components/LoginView.vue'
import pages from '../pages/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Console',
      component: pages,
      meta: { requiresAuth: true }
    },
    // ریدایرکت خودکار
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// محافظت از مسیرها (Guard)
// router.beforeEach((to, from) => {
//   const isAuthenticated = localStorage.getItem('wvfrm_auth') === 'true'
  
//   if (to.meta.requiresAuth && !isAuthenticated) {
//     return '/login'
//   }
  
//   if (to.path === '/login' && isAuthenticated) {
//     return '/'
//   }
// })

export default router