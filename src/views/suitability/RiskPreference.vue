<template>
  <div class="risk-preference-page">
    <CustomerSearchBar
      :initial-customer-id="routeCustomerId"
      :initial-customer-name="routeCustomerName"
      @customer-change="onCustomerChange"
    />

    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
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
          <h3 class="text-sm font-semibold text-gray-700">近12个月风险偏好趋势</h3>
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <span class="w-3 h-0.5 bg-red-500 inline-block rounded"></span>问卷测评结果
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-0.5 bg-primary-500 inline-block rounded"></span>风险偏好得分
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
          <div class="p-2 bg-orange-50 rounded-lg">
            <div class="text-xs text-orange-400 mb-0.5">关键拐点</div>
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

    <!-- Scatter Chart -->
    <div class="bg-white rounded-xl p-3 border border-gray-100 mb-3">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">风险偏好变化与市场波动率/产品购买行为关系</h3>
      <div ref="scatterChartRef" class="w-full" style="height: 240px;"></div>
      <!-- 散点图关联性解读 -->
      <div class="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
        <div class="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs font-semibold whitespace-nowrap mt-0.5">
          散点图关联解读
        </div>
        <div class="text-xs text-gray-600 leading-relaxed" v-html="scatterInterp"></div>
      </div>
    </div>

    <!-- Bottom Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
import { ref, onMounted, onBeforeUnmount, markRaw, computed } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ShoppingCart, TrendCharts, Timer, Ticket } from '@element-plus/icons-vue'
import CustomerSearchBar from '../../components/CustomerSearchBar.vue'

const route = useRoute()
const trendChartRef = ref(null)
const scatterChartRef = ref(null)
let trendChart = null
let scatterChart = null

const routeCustomerId = computed(() => route.query.id || '')
const routeCustomerName = computed(() => route.query.name || '')
const customerId = ref(routeCustomerId.value || 'C00008231')

const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测']

const customerDataMap = {
  'C00008231': {
    kpi: [
      { label: '当前风险偏好', value: 'C3.0', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月风险偏好', value: 'C3.0', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.1', valueClass: 'text-blue-500', sub: '↑ 预计微升', subClass: 'text-blue-400' },
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-primary-600', sub: '2026-03-15 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '0', unit: '级', valueClass: 'text-green-500', sub: '问卷与偏好一致', subClass: 'text-green-400' },
    ],
    trend: { q: [3,3,3,3,3,3,3,3,3,3,3,3,null], d: [3.0,3.1,3.0,3.1,3.0,3.1,3.0,3.0,3.1,3.0,3.0,3.0,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.0,3.1], qP: [null,null,null,null,null,null,null,null,null,null,null,3,3] },
    interp: { trendDesc: '近12个月风险偏好<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.0左右', turningPoint: '无明显拐点，产品购买行为均衡', relationToQ: '问卷评定C3（稳健型），实际偏好C3.0（稳健型），完全一致', suggestion: '无需调整，建议维持当前评级并持续观察' },
    scatter: [[8,3.0,10],[10,3.1,12],[12,3.0,14],[14,3.1,13],[16,3.0,15],[18,3.1,14],[20,3.0,16],[22,3.0,15],[24,3.1,17],[26,3.0,16],[28,3.0,18],[30,3.1,17]],
    scatterInterp: '散点图分布显示，该客户在市场波动率从 8% 上升至 30% 期间，其风险偏好稳定在 <span class="text-blue-600 font-medium">C3.0 左右</span>，购买频次（气泡大小）保持在 10~18 次平稳区间。表明客户对市场波动不敏感，不存在追涨杀跌行为，具备极高理性的稳健投资习惯。',
    metric: [
      { label: '高风险产品购买占比', value: '28.0%', icon: markRaw(ShoppingCart), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 28, range: '0% - 100%' },
      { label: '波动行情加仓倾向', value: '32.5%', icon: markRaw(TrendCharts), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 32.5, range: '0% - 100%' },
      { label: '回撤暴跌囤/持仓行为', value: '35.2%', icon: markRaw(Timer), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 35.2, range: '0% - 100%' },
      { label: '投资期限偏好', value: '42.8%', icon: markRaw(Ticket), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 42.8, range: '0% - 100%' },
    ],
  },
  'C00008232': {
    kpi: [
      { label: '当前风险偏好', value: 'C3.5', valueClass: 'text-blue-500', sub: '较上月下降', subClass: 'text-blue-400' },
      { label: '上月风险偏好', value: 'C3.8', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.3', valueClass: 'text-blue-500', sub: '↓ 预计下降', subClass: 'text-blue-400' },
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-primary-600', sub: '2026-04-20 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-0.5', unit: '级', valueClass: 'text-orange-500', sub: '问卷略高于偏好', subClass: 'text-orange-400' },
    ],
    trend: { q: [4,4,4,4,4,4,4,4,4,4,4,4,null], d: [3.8,3.7,3.6,3.7,3.6,3.5,3.6,3.5,3.5,3.5,3.5,3.5,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.5,3.3], qP: [null,null,null,null,null,null,null,null,null,null,null,4,4] },
    interp: { trendDesc: '近12个月风险偏好呈<span class="text-blue-500 font-medium">小幅下降</span>趋势，从C3.8降至C3.5', turningPoint: '2026-02起逐步下降，高风险产品购买减少', relationToQ: '问卷评定C4（稳健型），实际偏好C3.5（稳健型），偏差-0.5级', suggestion: '偏差较小，建议维持当前评级并持续观察' },
    scatter: [[8,3.8,10],[10,3.7,12],[12,3.6,14],[14,3.7,13],[16,3.6,15],[18,3.5,14],[20,3.6,16],[22,3.5,15],[24,3.5,14],[26,3.5,16],[28,3.5,14],[30,3.5,15]],
    scatterInterp: '散点图呈现<span class="text-orange-500 font-medium">弱负相关性</span>。随着市场波动率从 8% 攀升至 30%，客户的风险偏好从 C3.8 逐步回落至 C3.5，且气泡大小有所收缩。说明行情波动加大时，客户风险偏好有所收敛，偏向避险并小幅减少产品交易频率。',
    metric: [
      { label: '高风险产品购买占比', value: '22.0%', icon: markRaw(ShoppingCart), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 22, range: '0% - 100%' },
      { label: '波动行情加仓倾向', value: '28.3%', icon: markRaw(TrendCharts), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 28.3, range: '0% - 100%' },
      { label: '回撤暴跌囤/持仓行为', value: '30.1%', icon: markRaw(Timer), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 30.1, range: '0% - 100%' },
      { label: '投资期限偏好', value: '38.5%', icon: markRaw(Ticket), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 38.5, range: '0% - 100%' },
    ],
  },
  'C00012857': {
    kpi: [
      { label: '当前风险偏好', value: 'C4.3', valueClass: 'text-green-500', sub: '较上月上升', subClass: 'text-green-400' },
      { label: '上月风险偏好', value: 'C3.8', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C4.4', valueClass: 'text-green-600', sub: '↑ 预计继续上升', subClass: 'text-green-400' },
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-primary-600', sub: '2026-05-15 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-0.7', unit: '级', valueClass: 'text-orange-500', sub: '问卷略高于偏好', subClass: 'text-orange-400' },
    ],
    trend: { q: [5,5,5,5,5,5,5,5,5,5,5,5,null], d: [3.5,3.6,3.5,3.7,3.8,3.9,3.9,4.0,4.1,4.2,4.3,4.3,null], dP: [null,null,null,null,null,null,null,null,null,null,null,4.3,4.4], qP: [null,null,null,null,null,null,null,null,null,null,null,5,5] },
    interp: { trendDesc: '近12个月风险偏好呈<span class="text-green-500 font-medium">上升</span>趋势，从C3.5升至C4.3', turningPoint: '2026-02起快速上升，与高风险产品购买频率增加高度相关', relationToQ: '问卷评定C5（保守型），实际偏好C4.3（进取型），严重不一致', suggestion: '建议重新进行风险偏好问卷评估，确认客户真实偏好' },
    scatter: [[12,3.5,20],[15,3.6,25],[18,3.5,22],[20,3.7,30],[14,3.8,18],[22,3.9,35],[25,3.9,28],[28,4.0,40],[30,4.1,32],[32,4.2,45],[35,4.3,38],[38,4.3,50]],
    scatterInterp: '散点图分布呈现明显的<span class="text-green-600 font-medium">正向扩张特征</span>。当市场波动率从 12% 增加至 38% 时，客户风险偏好由 C3.5 快速上升至 C4.3，且交易次数（气泡尺寸）急剧放大至 50 次。表明该客户属于典型的"越波动越活跃"的进取型投资者。',
    metric: [
      { label: '高风险产品购买占比', value: '68.6%', icon: markRaw(ShoppingCart), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 68.6, range: '0% - 100%' },
      { label: '波动行情加仓倾向', value: '64.2%', icon: markRaw(TrendCharts), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 64.2, range: '0% - 100%' },
      { label: '回撤暴跌囤/持仓行为', value: '71.5%', icon: markRaw(Timer), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 71.5, range: '0% - 100%' },
      { label: '投资期限偏好', value: '76.8%', icon: markRaw(Ticket), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 76.8, range: '0% - 100%' },
    ],
  },
  'C00012858': {
    kpi: [
      { label: '当前风险偏好', value: 'C4.8', valueClass: 'text-green-500', sub: '较上月上升', subClass: 'text-green-400' },
      { label: '上月风险偏好', value: 'C4.5', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C5.0', valueClass: 'text-green-600', sub: '↑ 预计升至上限', subClass: 'text-green-400' },
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-primary-600', sub: '2026-06-10 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '+0.8', unit: '级', valueClass: 'text-red-500', sub: '偏好高于问卷', subClass: 'text-red-400' },
    ],
    trend: { q: [4,4,4,4,4,4,4,4,4,4,4,4,null], d: [3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5,4.6,4.7,4.8,null], dP: [null,null,null,null,null,null,null,null,null,null,null,4.8,5.0], qP: [null,null,null,null,null,null,null,null,null,null,null,4,4] },
    interp: { trendDesc: '近12个月风险偏好呈<span class="text-green-500 font-medium">快速上升</span>趋势，从C3.8升至C4.8', turningPoint: '2026-01起加速上升，衍生品交易频次明显增加', relationToQ: '问卷评定C4（稳健型），实际偏好C4.8（激进型），偏差+0.8级', suggestion: '建议上调问卷风险等级，实际行为已显示激进偏好' },
    scatter: [[10,4.0,15],[12,4.1,18],[14,4.0,20],[16,4.2,22],[18,4.3,25],[20,4.4,28],[22,4.5,30],[24,4.6,32],[26,4.5,35],[28,4.6,38],[30,4.7,40],[32,4.8,42]],
    scatterInterp: '散点分布呈现<span class="text-purple-600 font-medium">高偏好高频次聚集</span>。波动率在 10%~32% 波动过程中，客户风险偏好持续上攀至 C4.8，交易频率密集（气泡多在 30~42 次）。表明其交易行为受外部市场波动干扰小，主要由其自身积极加仓激进产品的投资意向驱动。',
    metric: [
      { label: '高风险产品购买占比', value: '75.3%', icon: markRaw(ShoppingCart), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 75.3, range: '0% - 100%' },
      { label: '波动行情加仓倾向', value: '72.1%', icon: markRaw(TrendCharts), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 72.1, range: '0% - 100%' },
      { label: '回撤暴跌囤/持仓行为', value: '68.4%', icon: markRaw(Timer), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 68.4, range: '0% - 100%' },
      { label: '投资期限偏好', value: '82.0%', icon: markRaw(Ticket), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 82, range: '0% - 100%' },
    ],
  },
  'C00012859': {
    kpi: [
      { label: '当前风险偏好', value: 'C3.5', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月风险偏好', value: 'C3.4', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.5', valueClass: 'text-blue-500', sub: '预计维持稳定', subClass: 'text-gray-400' },
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-primary-600', sub: '2026-07-02 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-1.5', unit: '级', valueClass: 'text-orange-500', sub: '问卷远高于偏好', subClass: 'text-orange-400' },
    ],
    trend: { q: [5,5,5,5,5,5,5,5,5,5,5,5,null], d: [3.4,3.5,3.4,3.5,3.4,3.5,3.5,3.5,3.5,3.5,3.5,3.5,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.5,3.5], qP: [null,null,null,null,null,null,null,null,null,null,null,5,5] },
    interp: { trendDesc: '近12个月风险偏好<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.5左右', turningPoint: '无明显拐点，产品购买行为较为均衡', relationToQ: '问卷评定C5（保守型），实际偏好C3.5（稳健型），偏差-1.5级', suggestion: '建议下调问卷评级至C3，实际偏好并不激进' },
    scatter: [[8,3.5,10],[10,3.4,12],[12,3.5,14],[14,3.6,16],[16,3.5,18],[18,3.4,15],[20,3.5,20],[22,3.6,18],[24,3.5,22],[26,3.4,20],[28,3.5,24],[30,3.6,22]],
    scatterInterp: '散点集中分布于 <span class="text-blue-600 font-medium">C3.4~C3.6 水平横轴</span>，且气泡尺寸均匀（10~24 次）。无论市场波动率在 8% 到 30% 之间如何变化，客户的偏好评分与购买行为均无剧烈波动，表现出强抗干扰能力与明确的自我定力。',
    metric: [
      { label: '高风险产品购买占比', value: '32.0%', icon: markRaw(ShoppingCart), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 32, range: '0% - 100%' },
      { label: '波动行情加仓倾向', value: '28.7%', icon: markRaw(TrendCharts), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 28.7, range: '0% - 100%' },
      { label: '回撤暴跌囤/持仓行为', value: '35.6%', icon: markRaw(Timer), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 35.6, range: '0% - 100%' },
      { label: '投资期限偏好', value: '52.3%', icon: markRaw(Ticket), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 52.3, range: '0% - 100%' },
    ],
  },
  'C00012860': {
    kpi: [
      { label: '当前风险偏好', value: 'C5.0', valueClass: 'text-red-500', sub: '较上月上升', subClass: 'text-red-400' },
      { label: '上月风险偏好', value: 'C4.5', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C5.0', valueClass: 'text-red-600', sub: '已到上限', subClass: 'text-red-400' },
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-primary-600', sub: '2026-08-01 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '+2.0', unit: '级', valueClass: 'text-red-500', sub: '偏好远高于问卷', subClass: 'text-red-400' },
    ],
    trend: { q: [3,3,3,3,3,3,3,3,3,3,3,3,null], d: [4.0,4.2,4.3,4.4,4.5,4.6,4.7,4.8,4.8,4.9,5.0,5.0,null], dP: [null,null,null,null,null,null,null,null,null,null,null,5.0,5.0], qP: [null,null,null,null,null,null,null,null,null,null,null,3,3] },
    interp: { trendDesc: '近12个月风险偏好呈<span class="text-red-500 font-medium">快速上升</span>趋势，从C4.0升至C5.0', turningPoint: '2025-12起加速上升，衍生品和杠杆产品占比大幅增加', relationToQ: '问卷评定C3（稳健型），实际偏好C5.0（激进型），严重不一致', suggestion: '强烈建议重新评估问卷，客户实际偏好已达最高级' },
    scatter: [[15,4.0,20],[18,4.2,25],[20,4.3,28],[22,4.4,32],[24,4.5,35],[26,4.6,38],[28,4.7,42],[30,4.8,45],[32,4.9,48],[34,5.0,50],[36,5.0,52],[38,5.0,55]],
    scatterInterp: '散点图向右上角<span class="text-red-500 font-medium">强烈倾斜与扩张</span>。随着市场波动率提升至 38%，风险偏好封顶至 C5.0，购买频次飙升至 55 次（最大气泡）。反映客户具有极高的风险偏好和极强的抄底/加杠杆交易欲望，需重点防范高波动下的穿仓风险。',
    metric: [
      { label: '高风险产品购买占比', value: '82.4%', icon: markRaw(ShoppingCart), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 82.4, range: '0% - 100%' },
      { label: '波动行情加仓倾向', value: '78.9%', icon: markRaw(TrendCharts), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 78.9, range: '0% - 100%' },
      { label: '回撤暴跌囤/持仓行为', value: '85.1%', icon: markRaw(Timer), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 85.1, range: '0% - 100%' },
      { label: '投资期限偏好', value: '90.2%', icon: markRaw(Ticket), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 90.2, range: '0% - 100%' },
    ],
  },
}

function getData(id) { return customerDataMap[id] || customerDataMap['C00008231'] }

const kpiCards = ref(getData(customerId.value).kpi)
const metricCards = ref(getData(customerId.value).metric)
const interp = ref(getData(customerId.value).interp)
const scatterInterp = ref(getData(customerId.value).scatterInterp || '')

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
      { name: '风险偏好', type: 'line', data: t.d, lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, symbol: 'circle', symbolSize: 6, smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,93,255,0.15)' }, { offset: 1, color: 'rgba(22,93,255,0.01)' }]) },
        markPoint: { data: [{ type: 'max', name: '最高' }, { type: 'min', name: '最低' }], symbolSize: 40, label: { fontSize: 10, formatter: 'C{c}' } }
      },
      { name: '偏好预测', type: 'line', data: t.dP, lineStyle: { color: '#165DFF', width: 2, type: 'dashed' }, itemStyle: { color: '#165DFF' }, symbol: 'diamond', symbolSize: 7, smooth: true, connectNulls: false },
    ]
  }
}

function buildScatterOption(sd) {
  return {
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5eaf2', borderWidth: 1,
      textStyle: { color: '#303133', fontSize: 12 },
      formatter(params) {
        return `<div style="font-weight:600;margin-bottom:4px">数据点</div>
          <div>市场波动率: ${params.data[0]}%</div>
          <div>风险偏好等级: C${params.data[1].toFixed(1)}</div>
          <div>产品购买次数: ${params.data[2]}次</div>`
      }
    },
    grid: { top: 30, right: 20, bottom: 40, left: 60 },
    xAxis: { name: '市场波动率 (%)', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLine: { lineStyle: { color: '#e5eaf2' } }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 11 }, splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } } },
    yAxis: { name: '风险偏好等级', nameTextStyle: { color: '#909399', fontSize: 11 }, min: 1, max: 5, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } }, axisLabel: { color: '#909399', fontSize: 11, formatter: 'C{value}' } },
    series: [{
      type: 'scatter', data: sd,
      symbolSize(val) { return Math.sqrt(val[2]) * 3 },
      itemStyle: { color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [{ offset: 0, color: 'rgba(22,93,255,0.8)' }, { offset: 1, color: 'rgba(22,93,255,0.3)' }]) },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(22,93,255,0.5)' } }
    }]
  }
}

function refreshTrend(t) { if (trendChart) trendChart.setOption(buildTrendOption(t), { notMerge: true }) }
function refreshScatter(sd) { if (scatterChart) scatterChart.setOption(buildScatterOption(sd), { notMerge: true }) }

function onCustomerChange({ id }) {
  customerId.value = id
  const data = getData(id)
  kpiCards.value = data.kpi
  metricCards.value = data.metric
  interp.value = data.interp
  scatterInterp.value = data.scatterInterp || ''
  refreshTrend({ q: data.trend.q, d: data.trend.d, dP: data.trend.dP, qP: data.trend.qP })
  refreshScatter(data.scatter)
}

function handleResize() { trendChart?.resize(); scatterChart?.resize() }

onMounted(() => {
  const data = getData(customerId.value)
  trendChart = echarts.init(trendChartRef.value)
  scatterChart = echarts.init(scatterChartRef.value)
  trendChart.setOption(buildTrendOption({ q: data.trend.q, d: data.trend.d, dP: data.trend.dP, qP: data.trend.qP }))
  scatterChart.setOption(buildScatterOption(data.scatter))
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); scatterChart?.dispose() })
</script>

<style scoped>
.risk-preference-page {
  min-height: calc(100vh - 120px);
}
</style>
