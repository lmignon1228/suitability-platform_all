<template>
  <div class="objective-risk-page">
    <CustomerSearchBar
      :initial-customer-id="routeCustomerId"
      :initial-customer-name="routeCustomerName"
      @customer-change="onCustomerChange"
    />

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
      <div v-for="(kpi, idx) in currentKpiCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="text-xs text-gray-400 mb-1">{{ kpi.label }}</div>
        <div class="flex items-end gap-2">
          <span class="text-xl font-bold" :class="kpi.valueClass">{{ kpi.value }}</span>
          <span v-if="kpi.unit" class="text-xs text-gray-400 mb-0.5">{{ kpi.unit }}</span>
        </div>
        <div v-if="kpi.sub" class="text-xs mt-1" :class="kpi.subClass">{{ kpi.sub }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <div class="lg:col-span-2 bg-white rounded-xl p-3 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-700">客观风险承受力趋势</h3>
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <span class="w-3 h-0.5 bg-red-500 inline-block rounded"></span>问卷测评结果
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-0.5 bg-primary-500 inline-block rounded"></span>动态计算得分
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
            <div class="text-sm text-gray-700" v-html="currentInterpretation.trendDesc"></div>
          </div>
          <div class="p-2 bg-orange-50 rounded-lg">
            <div class="text-xs text-orange-400 mb-0.5">关键拐点</div>
            <div class="text-sm text-gray-700">{{ currentInterpretation.turningPoint }}</div>
          </div>
          <div class="p-2 bg-primary-50 rounded-lg">
            <div class="text-xs text-primary-400 mb-0.5">与问卷等级关系</div>
            <div class="text-sm text-gray-700">{{ currentInterpretation.relationToQ }}</div>
          </div>
          <div class="p-2 bg-green-50 rounded-lg">
            <div class="text-xs text-green-400 mb-0.5">建议</div>
            <div class="text-sm text-gray-700">{{ currentInterpretation.suggestion }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-3 border border-gray-100 mb-3">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">沪深300指数 vs 客观风险得分</h3>
      <div ref="correlationChartRef" class="w-full" style="height: 240px;"></div>
      <!-- 大盘关联性解读 -->
      <div class="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
        <div class="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs font-semibold whitespace-nowrap mt-0.5">
          大盘关联性解读
        </div>
        <div class="text-xs text-gray-600 leading-relaxed" v-html="marketInterp"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div v-for="(metric, idx) in currentMetricCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center" :class="metric.bgClass">
            <el-icon :size="14" :class="metric.iconClass"><component :is="metric.icon" /></el-icon>
          </div>
          <span class="text-xs text-gray-400">{{ metric.label }}</span>
        </div>
        <div class="text-lg font-bold text-gray-800 mb-0.5">{{ metric.value }}</div>
        <div class="w-full bg-gray-100 rounded-full h-1 mt-1.5">
          <div class="h-1 rounded-full transition-all" :class="metric.barClass" :style="{ width: metric.pct + '%' }"></div>
        </div>
        <div class="text-xs text-gray-400 mt-0.5">{{ metric.range }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, markRaw, computed } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { TrendCharts, Money, CreditCard, Histogram, Suitcase, Coin } from '@element-plus/icons-vue'
import CustomerSearchBar from '../../components/CustomerSearchBar.vue'

const route = useRoute()
const trendChartRef = ref(null)
const correlationChartRef = ref(null)
let trendChart = null
let correlationChart = null

const routeCustomerId = computed(() => route.query.id || '')
const routeCustomerName = computed(() => route.query.name || '')
const currentCustomerId = ref(routeCustomerId.value || 'C00008231')

const customerDataMap = {
  'C00012857': {
    kpi: [
      { label: '当前分值', value: 'C2.6', valueClass: 'text-red-500', sub: '较上月下降', subClass: 'text-red-400' },
      { label: '上月分值', value: 'C3.1', valueClass: 'text-gray-700', sub: '2026-04', subClass: 'text-gray-400' },
      { label: '未来1月预测', value: 'C2.4', valueClass: 'text-orange-500', sub: '↓ 预计继续下降', subClass: 'text-orange-400' },
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-primary-600', sub: '2026-05-15 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-2.4', unit: '级', valueClass: 'text-red-500', sub: '问卷远高于客观', subClass: 'text-red-400' },
    ],
    trend: {
      q: [5,5,5,5,5,5,5,5,5,5,5,5,null], d: [3.1,3.0,2.9,3.2,3.3,3.2,2.8,2.7,2.6,2.7,2.6,2.6,null],
      dP: [null,null,null,null,null,null,null,null,null,null,null,2.6,2.4], qP: [null,null,null,null,null,null,null,null,null,null,null,5,5]
    },
    months: ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测'],
    interp: { trendDesc: '近12个月客观风险承受力呈<span class="text-red-500 font-medium">下降</span>趋势，从C3.1降至C2.6', turningPoint: '2026-01起明显下降，与可投资资产大幅缩减高度相关', relationToQ: '问卷评定C5（保守型），客观仅C2.6（积极型），严重不一致', suggestion: '建议重新进行问卷评估并适当降低产品推荐等级' },
    corr: { risk: [3.1,3.0,2.9,3.2,3.3,3.2,2.8,2.7,2.6,2.7,2.6,2.6], hs: [4200,4100,3950,4050,4150,4100,3850,3780,3700,3750,3680,3620] },
    marketInterp: '该客户客观得分对大盘表现出<span class="text-red-500 font-medium">高敏感度与放大效应</span>。由于客户高比例配置高风险权益产品（衍生品及高杠杆持仓），市场回调期间其可投资资产由 520 万骤降至 310 万（降幅40.4%），拖累客观风险得分自 C3.4 快速下滑至 C2.6，系统性风险暴露较为明显。',
    metric: [
      { label: '可投资资产', value: '310万', icon: markRaw(Money), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 31, range: '0 - 1000万' },
      { label: '负债收入比', value: '1.3', icon: markRaw(CreditCard), bgClass: 'bg-red-50', iconClass: 'text-red-500', barClass: 'bg-red-500', pct: 65, range: '0 - 2.0' },
      { label: '资产流动性', value: '42%', icon: markRaw(Histogram), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 42, range: '0% - 100%' },
      { label: '收入稳定性', value: '中等', icon: markRaw(Suitcase), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 55, range: '低 - 高' },
      { label: '投资经验年限', value: '6年', icon: markRaw(Coin), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 60, range: '0 - 10年' },
    ],
  },
  'C00012858': {
    kpi: [
      { label: '当前分值', value: 'C4.5', valueClass: 'text-green-500', sub: '较上月上升', subClass: 'text-green-400' },
      { label: '上月分值', value: 'C4.0', valueClass: 'text-gray-700', sub: '2026-05', subClass: 'text-gray-400' },
      { label: '未来1月预测', value: 'C4.7', valueClass: 'text-green-600', sub: '↑ 预计继续上升', subClass: 'text-green-400' },
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-primary-600', sub: '2026-06-10 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-0.5', unit: '级', valueClass: 'text-orange-500', sub: '问卷略高于客观', subClass: 'text-orange-400' },
    ],
    trend: {
      q: [4,4,4,4,4,4,4,4,4,4,4,4,null], d: [3.5,3.6,3.7,3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5,null],
      dP: [null,null,null,null,null,null,null,null,null,null,null,4.5,4.7], qP: [null,null,null,null,null,null,null,null,null,null,null,4,4]
    },
    months: ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测'],
    interp: { trendDesc: '近12个月客观风险承受力呈<span class="text-green-500 font-medium">上升</span>趋势，从C3.5升至C4.5', turningPoint: '2026-01起稳步上升，与资产规模持续增长高度相关', relationToQ: '问卷评定C4（稳健型），客观C4.5（积极型），基本一致', suggestion: '风险承受力良好，建议维持当前产品推荐等级' },
    corr: { risk: [3.5,3.6,3.7,3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5], hs: [3800,3850,3920,3980,4050,4100,4180,4250,4300,4350,4400,4450] },
    marketInterp: '该客户客观得分与大盘走势呈<span class="text-green-600 font-medium">逆势增长/独立行情</span>。尽管沪深300指数总体处于震荡筑底阶段，但该客户因主营业务现金流持续注入及低位加仓高股息资产，可投资资产不降反升，推动客观风险承受得分由 C4.0 稳步增长至 C4.5。',
    metric: [
      { label: '可投资资产', value: '680万', icon: markRaw(Money), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 68, range: '0 - 1000万' },
      { label: '负债收入比', value: '0.4', icon: markRaw(CreditCard), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 20, range: '0 - 2.0' },
      { label: '资产流动性', value: '55%', icon: markRaw(Histogram), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 55, range: '0% - 100%' },
      { label: '收入稳定性', value: '高', icon: markRaw(Suitcase), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 85, range: '低 - 高' },
      { label: '投资经验年限', value: '8年', icon: markRaw(Coin), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 80, range: '0 - 10年' },
    ],
  },
  'C00012859': {
    kpi: [
      { label: '当前分值', value: 'C3.0', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月分值', value: 'C3.1', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '未来1月预测', value: 'C3.0', valueClass: 'text-blue-500', sub: '预计维持稳定', subClass: 'text-gray-400' },
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-primary-600', sub: '2026-07-02 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-2.0', unit: '级', valueClass: 'text-red-500', sub: '问卷远高于客观', subClass: 'text-red-400' },
    ],
    trend: {
      q: [5,5,5,5,5,5,5,5,5,5,5,5,null], d: [3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2,null],
      dP: [null,null,null,null,null,null,null,null,null,null,null,3.2,3.0], qP: [null,null,null,null,null,null,null,null,null,null,null,5,5]
    },
    months: ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测'],
    interp: { trendDesc: '近12个月客观风险承受力<span class="text-gray-500 font-medium">基本稳定</span>，维持在C3.2左右', turningPoint: '整体平稳，无明显拐点，资产规模保持稳定', relationToQ: '问卷评定C5（保守型），客观仅C3.0（稳健型），偏差-2级', suggestion: '建议下调问卷风险等级至C3，安排专项评估' },
    corr: { risk: [3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2], hs: [3950,3820,3780,3900,4020,3980,3720,3650,3580,3620,3550,3520] },
    marketInterp: '该客户客观得分与大盘走势<span class="text-blue-600 font-medium">高度贴合</span>。其持仓结构以大盘蓝筹指数基金为主，客观得分基本随沪深300指数的起伏在 C3.0~C3.2 区间微幅波动，资产弹性较好，无超额波动风险。',
    metric: [
      { label: '可投资资产', value: '260万', icon: markRaw(Money), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 26, range: '0 - 1000万' },
      { label: '负债收入比', value: '0.9', icon: markRaw(CreditCard), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 45, range: '0 - 2.0' },
      { label: '资产流动性', value: '48%', icon: markRaw(Histogram), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 48, range: '0% - 100%' },
      { label: '收入稳定性', value: '中等', icon: markRaw(Suitcase), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 50, range: '低 - 高' },
      { label: '投资经验年限', value: '3年', icon: markRaw(Coin), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 30, range: '0 - 10年' },
    ],
  },
  'C00012860': {
    kpi: [
      { label: '当前分值', value: 'C4.8', valueClass: 'text-green-500', sub: '较上月上升', subClass: 'text-green-400' },
      { label: '上月分值', value: 'C4.3', valueClass: 'text-gray-700', sub: '2026-07', subClass: 'text-gray-400' },
      { label: '未来1月预测', value: 'C5.0', valueClass: 'text-green-600', sub: '↑ 预计继续上升', subClass: 'text-green-400' },
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-primary-600', sub: '2026-08-01 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '+1.8', unit: '级', valueClass: 'text-red-500', sub: '动态远高于问卷', subClass: 'text-red-400' },
    ],
    trend: {
      q: [3,3,3,3,3,3,3,3,3,3,3,3,null], d: [3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.6,4.7,4.8,4.8,null],
      dP: [null,null,null,null,null,null,null,null,null,null,null,4.8,5.0], qP: [null,null,null,null,null,null,null,null,null,null,null,3,3]
    },
    months: ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测'],
    interp: { trendDesc: '近12个月客观风险承受力呈<span class="text-green-500 font-medium">快速上升</span>趋势，从C3.2升至C4.8', turningPoint: '2025-10起加速上升，与可投资资产大幅增长相关', relationToQ: '问卷评定C3（稳健型），客观C4.8（激进型），严重不一致', suggestion: '建议重新问卷评估，当前客观承受力远超问卷评级' },
    corr: { risk: [3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.6,4.7,4.8,4.8], hs: [3600,3650,3700,3780,3850,3920,4000,4080,4150,4200,4280,4350] },
    marketInterp: '该客户客观得分与大盘走势呈<span class="text-purple-600 font-medium">强顺周期扩张性</span>。大盘微幅反弹期间，客户通过高杠杆交易获得了超额资本增值，可投资资产大幅提升，驱动客观得分由 C3.5 快速上升至 C4.8。需注意大盘一旦回调可能引发的杠杆资产加速穿仓风险。',
    metric: [
      { label: '可投资资产', value: '820万', icon: markRaw(Money), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 82, range: '0 - 1000万' },
      { label: '负债收入比', value: '0.2', icon: markRaw(CreditCard), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 10, range: '0 - 2.0' },
      { label: '资产流动性', value: '35%', icon: markRaw(Histogram), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 35, range: '0% - 100%' },
      { label: '收入稳定性', value: '高', icon: markRaw(Suitcase), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 90, range: '低 - 高' },
      { label: '投资经验年限', value: '9年', icon: markRaw(Coin), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 90, range: '0 - 10年' },
    ],
  },
  'C00008231': {
    kpi: [
      { label: '当前分值', value: 'C3.2', valueClass: 'text-blue-500', sub: '与上月持平', subClass: 'text-gray-400' },
      { label: '上月分值', value: 'C3.1', valueClass: 'text-gray-700', sub: '2026-02', subClass: 'text-gray-400' },
      { label: '未来1月预测', value: 'C3.1', valueClass: 'text-blue-500', sub: '预计维持稳定', subClass: 'text-gray-400' },
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-primary-600', sub: '2026-03-15 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-0.2', unit: '级', valueClass: 'text-green-500', sub: '问卷与客观一致', subClass: 'text-green-400' },
    ],
    trend: {
      q: [3,3,3,3,3,3,3,3,3,3,3,3,null], d: [3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1,null],
      dP: [null,null,null,null,null,null,null,null,null,null,null,3.1,3.1], qP: [null,null,null,null,null,null,null,null,null,null,null,3,3]
    },
    months: ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测'],
    interp: { trendDesc: '近12个月客观风险承受力<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.1左右', turningPoint: '无明显拐点，资产规模稳定', relationToQ: '问卷评定C3（稳健型），客观C3.2（稳健型），基本一致', suggestion: '无需调整，建议维持当前评级并定期回访' },
    corr: { risk: [3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1], hs: [3900,3850,3880,3920,3950,3900,3850,3880,3920,3880,3850,3860] },
    marketInterp: '该客户客观风险得分与沪深300指数走势呈现<span class="text-blue-600 font-medium">低相关性</span>。由于客户资产主要集中于货币基金与低风险固收类理财（流动性资金占50%），受大盘权益市场波动冲击极小，客观风险承受能力始终稳定在 C3.1 左右，具备较强的抗市场系统性风险能力。',
    metric: [
      { label: '可投资资产', value: '350万', icon: markRaw(Money), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 35, range: '0 - 1000万' },
      { label: '负债收入比', value: '0.6', icon: markRaw(CreditCard), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 30, range: '0 - 2.0' },
      { label: '资产流动性', value: '50%', icon: markRaw(Histogram), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 50, range: '0% - 100%' },
      { label: '收入稳定性', value: '中等', icon: markRaw(Suitcase), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 55, range: '低 - 高' },
      { label: '投资经验年限', value: '5年', icon: markRaw(Coin), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 50, range: '0 - 10年' },
    ],
  },
  'C00008232': {
    kpi: [
      { label: '当前分值', value: 'C3.0', valueClass: 'text-red-500', sub: '较上月下降', subClass: 'text-red-400' },
      { label: '上月分值', value: 'C3.3', valueClass: 'text-gray-700', sub: '2026-03', subClass: 'text-gray-400' },
      { label: '未来1月预测', value: 'C2.9', valueClass: 'text-orange-500', sub: '↓ 预计小幅下降', subClass: 'text-orange-400' },
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-primary-600', sub: '2026-04-20 测评', subClass: 'text-gray-400' },
      { label: '偏差值', value: '-1.0', unit: '级', valueClass: 'text-orange-500', sub: '问卷略高于客观', subClass: 'text-orange-400' },
    ],
    trend: {
      q: [4,4,4,4,4,4,4,4,4,4,4,4,null], d: [3.5,3.4,3.3,3.4,3.3,3.2,3.3,3.2,3.1,3.2,3.1,3.0,null],
      dP: [null,null,null,null,null,null,null,null,null,null,null,3.0,2.9], qP: [null,null,null,null,null,null,null,null,null,null,null,4,4]
    },
    months: ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测'],
    interp: { trendDesc: '近12个月客观风险承受力呈<span class="text-red-500 font-medium">小幅下降</span>趋势，从C3.5降至C3.0', turningPoint: '2026-01起逐步下降，与可投资资产缩减相关', relationToQ: '问卷评定C4（稳健型），客观C3.0（稳健型），偏差-1级', suggestion: '建议关注资产变动原因，暂不需强制重新测评' },
    corr: { risk: [3.5,3.4,3.3,3.4,3.3,3.2,3.3,3.2,3.1,3.2,3.1,3.0], hs: [4000,3950,3880,3920,3850,3800,3750,3720,3680,3700,3650,3600] },
    marketInterp: '该客户客观得分与大盘存在<span class="text-orange-500 font-medium">中度正相关性</span>。随着近期大盘指数从 4,100 点回落至 3,900 点，客户持有的权益类资产市值缩水近 60 万，导致客观风险承受得分从 C3.3 微降至 C3.0。市场波动是导致其客观得分下调的主要外部因素。',
    metric: [
      { label: '可投资资产', value: '220万', icon: markRaw(Money), bgClass: 'bg-blue-50', iconClass: 'text-blue-500', barClass: 'bg-blue-500', pct: 22, range: '0 - 1000万' },
      { label: '负债收入比', value: '0.8', icon: markRaw(CreditCard), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 40, range: '0 - 2.0' },
      { label: '资产流动性', value: '45%', icon: markRaw(Histogram), bgClass: 'bg-green-50', iconClass: 'text-green-500', barClass: 'bg-green-500', pct: 45, range: '0% - 100%' },
      { label: '收入稳定性', value: '中等', icon: markRaw(Suitcase), bgClass: 'bg-orange-50', iconClass: 'text-orange-500', barClass: 'bg-orange-500', pct: 50, range: '低 - 高' },
      { label: '投资经验年限', value: '4年', icon: markRaw(Coin), bgClass: 'bg-purple-50', iconClass: 'text-purple-500', barClass: 'bg-purple-500', pct: 40, range: '0 - 10年' },
    ],
  },
}

const defaultKey = 'C00008231'
function getData(id) { return customerDataMap[id] || customerDataMap[defaultKey] }

const init = getData(currentCustomerId.value)
const currentKpiCards = ref(init.kpi)
const currentMetricCards = ref(init.metric)
const currentInterpretation = ref(init.interp)
const marketInterp = ref(init.marketInterp || '')

function buildTrendOption(m, t) {
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
    xAxis: { type: 'category', data: m, boundaryGap: false, axisLine: { lineStyle: { color: '#e5eaf2' } }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 11, rotate: 30 } },
    yAxis: { type: 'value', min: 1, max: 5, interval: 1, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } }, axisLabel: { color: '#909399', fontSize: 11, formatter: 'C{value}' } },
    series: [
      { name: '问卷测评', type: 'line', data: t.q, lineStyle: { color: '#F56C6C', width: 2 }, itemStyle: { color: '#F56C6C' }, symbol: 'circle', symbolSize: 6, smooth: false, connectNulls: false },
      { name: '问卷预测', type: 'line', data: t.qP, lineStyle: { color: '#F56C6C', width: 2, type: 'dashed' }, itemStyle: { color: '#F56C6C' }, symbol: 'diamond', symbolSize: 7, smooth: false, connectNulls: false },
      { name: '动态计算', type: 'line', data: t.d, lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, symbol: 'circle', symbolSize: 6, smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,93,255,0.15)' }, { offset: 1, color: 'rgba(22,93,255,0.01)' }]) },
        markPoint: { data: [{ type: 'max', name: '最高' }, { type: 'min', name: '最低' }], symbolSize: 40, label: { fontSize: 10, formatter: 'C{c}' } }
      },
      { name: '动态预测', type: 'line', data: t.dP, lineStyle: { color: '#165DFF', width: 2, type: 'dashed' }, itemStyle: { color: '#165DFF' }, symbol: 'diamond', symbolSize: 7, smooth: true, connectNulls: false },
    ]
  }
}

function buildCorrOption(c) {
  const m = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06']
  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5eaf2', borderWidth: 1, textStyle: { color: '#303133', fontSize: 12 } },
    legend: { data: ['客观风险得分', '沪深300指数'], top: 0, textStyle: { color: '#909399', fontSize: 11 } },
    grid: { top: 35, right: 60, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: m, axisLine: { lineStyle: { color: '#e5eaf2' } }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 11 } },
    yAxis: [
      { type: 'value', min: 1, max: 5, interval: 1, name: '风险等级', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } }, axisLabel: { color: '#909399', fontSize: 11, formatter: 'C{value}' } },
      { type: 'value', min: 3400, max: 4500, name: '沪深300', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: '#909399', fontSize: 11 } }
    ],
    series: [
      { name: '客观风险得分', type: 'line', data: c.risk, lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, symbol: 'circle', symbolSize: 6, smooth: true },
      { name: '沪深300指数', type: 'line', yAxisIndex: 1, data: c.hs, lineStyle: { color: '#E6A23C', width: 2 }, itemStyle: { color: '#E6A23C' }, symbol: 'circle', symbolSize: 6, smooth: true },
    ]
  }
}

function refreshTrend(m, t) { if (trendChart) trendChart.setOption(buildTrendOption(m, t), { notMerge: true }) }
function refreshCorr(c) { if (correlationChart) correlationChart.setOption(buildCorrOption(c), { notMerge: true }) }

function onCustomerChange({ id }) {
  currentCustomerId.value = id
  const data = getData(id)
  currentKpiCards.value = data.kpi
  currentMetricCards.value = data.metric
  currentInterpretation.value = data.interp
  marketInterp.value = data.marketInterp || ''
  refreshTrend(data.months, data.trend)
  refreshCorr(data.corr)
}

function handleResize() { trendChart?.resize(); correlationChart?.resize() }

onMounted(() => {
  const data = getData(currentCustomerId.value)
  trendChart = echarts.init(trendChartRef.value)
  correlationChart = echarts.init(correlationChartRef.value)
  trendChart.setOption(buildTrendOption(data.months, data.trend))
  correlationChart.setOption(buildCorrOption(data.corr))
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); correlationChart?.dispose() })
</script>

<style scoped>
.objective-risk-page { min-height: calc(100vh - 120px); }
</style>
