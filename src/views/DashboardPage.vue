<template>
  <div class="dashboard-page">
    <div class="mb-3">
      <h2 class="text-xl font-bold text-gray-800">首页总览</h2>
      <p class="text-sm text-gray-400 mt-0.5">欢迎回来，管理员。以下是系统概览信息。</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <div v-for="(item, idx) in stats" :key="idx" class="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500 font-medium">{{ item.label }}</span>
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="item.bgClass">
            <el-icon :size="18" :class="item.iconClass"><component :is="item.icon" /></el-icon>
          </div>
        </div>
        <div class="text-2xl font-bold text-gray-800">{{ item.value }}</div>
        <div class="text-xs mt-1.5" :class="item.changeClass">{{ item.change }}</div>
      </div>
    </div>

    <!-- Abnormal User Monitoring -->
    <div class="bg-white rounded-xl border border-gray-100">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-4 bg-[#0052D9] rounded-full"></div>
          <h3 class="text-sm font-semibold text-gray-700">异常用户监控</h3>
        </div>
        <span class="text-xs text-gray-400">风险预测与测评结果不一致（差异 ≥ 1级）</span>
      </div>
      <el-table v-loading="loading" :data="abnormalUsers" size="small" stripe style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }">
        <el-table-column prop="name" label="异常用户姓名" width="140" />
        <el-table-column prop="questionnaireLevel" label="问卷测评等级" width="130" align="center">
          <template #default="{ row }">
            <span class="font-semibold text-[#0052D9]">C{{ row.questionnaireLevel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="predictLevel" label="风险预测等级" width="130" align="center">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">C{{ row.predictLevel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="assessTime" label="测评时间" width="130" />
        <el-table-column prop="diff" label="差异值" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.diff < 0 ? 'danger' : 'warning'" size="small" effect="light" round>
              {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="right" min-width="160">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goOverview(row.id, row.name)">
              查看适当性总览
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { resolveIcons } from '../utils/iconMap'
import { getDashboardStats, getAbnormalUsers } from '../api'

const router = useRouter()
const loading = ref(false)
const stats = ref([])
const abnormalUsers = ref([])

async function fetchData() {
  loading.value = true
  try {
    const [statsData, abnormalData] = await Promise.all([
      getDashboardStats(),
      getAbnormalUsers(),
    ])
    stats.value = resolveIcons(statsData)
    abnormalUsers.value = abnormalData
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

function goOverview(id, name) {
  router.push({ path: '/suitability/overview', query: { id, name } })
}
</script>
