<template>
  <div class="risk-cognition-page">
    <CustomerSearchBar
      :initial-customer-id="routeCustomerId"
      :initial-customer-name="routeCustomerName"
      @customer-change="onCustomerChange"
    />

    <!-- Top KPI Cards -->
    <div v-loading="loading" class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
      <div v-for="(kpi, idx) in kpiCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="text-xs text-gray-400 mb-1">{{ kpi.label }}</div>
        <div class="flex items-end gap-2">
          <span class="text-xl font-bold" :class="kpi.valueClass">{{ kpi.value }}</span>
          <span v-if="kpi.unit" class="text-xs text-gray-400 mb-0.5">{{ kpi.unit }}</span>
        </div>
        <div v-if="kpi.sub" class="text-xs mt-1" :class="kpi.subClass">{{ kpi.sub }}</div>
      </div>
    </div>

    <!-- Trend Chart + Interpretation -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <div class="lg:col-span-2 bg-white rounded-xl p-3 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-700">近12个月风险认知趋势</h3>
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <span class="w-3 h-0.5 bg-red-500 inline-block rounded"></span>问卷测评结果
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-0.5 bg-primary-500 inline-block rounded"></span>风险认知分值
            </span>
          </div>
        </div>
        <div ref="trendChartRef" class="w-full" style="height: 240px;"></div>
      </div>
      <div class="bg-white rounded-xl p-3 border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">趋势解读</h3>
        <div class="space-y-2.5">
          <div class="p-2 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-400 mb-0.5">趋势描述</div>
            <div class="text-sm text-gray-700" v-html="interp.trendDesc"></div>
          </div>
          <div class="p-2 bg-green-50 rounded-lg">
            <div class="text-xs text-green-400 mb-0.5">关键拐点</div>
            <div class="text-sm text-gray-700">{{ interp.turningPoint }}</div>
          </div>
          <div class="p-2 bg-primary-50 rounded-lg">
            <div class="text-xs text-primary-400 mb-0.5">与问卷等级关系</div>
            <div class="text-sm text-gray-700">{{ interp.relationToQ }}</div>
          </div>
          <div class="p-2 bg-green-50 rounded-lg">
            <div class="text-xs text-green-400 mb-0.5">建议</div>
            <div class="text-sm text-gray-700">{{ interp.suggestion }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dual-Axis Chart -->
    <div class="bg-white rounded-xl p-3 border border-gray-100 mb-3">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">风险认知与投资知识/产品行为关系</h3>
      <div ref="dualAxisChartRef" class="w-full" style="height: 240px;"></div>
      <div class="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2.5">
        <div class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold whitespace-nowrap mt-0.5">
          图表解读
        </div>
        <div class="text-xs text-gray-600 leading-relaxed" v-html="dualAxisInterp"></div>
      </div>
    </div>

    <!-- Bottom Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div v-for="(m, idx) in metricCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center" :class="m.bgClass">
            <el-icon :size="14" :class="m.iconClass"><component :is="m.icon" /></el-icon>
          </div>
          <span class="text-xs text-gray-400">{{ m.label }}</span>
        </div>
        <div class="text-lg font-bold text-gray-800 mb-0.5">{{ m.value }}</div>
        <div class="w-full bg-gray-100 rounded-full h-1 mt-1.5">
          <div class="h-1 rounded-full transition-all" :class="m.barClass" :style="{ width: m.pct + '%' }"></div>
        </div>
        <div class="text-xs text-gray-400 mt-0.5">{{ m.range }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import CustomerSearchBar from '../../components/CustomerSearchBar.vue'
import { getCustomerRiskData } from '../../api'
import { resolveIcons } from '../../utils/iconMap'

const route = useRoute()
const trendChartRef = ref(null)
const dualAxisChartRef = ref(null)
let trendChart = null
let dualAxisChart = null

const routeCustomerId = computed(() => route.query.id || '')
const routeCustomerName = computed(() => route.query.name || '')
const customerId = ref(routeCustomerId.value || 'C00008231')
const loading = ref(false)

const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测']

const kpiCards = ref([])
const metricCards = ref([])
const interp = ref({ trendDesc: '', turningPoint: '', relationToQ: '', suggestion: '' })
const dualAxisInterp = ref('')

async function fetchAndApply(id) {
  loading.value = true
  try {
    const data = await getCustomerRiskData(id)
    const cog = data.cognition
    kpiCards.value = cog.kpi || []
    metricCards.value = resolveIcons(cog.metric || [])
    interp.value = cog.interp || {}
    dualAxisInterp.value = cog.dualAxisInterp || ''
    refreshTrend(cog.trend || {})
    refreshDualAxis(cog.dualAxis || {})
  } finally {
    loading.value = false
  }
}

function buildTrendOption(t) {
  return {
    tooltip: {
      trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5eaf2', borderWidth: 1,
      textStyle: { color: '#303133', fontSize: 12 },
      formatter(params) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`
        params.forEach(p => { if (p.value == null) return; const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`; html += `<div style="margin:2px 0">${dot}${p.seriesName}: C${Number(p.value).toFixed(1)}</div>` })
        return html
      }
    },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: months, boundaryGap: false, axisLine: { lineStyle: { color: '#e5eaf2' } }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 11, rotate: 30 } },
    yAxis: { type: 'value', min: 1, max: 5, interval: 1, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } }, axisLabel: { color: '#909399', fontSize: 11, formatter: 'C{value}' } },
    series: [
      { name: '问卷测评', type: 'line', data: t.q, lineStyle: { color: '#F56C6C', width: 2 }, itemStyle: { color: '#F56C6C' }, symbol: 'circle', symbolSize: 6, smooth: false, connectNulls: false },
      { name: '问卷预测', type: 'line', data: t.qP, lineStyle: { color: '#F56C6C', width: 2, type: 'dashed' }, itemStyle: { color: '#F56C6C' }, symbol: 'diamond', symbolSize: 7, smooth: false, connectNulls: false },
      { name: '风险认知', type: 'line', data: t.d, lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, symbol: 'circle', symbolSize: 6, smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,93,255,0.15)' }, { offset: 1, color: 'rgba(22,93,255,0.01)' }]) },
        markPoint: { data: [{ type: 'max', name: '最高' }, { type: 'min', name: '最低' }], symbolSize: 40, label: { fontSize: 10, formatter: 'C{c}' } }
      },
      { name: '认知预测', type: 'line', data: t.dP, lineStyle: { color: '#165DFF', width: 2, type: 'dashed' }, itemStyle: { color: '#165DFF' }, symbol: 'diamond', symbolSize: 7, smooth: true, connectNulls: false },
    ]
  }
}

function buildDualAxisOption(da) {
  const m = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06']
  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5eaf2', borderWidth: 1, textStyle: { color: '#303133', fontSize: 12 } },
    legend: { data: ['投资知识得分', '产品行为频次'], top: 0, textStyle: { color: '#909399', fontSize: 11 } },
    grid: { top: 35, right: 60, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: m, axisLine: { lineStyle: { color: '#e5eaf2' } }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 11 } },
    yAxis: [
      { type: 'value', min: 0, max: 100, name: '知识得分', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } }, axisLabel: { color: '#909399', fontSize: 11 } },
      { type: 'value', min: 0, max: 35, name: '行为频次', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: '#909399', fontSize: 11 } }
    ],
    series: [
      { name: '投资知识得分', type: 'bar', data: da.knowledge, barWidth: '40%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#165DFF' }, { offset: 1, color: '#699EFF' }]), borderRadius: [4, 4, 0, 0] } },
      { name: '产品行为频次', type: 'line', yAxisIndex: 1, data: da.behavior, lineStyle: { color: '#E6A23C', width: 2 }, itemStyle: { color: '#E6A23C' }, symbol: 'circle', symbolSize: 6, smooth: true },
    ]
  }
}

function refreshTrend(t) { if (trendChart) trendChart.setOption(buildTrendOption(t), { notMerge: true }) }
function refreshDualAxis(da) { if (dualAxisChart) dualAxisChart.setOption(buildDualAxisOption(da), { notMerge: true }) }

function onCustomerChange({ id }) {
  customerId.value = id
  fetchAndApply(id)
}

watch(() => route.query.id, (val) => {
  if (val && val !== customerId.value) {
    customerId.value = val
    fetchAndApply(val)
  }
})

function handleResize() { trendChart?.resize(); dualAxisChart?.resize() }

onMounted(() => {
  trendChart = echarts.init(trendChartRef.value)
  dualAxisChart = echarts.init(dualAxisChartRef.value)
  window.addEventListener('resize', handleResize)
  fetchAndApply(customerId.value)
})

onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); dualAxisChart?.dispose() })
</script>

<style scoped>
.risk-cognition-page {
  min-height: calc(100vh - 120px);
}
</style>
