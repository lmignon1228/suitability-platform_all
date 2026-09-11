<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import i18n from './i18n'

const staticLocaleMap = { zh: zhCn, en }

const saved = ref(i18n.global.locale.value === 'en' ? en : zhCn)
const elementLocale = computed(() => saved.value)

watch(
  () => i18n.global.locale.value,
  (val) => {
    saved.value = staticLocaleMap[val] || zhCn
  }
)
</script>