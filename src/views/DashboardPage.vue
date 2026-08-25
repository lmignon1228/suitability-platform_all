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
      <el-table :data="abnormalUsers" size="small" stripe style="width: 100%"
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
import { markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { User, DataAnalysis, Warning, CircleCheck } from '@element-plus/icons-vue'

const router = useRouter()

const stats = [
  { label: '管理客户总数', value: '12,847', icon: markRaw(User), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', change: '↑ 较上月 +3.2%', changeClass: 'text-green-500' },
  { label: '已完成评估', value: '11,203', icon: markRaw(CircleCheck), bgClass: 'bg-green-50', iconClass: 'text-green-500', change: '↑ 评估完成率 87.2%', changeClass: 'text-green-500' },
  { label: '风险预警数', value: '236', icon: markRaw(Warning), bgClass: 'bg-red-50', iconClass: 'text-red-500', change: '↑ 较上月 +12', changeClass: 'text-red-500' },
  { label: '待处理工单', value: '48', icon: markRaw(DataAnalysis), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', change: '↓ 较上月 -5', changeClass: 'text-green-500' },
]

const abnormalUsers = [
  { id: 'C00012857', name: '张景豪', questionnaireLevel: 5, predictLevel: 3, assessTime: '2026-05-18', diff: -2 },
  { id: 'C00012858', name: '王建国', questionnaireLevel: 4, predictLevel: 5, assessTime: '2026-06-10', diff: 1 },
  { id: 'C00012859', name: '赵思远', questionnaireLevel: 5, predictLevel: 3, assessTime: '2026-07-02', diff: -2 },
  { id: 'C00012860', name: '陈晓明', questionnaireLevel: 3, predictLevel: 5, assessTime: '2026-08-01', diff: 2 },
]

function goOverview(id, name) {
  router.push({ path: '/suitability/overview', query: { id, name } })
}
</script>
