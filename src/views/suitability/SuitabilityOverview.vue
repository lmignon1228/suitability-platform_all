<template>
  <div class="suitability-overview">
    <CustomerSearchBar
      :initial-customer-id="routeCustomerId"
      :initial-customer-name="routeCustomerName"
      @customer-change="onCustomerChange"
    />

    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
      <div v-for="(kpi, idx) in currentKpiCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="text-xs text-gray-400 mb-1">{{ tr(kpi.label) }}</div>
        <div class="flex items-end gap-2">
          <span class="text-xl font-bold" :class="kpi.valueClass">{{ kpi.value }}</span>
          <span v-if="kpi.unit" class="text-xs text-gray-400 mb-0.5">{{ trUnit(kpi.unit, kpi.value) }}</span>
        </div>
        <div v-if="kpi.sub" class="text-xs mt-1" :class="kpi.subClass">{{ tr(kpi.sub) }}</div>
      </div>
    </div>

    <!-- Sub-module Entry Cards -->
    <div v-loading="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <div v-for="(card, idx) in currentModuleCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 cursor-pointer hover:shadow-lg transition-all group"
        :class="{ 'cursor-default': card.disabled }"
        @click="!card.disabled && $router.push(card.route)">
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="card.iconBg">
            <el-icon :size="18" :class="card.iconColor"><component :is="card.icon" /></el-icon>
          </div>
          <el-tag :type="card.tagType" size="small" effect="light" round>{{ tr(card.tag) }}</el-tag>
        </div>
        <div class="text-sm font-medium text-gray-700 mb-0.5">{{ tr(card.title) }}</div>
        <div class="flex items-baseline gap-2 mb-1">
          <span class="text-lg font-bold" :class="card.valueClass">{{ tr(card.value) }}</span>
          <span class="text-xs" :class="card.trendClass">{{ tr(card.trend) }}</span>
        </div>
        <div class="text-xs text-gray-400">{{ tr(card.desc) }}</div>
        <div v-if="!card.disabled" class="text-xs text-primary-500 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {{ t('overview.viewDetail') }} →
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <div class="lg:col-span-2 bg-white rounded-xl p-3 border border-gray-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-700">{{ t('overview.trendTitle') }}</h3>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <span class="w-3 h-0.5 bg-red-500 inline-block rounded"></span>{{ t('overview.qLegend') }}
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-0.5 bg-primary-500 inline-block rounded"></span>{{ t('overview.trendLegend') }}
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-0.5 bg-red-400 inline-block rounded" style="border-top:1.5px dashed #F56C6C;height:0"></span>{{ t('overview.predict') }}
              </span>
            </div>
          </div>
          <div ref="trendChartRef" class="w-full" style="height: 260px;"></div>
        </div>
        <div class="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2.5">
          <div class="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-semibold whitespace-nowrap mt-0.5">
            {{ t('overview.trendInterpBadge') }}
          </div>
          <div class="text-xs text-gray-600 leading-relaxed" v-html="currentTrendInterp"></div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-3 border border-gray-100 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">{{ t('overview.radarTitle') }}</h3>
          <div ref="radarChartRef" class="w-full" style="height: 240px;"></div>
        </div>
        <div class="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <div class="text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span>{{ t('overview.radarSubtitle') }}</span>
            <span class="text-gray-400 font-normal">{{ t('overview.radarCompare') }}</span>
          </div>
          <div class="text-xs text-gray-600 leading-relaxed" v-html="currentRadarInterp"></div>
        </div>
      </div>
    </div>

    <!-- Diagnosis Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div class="bg-white rounded-xl border border-red-100 overflow-hidden">
        <div class="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
          <el-icon class="text-red-500"><WarningFilled /></el-icon>
          <span class="text-sm font-semibold text-red-700">{{ t('overview.declineReasons') }}</span>
        </div>
        <div class="p-3">
          <div v-for="(reason, idx) in currentDeclineReasons" :key="idx" class="flex items-start gap-2 mb-2 last:mb-0">
            <span class="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{{ idx + 1 }}</span>
            <div>
              <div class="text-sm text-gray-700">{{ tr(reason.title) }}</div>
              <div class="text-xs text-gray-400 mt-0.5 whitespace-pre-line">{{ reason.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-primary-100 overflow-hidden">
        <div class="px-4 py-2 bg-primary-50 border-b border-primary-100 flex items-center gap-2">
          <el-icon class="text-primary-500"><InfoFilled /></el-icon>
          <span class="text-sm font-semibold text-primary-700">{{ t('overview.suggestions') }}</span>
        </div>
        <div class="p-3">
          <div v-for="(sug, idx) in currentSuggestions" :key="idx" class="flex items-start gap-2 mb-2 last:mb-0">
            <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{{ idx + 1 }}</span>
            <div>
              <div class="text-sm text-gray-700">{{ tr(sug.title) }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ sug.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { translateBackendText as trText, translateBackendUnit as trUnit } from '../../utils/translateText'
import * as echarts from 'echarts'
import { WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import CustomerSearchBar from '../../components/CustomerSearchBar.vue'
import { getCustomerRiskData } from '../../api'
import { resolveIcons } from '../../utils/iconMap'

const { t, tm, locale } = useI18n()
const route = useRoute()
const trendChartRef = ref(null)
const radarChartRef = ref(null)
let trendChart = null
let radarChart = null

const routeCustomerId = computed(() => route.query.id || '')
const routeCustomerName = computed(() => route.query.name || '')
const currentCustomerId = ref(routeCustomerId.value || 'C00008231')
const loading = ref(false)

const currentKpiCards = ref([])
const currentModuleCards = ref([])
const currentDeclineReasons = ref([])
const currentSuggestions = ref([])
const currentTrendInterp = ref('')
const currentRadarInterp = ref('')

const lastTrend = ref(null)
const lastRadar = ref(null)

function tr(s) {
  return trText(s)
}

const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07']

async function fetchAndApply(id) {
  loading.value = true
  try {
    const data = await getCustomerRiskData(id)
    const ov = data.overview
    currentKpiCards.value = ov.kpi || []
    currentModuleCards.value = resolveIcons(ov.modules || [])
    currentDeclineReasons.value = ov.reasons || []
    currentSuggestions.value = ov.suggestions || []
    currentTrendInterp.value = ov.trendInterp || ''
    currentRadarInterp.value = ov.radarInterp || ''
    nextTick(() => {
      lastTrend.value = ov.trend || {}
      lastRadar.value = ov.radar || {}
      refreshTrendChart(lastTrend.value)
      refreshRadarChart(lastRadar.value)
    })
  } finally {
    loading.value = false
  }
}

function onCustomerChange({ id }) {
  currentCustomerId.value = id
  fetchAndApply(id)
}

watch(() => route.query.id, (val) => {
  if (val && val !== currentCustomerId.value) {
    currentCustomerId.value = val
    fetchAndApply(val)
  }
})

watch(locale, () => {
  if (!lastTrend.value && !lastRadar.value) return
  nextTick(() => {
    refreshTrendChart(lastTrend.value)
    refreshRadarChart(lastRadar.value)
    trendChart?.resize()
    radarChart?.resize()
  })
})

function buildTrendOption(td) {
  const qLegend = t('overview.qLegend')
  const qPredictLegend = t('overview.qPredictLegend')
  const trendLegend = t('overview.trendLegend')
  const trendPredictLegend = t('overview.trendPredictLegend')
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5eaf2',
      borderWidth: 1,
      textStyle: { color: '#303133', fontSize: 12 },
      formatter(params) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`
        params.forEach(p => {
          if (p.value == null) return
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`
          const isQ = p.seriesName === qLegend || p.seriesName === qPredictLegend
          const label = isQ ? `${qLegend}: C${p.value}` : `${trendLegend}: C${Number(p.value).toFixed(1)}`
          html += `<div style="margin:2px 0">${dot}${label}</div>`
        })
        return html
      }
    },
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category', data: months, boundaryGap: false,
      axisLine: { lineStyle: { color: '#e5eaf2' } },
      axisTick: { show: false },
      axisLabel: { color: '#909399', fontSize: 11, rotate: 30, formatter: (val, idx) => idx === months.length - 1 ? `${val} ${t('overview.predict')}` : val }
    },
    yAxis: {
      type: 'value', min: 1, max: 5, interval: 1,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
      axisLabel: { color: '#909399', fontSize: 11, formatter: 'C{value}' }
    },
    series: [
      { name: qLegend, type: 'line', data: td.questionnaire, lineStyle: { color: '#F56C6C', width: 2 }, itemStyle: { color: '#F56C6C' }, symbol: 'circle', symbolSize: 6, smooth: false, connectNulls: false },
      { name: qPredictLegend, type: 'line', data: td.questionnairePredict, lineStyle: { color: '#F56C6C', width: 2, type: 'dashed' }, itemStyle: { color: '#F56C6C' }, symbol: 'diamond', symbolSize: 7, smooth: false, connectNulls: false },
      { name: trendLegend, type: 'line', data: td.dynamic, lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, symbol: 'circle', symbolSize: 6, smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,93,255,0.15)' }, { offset: 1, color: 'rgba(22,93,255,0.01)' }]) },
        markPoint: { data: [{ type: 'max', name: t('overview.highest') }, { type: 'min', name: t('overview.lowest') }], symbolSize: 40, label: { fontSize: 10, formatter: 'C{c}' } }
      },
      { name: trendPredictLegend, type: 'line', data: td.dynamicPredict, lineStyle: { color: '#165DFF', width: 2, type: 'dashed' }, itemStyle: { color: '#165DFF' }, symbol: 'diamond', symbolSize: 7, smooth: true, connectNulls: false },
    ]
  }
}

function refreshTrendChart(td) {
  if (!trendChart) return
  try {
    trendChart.setOption(buildTrendOption(td), { notMerge: true })
    trendChart.resize()
  } catch (e) {
    console.error('refreshTrendChart failed', e)
  }
}

function buildRadarOption(r) {
  const rawIndicators = tm('overview.radarIndicator')
  const indicators = Array.isArray(rawIndicators)
    ? rawIndicators.map(name => ({ name, max: 5 }))
    : ['C1', 'C2', 'C3', 'C4'].map(name => ({ name, max: 5 }))
  return {
    tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5eaf2', borderWidth: 1, textStyle: { color: '#303133', fontSize: 12 } },
    radar: {
      indicator: indicators,
      radius: '65%', nameGap: 8,
      axisName: { color: '#606266', fontSize: 11 },
      splitArea: { areaStyle: { color: ['#fff', '#f5f7fa', '#ebeef5', '#e8edf4', '#e0e7f1'] } },
      splitLine: { lineStyle: { color: '#dcdfe6' } },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: r.current, name: t('overview.radarCurrent'), lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, areaStyle: { color: 'rgba(22,93,255,0.2)' } },
        { value: r.last, name: t('overview.radarLast'), lineStyle: { color: '#C0C4CC', width: 1, type: 'dashed' }, itemStyle: { color: '#C0C4CC' }, areaStyle: { color: 'rgba(192,196,204,0.1)' } }
      ]
    }]
  }
}

function refreshRadarChart(r) {
  if (!radarChart) return
  try {
    radarChart.setOption(buildRadarOption(r), { notMerge: true })
    radarChart.resize()
  } catch (e) {
    console.error('refreshRadarChart failed', e)
  }
}

function handleResize() {
  trendChart?.resize()
  radarChart?.resize()
}

onMounted(() => {
  try {
    if (trendChartRef.value) trendChart = echarts.init(trendChartRef.value)
    if (radarChartRef.value) radarChart = echarts.init(radarChartRef.value)
  } catch (e) {
    console.error('echarts init failed', e)
  }
  window.addEventListener('resize', handleResize)
  fetchAndApply(currentCustomerId.value)
  nextTick(() => {
    trendChart?.resize()
    radarChart?.resize()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  radarChart?.dispose()
})
</script>

<style scoped>
.suitability-overview {
  min-height: calc(100vh - 120px);
}
</style>
