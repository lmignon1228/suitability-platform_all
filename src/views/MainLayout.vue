<template>
  <div class="main-layout h-screen flex flex-col bg-gray-50">
    <!-- Top Header -->
    <header class="h-14 bg-primary-700 flex items-center justify-between px-5 flex-shrink-0 shadow-md z-50">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-white/15 backdrop-blur rounded-lg flex items-center justify-center">
            <el-icon :size="18" color="#fff"><Promotion /></el-icon>
          </div>
          <span class="text-white font-semibold text-base tracking-wide">用户适当性管理平台</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <el-badge :value="3" :max="9" class="notification-badge">
          <el-button circle size="small" class="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
        <el-dropdown trigger="click">
          <div class="flex items-center gap-2 cursor-pointer group">
            <el-avatar :size="32" class="!bg-primary-400">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="text-white/90 text-sm group-hover:text-white">管理员</span>
            <el-icon class="text-white/60" :size="12"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="User">个人中心</el-dropdown-item>
              <el-dropdown-item :icon="Setting">系统设置</el-dropdown-item>
              <el-dropdown-item divided :icon="SwitchButton" @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 overflow-hidden shadow-sm">
        <div class="flex-1 overflow-y-auto py-2">
          <el-menu
            :default-active="activeMenu"
            :default-openeds="['suitability']"
            router
            class="!border-none"
          >
            <el-menu-item index="/dashboard">
              <el-icon><Odometer /></el-icon>
              <span>首页总览</span>
            </el-menu-item>

            <el-sub-menu index="suitability">
              <template #title>
                <el-icon><DataAnalysis /></el-icon>
                <span>适当性管理</span>
              </template>
              <el-menu-item index="/suitability/overview">
                <el-icon><PieChart /></el-icon>
                <span>适当性总览</span>
              </el-menu-item>
              <el-menu-item index="/suitability/objective">
                <el-icon><TrendCharts /></el-icon>
                <span>客观风险承受力</span>
              </el-menu-item>
              <el-menu-item index="/suitability/preference">
                <el-icon><Operation /></el-icon>
                <span>风险偏好</span>
              </el-menu-item>
              <el-menu-item index="/suitability/cognition">
                <el-icon><Reading /></el-icon>
                <span>风险认知</span>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="p-3 border-t border-gray-100">
          <div class="bg-primary-50 rounded-lg p-3">
            <div class="text-xs text-primary-700 font-medium mb-1">系统版本</div>
            <div class="text-xs text-primary-500">v3.2.1 · 2024.06</div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50">
        <div class="p-3">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Promotion, Bell, User, ArrowDown, Setting, SwitchButton, Odometer, DataAnalysis, PieChart, TrendCharts, Operation, Reading } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    sessionStorage.removeItem('token')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

:deep(.el-menu) {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #606266;
  --el-menu-active-color: #165DFF;
  --el-menu-hover-bg-color: #ECF5FF;
  --el-menu-hover-text-color: #165DFF;
}

:deep(.el-menu-item.is-active) {
  background-color: #ECF5FF !important;
  border-right: 3px solid #165DFF;
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 52px !important;
  min-width: auto;
}

:deep(.el-sub-menu__title) {
  font-size: 14px;
}

:deep(.el-menu-item) {
  font-size: 14px;
  height: 44px;
  line-height: 44px;
}

:deep(.el-menu-item span) {
  margin-left: 4px;
}

.notification-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}
</style>
