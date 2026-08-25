import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../views/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardPage.vue'),
        meta: { title: '首页总览' }
      },
      {
        path: 'suitability/overview',
        name: 'SuitabilityOverview',
        component: () => import('../views/suitability/SuitabilityOverview.vue'),
        meta: { title: '适当性总览', parent: '适当性管理' }
      },
      {
        path: 'suitability/objective',
        name: 'ObjectiveRisk',
        component: () => import('../views/suitability/ObjectiveRisk.vue'),
        meta: { title: '客观风险承受力', parent: '适当性管理' }
      },
      {
        path: 'suitability/preference',
        name: 'RiskPreference',
        component: () => import('../views/suitability/RiskPreference.vue'),
        meta: { title: '风险偏好', parent: '适当性管理' }
      },
      {
        path: 'suitability/cognition',
        name: 'RiskCognition',
        component: () => import('../views/suitability/RiskCognition.vue'),
        meta: { title: '风险认知', parent: '适当性管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '用户适当性管理平台'} - 用户适当性管理平台`
  if (to.path !== '/login' && !sessionStorage.getItem('token')) {
    next('/login')
  } else {
    next()
  }
})

export default router
