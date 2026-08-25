<template>
  <div class="risk-cognition-page">
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
      <!-- 新增：双轴图图表解读 -->
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
import { ref, onMounted, onBeforeUnmount, markRaw, computed } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ShoppingBag, Coin, Reading, Document, EditPen } from '@element-plus/icons-vue'
import CustomerSearchBar from '../../components/CustomerSearchBar.vue'

const route = useRoute()
const trendChartRef = ref(null)
const dualAxisChartRef = ref(null)
let trendChart = null
let dualAxisChart = null

const routeCustomerId = computed(() => route.query.id || '')
const routeCustomerName = computed(() => route.query.name || '')
const customerId = ref(routeCustomerId.value || 'C00008231')

const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测']

const customerDataMap = {
  'C00008231': {
    kpi: [
      { label: '当前风险认知', value: 'C3.5', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月风险认知', value: 'C3.4', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.5', valueClass: 'text-blue-500', sub: '预计维持稳定', subClass: 'text-gray-400' },
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-primary-600', sub: '2026-03-15 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-0.5', unit: '级', valueClass: 'text-green-500', sub: '问卷与认知接近', subClass: 'text-green-400' },
    ],
    trend: { q: [3,3,3,3,3,3,3,3,3,3,3,3,null], d: [3.4,3.5,3.4,3.5,3.5,3.4,3.5,3.5,3.4,3.5,3.5,3.5,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.5,3.5], qP: [null,null,null,null,null,null,null,null,null,null,null,3,3] },
    interp: { trendDesc: '近12个月风险认知<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.5左右', turningPoint: '无明显拐点，投资知识测试得分稳定', relationToQ: '问卷评定C3（稳健型），认知得分C3.5（稳健型），基本一致', suggestion: '无需调整，建议定期参加投教活动保持认知水平' },
    dualAxis: { knowledge: [68,70,72,70,74,72,70,72,74,72,73,74], behavior: [8,10,12,10,14,12,14,16,12,14,14,16] },
    dualAxisInterp: '客户的<span class="text-blue-600 font-medium">投资知识得分</span>稳定在 70-74 分区间，<span class="text-amber-600 font-medium">产品行为频次</span>保持在 10-16 次/月的温和水平。知识储备与实际投资行为高度匹配，未出现"盲目交易"或"知行不一"现象。',
    metric: [
      { label: '历史交易产品类型', value: '52%', icon: markRaw(ShoppingBag), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 52, range: '0% - 100%' },
      { label: '对应金额加权', value: '48%', icon: markRaw(Coin), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 48, range: '0% - 100%' },
      { label: '知识测评', value: '74分', icon: markRaw(Reading), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 74, range: '0 - 100分' },
      { label: '内容阅读深度', value: '65%', icon: markRaw(Document), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 65, range: '0% - 100%' },
      { label: '复杂产品理解度', value: '68分', icon: markRaw(EditPen), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 68, range: '0 - 100分' },
    ],
  },
  'C00008232': {
    kpi: [
      { label: '当前风险认知', value: 'C3.2', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月风险认知', value: 'C3.3', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.2', valueClass: 'text-blue-500', sub: '预计维持稳定', subClass: 'text-gray-400' },
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-primary-600', sub: '2026-04-20 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-0.8', unit: '级', valueClass: 'text-orange-500', sub: '问卷略高于认知', subClass: 'text-orange-400' },
    ],
    trend: { q: [4,4,4,4,4,4,4,4,4,4,4,4,null], d: [3.3,3.2,3.3,3.2,3.2,3.3,3.2,3.2,3.2,3.2,3.2,3.2,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.2,3.2], qP: [null,null,null,null,null,null,null,null,null,null,null,4,4] },
    interp: { trendDesc: '近12个月风险认知<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.2左右', turningPoint: '无明显拐点，投资知识测试得分中等', relationToQ: '问卷评定C4（稳健型），认知得分C3.2（稳健型），偏差-0.8级', suggestion: '偏差较小，建议维持当前评级并鼓励参加投教活动' },
    dualAxis: { knowledge: [62,64,63,66,68,67,65,68,70,68,72,70], behavior: [6,8,7,10,12,11,10,12,14,12,14,12] },
    dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>由 62 分缓慢提升至 70 分，同时<span class="text-amber-600 font-medium">产品行为频次</span>从 6 次稳步增至 12 次/月。知识积累有效驱动了产品交易活跃度的提升，行为拓展节奏平稳。',
    metric: [
      { label: '历史交易产品类型', value: '45%', icon: markRaw(ShoppingBag), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 45, range: '0% - 100%' },
      { label: '对应金额加权', value: '42%', icon: markRaw(Coin), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 42, range: '0% - 100%' },
      { label: '知识测评', value: '70分', icon: markRaw(Reading), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 70, range: '0 - 100分' },
      { label: '内容阅读深度', value: '55%', icon: markRaw(Document), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 55, range: '0% - 100%' },
      { label: '复杂产品理解度', value: '60分', icon: markRaw(EditPen), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 60, range: '0 - 100分' },
    ],
  },
  'C00012857': {
    kpi: [
      { label: '当前风险认知', value: 'C3.2', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月风险认知', value: 'C3.2', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.3', valueClass: 'text-blue-500', sub: '预计微升', subClass: 'text-blue-400' },
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-primary-600', sub: '2026-05-15 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-1.8', unit: '级', valueClass: 'text-orange-500', sub: '问卷高于认知', subClass: 'text-orange-400' },
    ],
    trend: { q: [5,5,5,5,5,5,5,5,5,5,5,5,null], d: [3.0,3.1,3.0,3.1,3.2,3.2,3.1,3.2,3.4,3.3,3.2,3.2,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.2,3.3], qP: [null,null,null,null,null,null,null,null,null,null,null,5,5] },
    interp: { trendDesc: '近12个月风险认知保持<span class="text-blue-500 font-medium">稳定</span>，维持在C3.2左右', turningPoint: '2026-03小幅提升至C3.4，因客户参加了投资知识培训课程', relationToQ: '问卷评定C5（保守型），认知得分C3.2（稳健型），偏差-1.8级', suggestion: '认知水平稳定，建议加强高风险产品知识教育以提升风险认知' },
    dualAxis: { knowledge: [65,68,66,70,72,70,68,71,78,75,72,72], behavior: [8,10,9,12,14,13,15,16,12,14,15,16] },
    dualAxisInterp: '客户在 2026-03 参加培训后<span class="text-blue-600 font-medium">知识得分</span>跃升至 78 分，但随后<span class="text-amber-600 font-medium">产品行为频次</span>出现小幅波动后回落至 16 次/月，表明知识转化为实际高频交易的意愿整体趋于理性。',
    metric: [
      { label: '历史交易产品类型', value: '78%', icon: markRaw(ShoppingBag), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 78, range: '0% - 100%' },
      { label: '对应金额加权', value: '63%', icon: markRaw(Coin), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 63, range: '0% - 100%' },
      { label: '知识测评', value: '72分', icon: markRaw(Reading), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 72, range: '0 - 100分' },
      { label: '内容阅读深度', value: '48%', icon: markRaw(Document), bgClass: 'bg-yellow-50', iconClass: 'text-yellow-500', barClass: 'bg-yellow-500', pct: 48, range: '0% - 100%' },
      { label: '复杂产品理解度', value: '65分', icon: markRaw(EditPen), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 65, range: '0 - 100分' },
    ],
  },
  'C00012858': {
    kpi: [
      { label: '当前风险认知', value: 'C4.0', valueClass: 'text-blue-600', sub: '较上月提升', subClass: 'text-blue-400' },
      { label: '上月风险认知', value: 'C3.8', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C4.1', valueClass: 'text-blue-600', sub: '↑ 预计小幅提升', subClass: 'text-blue-400' },
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-primary-600', sub: '2026-06-10 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '0', unit: '级', valueClass: 'text-green-500', sub: '问卷与认知一致', subClass: 'text-green-400' },
    ],
    trend: { q: [4,4,4,4,4,4,4,4,4,4,4,4,null], d: [3.5,3.6,3.7,3.7,3.8,3.8,3.9,3.9,4.0,4.0,4.0,4.0,null], dP: [null,null,null,null,null,null,null,null,null,null,null,4.0,4.1], qP: [null,null,null,null,null,null,null,null,null,null,null,4,4] },
    interp: { trendDesc: '近12个月风险认知呈<span class="text-blue-500 font-medium">小幅上升</span>趋势，从C3.5升至C4.0', turningPoint: '2026-02起逐步提升，与主动学习投资知识相关', relationToQ: '问卷评定C4（稳健型），认知得分C4.0（稳健型），完全一致', suggestion: '认知水平良好，建议维持当前学习节奏' },
    dualAxis: { knowledge: [70,72,74,75,78,76,80,82,85,83,86,88], behavior: [10,12,14,15,18,16,20,22,18,20,22,24] },
    dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>从 70 分一路攀升至 88 分的高位，带动<span class="text-amber-600 font-medium">产品行为频次</span>从 10 次/月显著增加至 24 次/月。表现出强烈的学习意愿与极高的交易转化率，知行同步提升。',
    metric: [
      { label: '历史交易产品类型', value: '65%', icon: markRaw(ShoppingBag), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 65, range: '0% - 100%' },
      { label: '对应金额加权', value: '58%', icon: markRaw(Coin), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 58, range: '0% - 100%' },
      { label: '知识测评', value: '88分', icon: markRaw(Reading), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 88, range: '0 - 100分' },
      { label: '内容阅读深度', value: '82%', icon: markRaw(Document), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 82, range: '0% - 100%' },
      { label: '复杂产品理解度', value: '85分', icon: markRaw(EditPen), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 85, range: '0 - 100分' },
    ],
  },
  'C00012859': {
    kpi: [
      { label: '当前风险认知', value: 'C3.8', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月风险认知', value: 'C3.7', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C3.8', valueClass: 'text-blue-500', sub: '预计维持稳定', subClass: 'text-gray-400' },
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-primary-600', sub: '2026-07-02 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-1.2', unit: '级', valueClass: 'text-orange-500', sub: '问卷高于认知', subClass: 'text-orange-400' },
    ],
    trend: { q: [5,5,5,5,5,5,5,5,5,5,5,5,null], d: [3.5,3.6,3.6,3.7,3.7,3.7,3.8,3.8,3.8,3.8,3.8,3.8,null], dP: [null,null,null,null,null,null,null,null,null,null,null,3.8,3.8], qP: [null,null,null,null,null,null,null,null,null,null,null,5,5] },
    interp: { trendDesc: '近12个月风险认知<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.7左右', turningPoint: '无明显拐点，投资知识测试得分中等偏上', relationToQ: '问卷评定C5（保守型），认知得分C3.8（稳健型），偏差-1.2级', suggestion: '认知水平中等，建议安排专项投资知识培训' },
    dualAxis: { knowledge: [60,62,64,66,68,70,68,72,74,72,75,76], behavior: [6,8,7,10,12,11,14,15,12,14,15,14] },
    dualAxisInterp: '客户<span class="text-blue-600 font-medium">投资知识得分</span>稳步升至 76 分，但<span class="text-amber-600 font-medium">产品行为频次</span>长期维持在 12-15 次/月的较低水平。呈现"重知识积累、轻频繁操作"的稳健审慎型特征。',
    metric: [
      { label: '历史交易产品类型', value: '55%', icon: markRaw(ShoppingBag), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 55, range: '0% - 100%' },
      { label: '对应金额加权', value: '50%', icon: markRaw(Coin), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 50, range: '0% - 100%' },
      { label: '知识测评', value: '76分', icon: markRaw(Reading), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 76, range: '0 - 100分' },
      { label: '内容阅读深度', value: '58%', icon: markRaw(Document), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 58, range: '0% - 100%' },
      { label: '复杂产品理解度', value: '62分', icon: markRaw(EditPen), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 62, range: '0 - 100分' },
    ],
  },
  'C00012860': {
    kpi: [
      { label: '当前风险认知', value: 'C4.2', valueClass: 'text-blue-600', sub: '较上月提升', subClass: 'text-blue-400' },
      { label: '上月风险认知', value: 'C4.0', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1个月预测', value: 'C4.3', valueClass: 'text-blue-600', sub: '↑ 预计小幅提升', subClass: 'text-blue-400' },
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-primary-600', sub: '2026-08-01 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '+1.2', unit: '级', valueClass: 'text-red-500', sub: '认知高于问卷', subClass: 'text-red-400' },
    ],
    trend: { q: [3,3,3,3,3,3,3,3,3,3,3,3,null], d: [3.5,3.6,3.7,3.8,3.9,4.0,4.0,4.1,4.2,4.2,4.2,4.2,null], dP: [null,null,null,null,null,null,null,null,null,null,null,4.2,4.3], qP: [null,null,null,null,null,null,null,null,null,null,null,3,3] },
    interp: { trendDesc: '近12个月风险认知呈<span class="text-blue-500 font-medium">上升</span>趋势，从C3.5升至C4.2', turningPoint: '2026-01起持续提升，客户主动参与多次投教活动', relationToQ: '问卷评定C3（稳健型），认知得分C4.2（稳健型偏上），偏差+1.2级', suggestion: '认知水平较高，建议重新评估问卷以匹配实际认知' },
    dualAxis: { knowledge: [72,74,76,78,80,82,84,86,88,90,92,94], behavior: [12,14,16,18,20,22,24,26,22,24,26,28] },
    dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>突破 90 分达到 94 分，<span class="text-amber-600 font-medium">产品行为频次</span>也随之飙升至 28 次/月。知识储备的爆发式增长显著激发了复杂产品的交易行为，建议关注其高频交易的风控限制。',
    metric: [
      { label: '历史交易产品类型', value: '78%', icon: markRaw(ShoppingBag), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 78, range: '0% - 100%' },
      { label: '对应金额加权', value: '63%', icon: markRaw(Coin), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 63, range: '0% - 100%' },
      { label: '知识测评', value: '94分', icon: markRaw(Reading), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 94, range: '0 - 100分' },
      { label: '内容阅读深度', value: '88%', icon: markRaw(Document), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 88, range: '0% - 100%' },
      { label: '复杂产品理解度', value: '91分', icon: markRaw(EditPen), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 91, range: '0 - 100分' },
    ],
  },
}

function getData(id) { return customerDataMap[id] || customerDataMap['C00008231'] }

const kpiCards = ref(getData(customerId.value).kpi)
const metricCards = ref(getData(customerId.value).metric)
const interp = ref(getData(customerId.value).interp)
const dualAxisInterp = ref(getData(customerId.value).dualAxisInterp || '')

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
  const data = getData(id)
  kpiCards.value = data.kpi
  metricCards.value = data.metric
  interp.value = data.interp
  dualAxisInterp.value = data.dualAxisInterp || ''
  refreshTrend({ q: data.trend.q, d: data.trend.d, dP: data.trend.dP, qP: data.trend.qP })
  refreshDualAxis(data.dualAxis)
}

function handleResize() { trendChart?.resize(); dualAxisChart?.resize() }

onMounted(() => {
  const data = getData(customerId.value)
  trendChart = echarts.init(trendChartRef.value)
  dualAxisChart = echarts.init(dualAxisChartRef.value)
  trendChart.setOption(buildTrendOption({ q: data.trend.q, d: data.trend.d, dP: data.trend.dP, qP: data.trend.qP }))
  dualAxisChart.setOption(buildDualAxisOption(data.dualAxis))
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); dualAxisChart?.dispose() })
</script>

<style scoped>
.risk-cognition-page {
  min-height: calc(100vh - 120px);
}
</style>
