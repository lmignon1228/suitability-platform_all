import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const elementLocale = new Map([
  ['zh', zhCn],
  ['en', en],
])
app.provide('elLocale', elementLocale)

app.use(pinia)
app.use(ElementPlus, { locale: i18n.global.locale.value === 'en' ? en : zhCn })
app.use(i18n)
app.use(router)
app.mount('#app')