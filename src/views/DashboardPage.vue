<template>
  <div class="dashboard-page">
    <div class="mb-3">
      <h2 class="text-xl font-bold text-gray-800">{{ t('dashboard.title') }}</h2>
      <p class="text-sm text-gray-400 mt-0.5">{{ t('dashboard.subtitle') }}</p>
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
          <h3 class="text-sm font-semibold text-gray-700">{{ t('dashboard.abnormalUsers') }}</h3>
        </div>
        <span class="text-xs text-gray-400">{{ t('dashboard.abnormalUsersDesc') }}</span>
      </div>
      <el-table v-loading="loading" :data="abnormalUsers" size="small" stripe style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }">
        <el-table-column prop="name" :label="t('dashboard.abnormalUserName')" width="140" />
        <el-table-column prop="questionnaireLevel" :label="t('dashboard.questionnaireLevel')" width="130" align="center">
          <template #default="{ row }">
            <span class="font-semibold text-[#0052D9]">C{{ row.questionnaireLevel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="predictLevel" :label="t('dashboard.predictLevel')" width="130" align="center">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">C{{ row.predictLevel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="assessTime" :label="t('dashboard.assessTime')" width="130" />
        <el-table-column prop="diff" :label="t('dashboard.levelDiff')" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.diff < 0 ? 'danger' : 'warning'" size="small" effect="light" round>
              {{ formatDiff(row.diff) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('dashboard.action')" align="right" min-width="160">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goOverview(row.id, row.name)">
              {{ t('dashboard.viewOverview') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import i18n from '../i18n'
import { useCustomerStore } from '../stores/customer'
import { resolveIcons } from '../utils/iconMap'
import { getDashboardStats, getAbnormalUsers } from '../api'

const { t, locale } = useI18n()
const router = useRouter()
const customerStore = useCustomerStore()
const loading = ref(false)
const stats = ref([])
const abnormalUsers = ref([])

const statLabelKeys = [
  { key: 'totalCustomers', match: ['管理客户总数'] },
  { key: 'completedAssessments', match: ['已完成评估'] },
  { key: 'riskAlerts', match: ['风险预警数'] },
  { key: 'pendingWorkOrders', match: ['待处理工单'] },
]

function translateStatLabel(label) {
  const hit = statLabelKeys.find(s => s.match.some(m => (label || '').includes(m)))
  return hit ? t(`dashboard.statLabels.${hit.key}`) : label
}

function translateChange(raw) {
  if (!raw) return raw
  return raw
    .replace('较上月', t('dashboard.vsLastMonth'))
    .replace('评估完成率', t('dashboard.completionRate'))
}

async function fetchData() {
  loading.value = true
  try {
    const [statsData, abnormalData] = await Promise.all([
      getDashboardStats(),
      getAbnormalUsers(),
    ])
    stats.value = resolveIcons(statsData).map(s => ({
      ...s,
      rawLabel: s.label,
      rawChange: s.change,
      label: translateStatLabel(s.label),
      change: translateChange(s.change),
    }))
    abnormalUsers.value = abnormalData
  } finally {
    loading.value = false
  }
}

function formatDiff(diff) {
  const prefix = diff > 0 ? '+' : ''
  const suffix = locale.value === 'en' ? (Math.abs(diff) === 1 ? ' Level' : ' Levels') : '级'
  return `${prefix}${diff}${suffix}`
}

watch(() => i18n.global.locale.value, () => {
  stats.value = stats.value.map(s => ({
    ...s,
    label: translateStatLabel(s.rawLabel),
    change: translateChange(s.rawChange),
  }))
})

onMounted(fetchData)

function goOverview(id, name) {
  customerStore.setCustomer(id)
  router.push({ path: '/suitability/overview', query: { id, name } })
}
</script>
