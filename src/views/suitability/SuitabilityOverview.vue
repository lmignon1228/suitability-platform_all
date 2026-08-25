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
        <div class="text-xs text-gray-400 mb-1">{{ kpi.label }}</div>
        <div class="flex items-end gap-2">
          <span class="text-xl font-bold" :class="kpi.valueClass">{{ kpi.value }}</span>
          <span v-if="kpi.unit" class="text-xs text-gray-400 mb-0.5">{{ kpi.unit }}</span>
        </div>
        <div v-if="kpi.sub" class="text-xs mt-1" :class="kpi.subClass">{{ kpi.sub }}</div>
      </div>
    </div>

    <!-- Sub-module Entry Cards (moved up) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <div v-for="(card, idx) in currentModuleCards" :key="idx"
        class="bg-white rounded-xl p-3 border border-gray-100 cursor-pointer hover:shadow-lg transition-all group"
        :class="{ 'cursor-default': card.disabled }"
        @click="!card.disabled && $router.push(card.route)">
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="card.iconBg">
            <el-icon :size="18" :class="card.iconColor"><component :is="card.icon" /></el-icon>
          </div>
          <el-tag :type="card.tagType" size="small" effect="light" round>{{ card.tag }}</el-tag>
        </div>
        <div class="text-sm font-medium text-gray-700 mb-0.5">{{ card.title }}</div>
        <div class="flex items-baseline gap-2 mb-1">
          <span class="text-lg font-bold" :class="card.valueClass">{{ card.value }}</span>
          <span class="text-xs" :class="card.trendClass">{{ card.trend }}</span>
        </div>
        <div class="text-xs text-gray-400">{{ card.desc }}</div>
        <div v-if="!card.disabled" class="text-xs text-primary-500 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          查看详情 →
        </div>
      </div>
    </div>

    <!-- Charts Row (moved down) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <div class="lg:col-span-2 bg-white rounded-xl p-3 border border-gray-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-700">近1年综合风险变化趋势</h3>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <span class="w-3 h-0.5 bg-red-500 inline-block rounded"></span>问卷测评结果
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-0.5 bg-primary-500 inline-block rounded"></span>综合风险变化
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-0.5 bg-red-400 inline-block rounded" style="border-top:1.5px dashed #F56C6C;height:0"></span>预测
              </span>
            </div>
          </div>
          <div ref="trendChartRef" class="w-full" style="height: 260px;"></div>
        </div>
        <!-- 趋势图解读 -->
        <div class="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2.5">
          <div class="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-semibold whitespace-nowrap mt-0.5">
            趋势解读
          </div>
          <div class="text-xs text-gray-600 leading-relaxed" v-html="currentTrendInterp"></div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-3 border border-gray-100 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">综合风险能力雷达图</h3>
          <div ref="radarChartRef" class="w-full" style="height: 240px;"></div>
        </div>
        <!-- 雷达图解读 -->
        <div class="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <div class="text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span>四维风险能力评估</span>
            <span class="text-gray-400 font-normal">较上月对比</span>
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
          <span class="text-sm font-semibold text-red-700">主要下降原因</span>
        </div>
        <div class="p-3">
          <div v-for="(reason, idx) in currentDeclineReasons" :key="idx" class="flex items-start gap-2 mb-2 last:mb-0">
            <span class="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{{ idx + 1 }}</span>
            <div>
              <div class="text-sm text-gray-700">{{ reason.title }}</div>
              <div class="text-xs text-gray-400 mt-0.5 whitespace-pre-line">{{ reason.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-primary-100 overflow-hidden">
        <div class="px-4 py-2 bg-primary-50 border-b border-primary-100 flex items-center gap-2">
          <el-icon class="text-primary-500"><InfoFilled /></el-icon>
          <span class="text-sm font-semibold text-primary-700">合规 / 业务建议</span>
        </div>
        <div class="p-3">
          <div v-for="(sug, idx) in currentSuggestions" :key="idx" class="flex items-start gap-2 mb-2 last:mb-0">
            <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{{ idx + 1 }}</span>
            <div>
              <div class="text-sm text-gray-700">{{ sug.title }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ sug.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, markRaw, computed } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { TrendCharts, Operation, Reading, Monitor, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import CustomerSearchBar from '../../components/CustomerSearchBar.vue'

const route = useRoute()
const trendChartRef = ref(null)
const radarChartRef = ref(null)
let trendChart = null
let radarChart = null

const routeCustomerId = computed(() => route.query.id || '')
const routeCustomerName = computed(() => route.query.name || '')
const currentCustomerId = ref(routeCustomerId.value || 'C00008231')

// ── Per-customer mock data ──
const customerDataMap = {
  'C00012857': {
    kpi: [
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-red-500', sub: '2026-05-18 测评', subClass: 'text-gray-400' },
      { label: '当前动态综合风险等级', value: 'C3', valueClass: 'text-primary-600', sub: '实时计算', subClass: 'text-primary-400' },
      { label: '上月动态综合风险等级', value: 'C4', valueClass: 'text-gray-700', sub: '2026-04', subClass: 'text-gray-400' },
      { label: '等级偏差', value: '-2', unit: '级', valueClass: 'text-orange-500', sub: '问卷高于动态', subClass: 'text-orange-400' },
      { label: '本月变化', value: '↓1', unit: '级', valueClass: 'text-green-500', sub: '较上月下降', subClass: 'text-green-400' },
    ],
    trend: {
      questionnaire: [5,5,5,5,5,5,5,5,5,5,5,5,null],
      dynamic: [3.8,3.6,3.5,3.9,4.1,4.0,3.7,3.5,3.3,3.4,3.2,3.0,3.1],
      dynamicPredict: [null,null,null,null,null,null,null,null,null,null,null,3.0,3.1],
      questionnairePredict: [null,null,null,null,null,null,null,null,null,null,null,5,5],
    },
    radar: { current: [2.6,4.3,3.2,2.8], last: [3.1,3.8,3.2,3.0] },
    modules: [
      { title: '客观风险承受力', value: 'C2.6', trend: '↓ 下降', icon: markRaw(TrendCharts), tag: '下降', tagType: 'danger', route: '/suitability/objective', iconBg: 'bg-red-50', iconColor: 'text-red-500', valueClass: 'text-red-500', trendClass: 'text-red-400 text-xs', desc: '资产规模缩减，风险承受能力下降', disabled: false },
      { title: '风险偏好', value: 'C4.3', trend: '↑ 上升', icon: markRaw(Operation), tag: '上升', tagType: 'success', route: '/suitability/preference', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '高风险产品购买占比增加', disabled: false },
      { title: '风险认知', value: 'C3.2', trend: '— 稳定', icon: markRaw(Reading), tag: '稳定', tagType: 'info', route: '/suitability/cognition', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '投资知识测试得分稳定', disabled: false },
      { title: '异常行为监测', value: '高关注', trend: '4 条待处理', icon: markRaw(Monitor), tag: '预警', tagType: 'warning', route: '', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', valueClass: 'text-orange-500', trendClass: 'text-orange-400 text-xs', desc: '近期存在异常交易模式', disabled: true },
    ],
    reasons: [
      { title: '客观风险承受力大幅下降，综合等级被拖累', detail: '• 具体行为：近3个月可投资资产从520万降至310万（降幅40.4%），负债收入比从0.8升至1.3。\n• 行为解释：资产规模显著缩水且流动性趋紧，导致客观风险承受力评分从C3.5下调至C2.6，综合等级被拉低2级。' },
      { title: '频繁高风险衍生品交易触发监控预警', detail: '• 具体行为：近30天内交易衍生品12次，触发高频高风险交易阈值。\n• 行为解释：高风险偏好交易加剧风险暴露，引发系统监控预警，进一步压低动态评级。' },
      { title: '问卷评级与实际交易偏好严重背离', detail: '• 具体行为：问卷评定为C5（进取型），但实际客观资产与负债指标已显著恶化。\n• 行为解释：触发"行为/资产与问卷不符"规则，动态综合等级向下修正2级至C3。' },
    ],
    trendInterp: '客户问卷评级保持在 <span class="text-red-500 font-semibold">C5 (进取型)</span>，但动态综合风险等级在近1年内从 C3.8 持续下行至 <span class="text-primary-600 font-semibold">C3.0</span>，出现 <span class="text-orange-500 font-semibold">-2级倒挂</span>。主要是由于近期资产大幅缩减与高风险杠杆操作引发风控预警，建议人工介入复核。',
    radarInterp: '当前客观承受力(<span class="text-red-500 font-medium">C2.6</span>)相比上月进一步下滑；虽然风险偏好(<span class="text-green-600 font-medium">C4.3</span>)依然高企，但受客观能力与异常交易行为拖累，综合评估出现较大幅度下调。',
    suggestions: [
      { title: '建议重新进行问卷评估', detail: '距离上次问卷已超过6个月，建议安排重新测评' },
      { title: '建议适当降低产品推荐等级', detail: '当前持有产品风险等级与动态风险承受力不匹配' },
      { title: '建议进行投资者教育回访', detail: '认知得分与实际行为存在偏差，建议安排专项回访' },
      { title: '触发合规审查流程', detail: '问卷等级与动态等级偏差达2级，需合规部门确认' },
    ],
  },
  'C00012858': {
    kpi: [
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-yellow-500', sub: '2026-06-10 测评', subClass: 'text-gray-400' },
      { label: '当前动态综合风险等级', value: 'C5', valueClass: 'text-primary-600', sub: '实时计算', subClass: 'text-primary-400' },
      { label: '上月动态综合风险等级', value: 'C4', valueClass: 'text-gray-700', sub: '2026-05', subClass: 'text-gray-400' },
      { label: '等级偏差', value: '+1', unit: '级', valueClass: 'text-orange-500', sub: '动态高于问卷', subClass: 'text-orange-400' },
      { label: '本月变化', value: '↑1', unit: '级', valueClass: 'text-red-500', sub: '较上月上升', subClass: 'text-red-400' },
    ],
    trend: {
      questionnaire: [4,4,4,4,4,4,4,4,4,4,4,4,null],
      dynamic: [3.2,3.4,3.5,3.6,3.8,4.0,4.1,4.3,4.5,4.6,4.8,4.9,5.0],
      dynamicPredict: [null,null,null,null,null,null,null,null,null,null,null,4.9,5.0],
      questionnairePredict: [null,null,null,null,null,null,null,null,null,null,null,4,4],
    },
    radar: { current: [4.5,4.8,4.0,3.5], last: [4.0,4.2,3.8,3.2] },
    modules: [
      { title: '客观风险承受力', value: 'C4.5', trend: '↑ 上升', icon: markRaw(TrendCharts), tag: '上升', tagType: 'success', route: '/suitability/objective', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '资产规模持续增长，风险承受力提升', disabled: false },
      { title: '风险偏好', value: 'C4.8', trend: '↑ 上升', icon: markRaw(Operation), tag: '上升', tagType: 'success', route: '/suitability/preference', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '高风险产品购买占比持续增加', disabled: false },
      { title: '风险认知', value: 'C4.0', trend: '— 稳定', icon: markRaw(Reading), tag: '稳定', tagType: 'info', route: '/suitability/cognition', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '投资知识测试得分中等偏上', disabled: false },
      { title: '异常行为监测', value: '一般关注', trend: '1 条待处理', icon: markRaw(Monitor), tag: '关注', tagType: 'warning', route: '', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', valueClass: 'text-orange-500', trendClass: 'text-orange-400 text-xs', desc: '交易行为基本正常', disabled: true },
    ],
    reasons: [
      { title: '实际风险偏好持续高于问卷评级，动态等级上移', detail: '• 具体行为：客户频繁进行高风险交易，近60天内连续购买R4及以上高风险产品7次。\n• 行为解释：主观风险偏好得分飙升至C4.8，驱动动态等级上升至C5（高于问卷1级）。' },
    ],
    trendInterp: '客户问卷评估为 <span class="text-yellow-600 font-semibold">C4</span>，但其动态综合风险等级呈现连续抬升趋势，已由 C3.2 上升至 <span class="text-primary-600 font-semibold">C5.0</span>，表现出高出问卷 <span class="text-orange-500 font-semibold">+1级</span> 的交易热度与风险偏好。',
    radarInterp: '客观承受力(<span class="text-green-600 font-medium">C4.5</span>)与风险偏好(<span class="text-green-600 font-medium">C4.8</span>)较上月均有明显扩张，各项维度均达到高风险承受水平，建议同步上调问卷评级。',
    suggestions: [
      { title: '建议上调问卷风险等级', detail: '实际行为显示客户风险偏好已提升，建议重新测评' },
      { title: '建议关注持仓集中度', detail: '单一高风险产品持仓占比达45%，需提示风险' },
    ],
  },
  'C00012859': {
    kpi: [
      { label: '最近问卷等级', value: 'C5', valueClass: 'text-red-500', sub: '2026-07-02 测评', subClass: 'text-gray-400' },
      { label: '当前动态综合风险等级', value: 'C3', valueClass: 'text-primary-600', sub: '实时计算', subClass: 'text-primary-400' },
      { label: '上月动态综合风险等级', value: 'C3', valueClass: 'text-gray-700', sub: '2026-06', subClass: 'text-gray-400' },
      { label: '等级偏差', value: '-2', unit: '级', valueClass: 'text-orange-500', sub: '问卷高于动态', subClass: 'text-orange-400' },
      { label: '本月变化', value: '→0', unit: '级', valueClass: 'text-gray-500', sub: '与上月持平', subClass: 'text-gray-400' },
    ],
    trend: {
      questionnaire: [5,5,5,5,5,5,5,5,5,5,5,5,null],
      dynamic: [3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2,3.2],
      dynamicPredict: [null,null,null,null,null,null,null,null,null,null,null,3.2,3.2],
      questionnairePredict: [null,null,null,null,null,null,null,null,null,null,null,5,5],
    },
    radar: { current: [3.0,3.5,3.8,2.5], last: [3.1,3.4,3.7,2.6] },
    modules: [
      { title: '客观风险承受力', value: 'C3.0', trend: '— 稳定', icon: markRaw(TrendCharts), tag: '稳定', tagType: 'info', route: '/suitability/objective', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '资产规模稳定，风险承受力中等', disabled: false },
      { title: '风险偏好', value: 'C3.5', trend: '— 稳定', icon: markRaw(Operation), tag: '稳定', tagType: 'info', route: '/suitability/preference', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '产品购买行为较为均衡', disabled: false },
      { title: '风险认知', value: 'C3.8', trend: '— 稳定', icon: markRaw(Reading), tag: '稳定', tagType: 'info', route: '/suitability/cognition', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '投资知识测试得分中等', disabled: false },
      { title: '异常行为监测', value: '低关注', trend: '0 条待处理', icon: markRaw(Monitor), tag: '正常', tagType: 'success', route: '', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '交易行为正常无异常', disabled: true },
    ],
    reasons: [
      { title: '客观资产与经验不支持C5最高评级', detail: '• 具体行为：客户客观资产规模仅能支撑中等风险水平，仅有3年实际投资经验。\n• 行为解释：客观承受力得分仅为C3.0，与问卷C5存在明显偏差，拉低综合动态等级。' },
    ],
    trendInterp: '客户问卷填报为最高的 <span class="text-red-500 font-semibold">C5</span> 级，但近12个月动态综合风险等级长期横盘在 <span class="text-primary-600 font-semibold">C3.2 左右</span>，偏差达 <span class="text-orange-500 font-semibold">-2级</span>。主要因其客观资产规模与投资年限无法支撑 C5 的激进评级。',
    radarInterp: '各项能力维度非常平稳，风险认知(<span class="text-blue-600 font-medium">C3.8</span>)良好，但客观承受力(<span class="text-blue-600 font-medium">C3.0</span>)偏低，呈典型"认知高于实际承受力"的特征。',
    suggestions: [
      { title: '建议下调问卷风险等级至C3', detail: '客观资产与投资经验均不支持C5评级' },
      { title: '建议安排风险承受力专项评估', detail: '问卷与客观指标偏差达2级，需专项复核' },
    ],
  },
  'C00012860': {
    kpi: [
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-blue-500', sub: '2026-08-01 测评', subClass: 'text-gray-400' },
      { label: '当前动态综合风险等级', value: 'C5', valueClass: 'text-primary-600', sub: '实时计算', subClass: 'text-primary-400' },
      { label: '上月动态综合风险等级', value: 'C4', valueClass: 'text-gray-700', sub: '2026-07', subClass: 'text-gray-400' },
      { label: '等级偏差', value: '+2', unit: '级', valueClass: 'text-orange-500', sub: '动态高于问卷', subClass: 'text-orange-400' },
      { label: '本月变化', value: '↑1', unit: '级', valueClass: 'text-red-500', sub: '较上月上升', subClass: 'text-red-400' },
    ],
    trend: {
      questionnaire: [3,3,3,3,3,3,3,3,3,3,3,3,null],
      dynamic: [3.0,3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.7,4.8,4.9,5.0],
      dynamicPredict: [null,null,null,null,null,null,null,null,null,null,null,4.9,5.0],
      questionnairePredict: [null,null,null,null,null,null,null,null,null,null,null,3,3],
    },
    radar: { current: [4.8,5.0,4.2,3.8], last: [4.3,4.5,4.0,3.5] },
    modules: [
      { title: '客观风险承受力', value: 'C4.8', trend: '↑ 上升', icon: markRaw(TrendCharts), tag: '上升', tagType: 'success', route: '/suitability/objective', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '可投资资产大幅增长', disabled: false },
      { title: '风险偏好', value: 'C5.0', trend: '↑ 上升', icon: markRaw(Operation), tag: '上升', tagType: 'success', route: '/suitability/preference', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '激进型投资行为明显', disabled: false },
      { title: '风险认知', value: 'C4.2', trend: '↑ 上升', icon: markRaw(Reading), tag: '上升', tagType: 'success', route: '/suitability/cognition', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '投资知识测试得分提升', disabled: false },
      { title: '异常行为监测', value: '高关注', trend: '3 条待处理', icon: markRaw(Monitor), tag: '预警', tagType: 'warning', route: '', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', valueClass: 'text-orange-500', trendClass: 'text-orange-400 text-xs', desc: '高杠杆操作频次较高', disabled: true },
    ],
    reasons: [
      { title: '实际风险偏好激进，远超问卷评估，动态等级偏离2级', detail: '• 具体行为：问卷填写为C3稳健型，但实际交易频次与风险偏好指标已全面达到C5激进水平。\n• 行为解释：主观偏好与实际行为激增，导致动态等级向上偏离问卷2级。' },
      { title: '衍生品及高杠杆持仓高度集中，风险敞口过大', detail: '• 具体行为：衍生品及杠杆ETF持仓占比已高达52%，近30天交易频次高达38次。\n• 行为解释：高杠杆持仓大幅抬升整体风险敞口，高频交易触发异常行为高关注预警。' },
    ],
    trendInterp: '客户静态问卷为 <span class="text-blue-600 font-semibold">C3</span>，但近一年动态风险等级直线上升至 <span class="text-primary-600 font-semibold">C5.0</span>，呈现极强的正向偏离（<span class="text-orange-500 font-semibold">+2级</span>）。反映其近期发生了剧烈的激进投资行为转型。',
    radarInterp: '风险偏好飙升至极限值 <span class="text-green-600 font-medium">C5.0</span>，客观承受力(<span class="text-green-600 font-medium">C4.8</span>)大幅强于上月，但伴随高杠杆衍生品操作，导致异常行为控制维度风险敞口快速放大。',
    suggestions: [
      { title: '强烈建议重新问卷评估', detail: '偏差达2级，当前问卷已无法反映真实风险偏好' },
      { title: '建议限制杠杆产品买入', detail: '高杠杆产品占比过高，需进行适当性适当性提示' },
      { title: '触发合规审查', detail: '问卷与动态偏差达2级，需合规部门专项审查' },
    ],
  },
  'C00008231': {
    kpi: [
      { label: '最近问卷等级', value: 'C3', valueClass: 'text-blue-500', sub: '2026-03-15 测评', subClass: 'text-gray-400' },
      { label: '当前动态综合风险等级', value: 'C3', valueClass: 'text-primary-600', sub: '实时计算', subClass: 'text-primary-400' },
      { label: '上月动态综合风险等级', value: 'C3', valueClass: 'text-gray-700', sub: '2026-02', subClass: 'text-gray-400' },
      { label: '等级偏差', value: '0', unit: '级', valueClass: 'text-green-500', sub: '问卷与动态一致', subClass: 'text-green-400' },
      { label: '本月变化', value: '→0', unit: '级', valueClass: 'text-gray-500', sub: '与上月持平', subClass: 'text-gray-400' },
    ],
    trend: {
      questionnaire: [3,3,3,3,3,3,3,3,3,3,3,3,null],
      dynamic: [3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1,3.1],
      dynamicPredict: [null,null,null,null,null,null,null,null,null,null,null,3.1,3.1],
      questionnairePredict: [null,null,null,null,null,null,null,null,null,null,null,3,3],
    },
    radar: { current: [3.2,3.0,3.5,3.1], last: [3.1,3.0,3.4,3.0] },
    modules: [
      { title: '客观风险承受力', value: 'C3.2', trend: '— 稳定', icon: markRaw(TrendCharts), tag: '稳定', tagType: 'info', route: '/suitability/objective', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '资产规模稳定，风险承受力中等', disabled: false },
      { title: '风险偏好', value: 'C3.0', trend: '— 稳定', icon: markRaw(Operation), tag: '稳定', tagType: 'info', route: '/suitability/preference', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '产品购买行为均衡', disabled: false },
      { title: '风险认知', value: 'C3.5', trend: '— 稳定', icon: markRaw(Reading), tag: '稳定', tagType: 'info', route: '/suitability/cognition', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '投资知识测试得分中等偏上', disabled: false },
      { title: '异常行为监测', value: '低关注', trend: '0 条待处理', icon: markRaw(Monitor), tag: '正常', tagType: 'success', route: '', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '交易行为正常', disabled: true },
    ],
    reasons: [
      { title: '指标运行平稳，暂无风险下调原因', detail: '• 具体行为：近12个月资产规模、持仓结构及交易行为均与问卷测评保持高度一致。\n• 行为解释：动态综合等级（C3）与问卷等级（C3）完全匹配，未触发任何风控下调规则。' },
    ],
    trendInterp: '问卷测评结果（<span class="text-blue-600 font-semibold">C3</span>）与近12个月动态综合风险走势（<span class="text-primary-600 font-semibold">C3.1</span>）高度重合，偏差为 <span class="text-green-600 font-semibold">0级</span>，表现出极高的画像匹配度与行为稳定性。',
    radarInterp: '四维能力分布均衡且与上月基本持平，客观承受力(<span class="text-blue-600 font-medium">C3.2</span>)、风险偏好(<span class="text-blue-600 font-medium">C3.0</span>)均在中等稳健区间，无异常风险暴露。',
    suggestions: [
      { title: '建议维持当前风险评级', detail: '问卷与动态一致，无需调整' },
      { title: '建议定期回访跟进', detail: '建议每季度进行一次适当性回访' },
    ],
  },
  'C00008232': {
    kpi: [
      { label: '最近问卷等级', value: 'C4', valueClass: 'text-yellow-500', sub: '2026-04-20 测评', subClass: 'text-gray-400' },
      { label: '当前动态综合风险等级', value: 'C3', valueClass: 'text-primary-600', sub: '实时计算', subClass: 'text-primary-400' },
      { label: '上月动态综合风险等级', value: 'C4', valueClass: 'text-gray-700', sub: '2026-03', subClass: 'text-gray-400' },
      { label: '等级偏差', value: '-1', unit: '级', valueClass: 'text-orange-500', sub: '问卷略高于动态', subClass: 'text-orange-400' },
      { label: '本月变化', value: '↓1', unit: '级', valueClass: 'text-green-500', sub: '较上月下降', subClass: 'text-green-400' },
    ],
    trend: {
      questionnaire: [4,4,4,4,4,4,4,4,4,4,4,4,null],
      dynamic: [4.0,3.9,3.8,3.7,3.8,3.7,3.6,3.5,3.4,3.5,3.4,3.3,3.3],
      dynamicPredict: [null,null,null,null,null,null,null,null,null,null,null,3.3,3.3],
      questionnairePredict: [null,null,null,null,null,null,null,null,null,null,null,4,4],
    },
    radar: { current: [3.0,3.5,3.2,2.8], last: [3.3,3.8,3.3,3.0] },
    modules: [
      { title: '客观风险承受力', value: 'C3.0', trend: '↓ 下降', icon: markRaw(TrendCharts), tag: '下降', tagType: 'danger', route: '/suitability/objective', iconBg: 'bg-red-50', iconColor: 'text-red-500', valueClass: 'text-red-500', trendClass: 'text-red-400 text-xs', desc: '可投资资产小幅缩减', disabled: false },
      { title: '风险偏好', value: 'C3.5', trend: '↓ 下降', icon: markRaw(Operation), tag: '下降', tagType: 'danger', route: '/suitability/preference', iconBg: 'bg-red-50', iconColor: 'text-red-500', valueClass: 'text-red-500', trendClass: 'text-red-400 text-xs', desc: '高风险产品购买减少', disabled: false },
      { title: '风险认知', value: 'C3.2', trend: '— 稳定', icon: markRaw(Reading), tag: '稳定', tagType: 'info', route: '/suitability/cognition', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', valueClass: 'text-blue-500', trendClass: 'text-blue-400 text-xs', desc: '投资知识测试得分稳定', disabled: false },
      { title: '异常行为监测', value: '低关注', trend: '0 条待处理', icon: markRaw(Monitor), tag: '正常', tagType: 'success', route: '', iconBg: 'bg-green-50', iconColor: 'text-green-500', valueClass: 'text-green-500', trendClass: 'text-green-400 text-xs', desc: '交易行为正常', disabled: true },
    ],
    reasons: [
      { title: '可投资资产小幅缩减，客观承受力微调下降', detail: '• 具体行为：近2个月可投资资产从280万降至220万，资本缓冲空间有所收窄。\n• 行为解释：客观风险承受力由C3.3微调至C3.0，驱动动态等级下调1级。' },
      { title: '高风险产品主动减仓，综合等级回归C3', detail: '• 具体行为：高风险持仓比例从35%自主降至22%，交易偏好有所收敛。\n• 行为解释：客户实际风险偏好主动降低，综合动态等级从C4调整为C3。' },
    ],
    trendInterp: '客户问卷等级为 <span class="text-yellow-600 font-semibold">C4</span>，近12个月动态风险等级由 C4.0 缓步下行至 <span class="text-primary-600 font-semibold">C3.3</span>，存在 <span class="text-orange-500 font-semibold">-1级</span> 的微幅回落，整体属于受资产波动影响的正常调整。',
    radarInterp: '客观承受力(<span class="text-red-500 font-medium">C3.0</span>)和风险偏好(<span class="text-red-500 font-medium">C3.5</span>)较上月均有轻微收缩，反映客户在资产变动后自主采取了相对保守的避险策略。',
    suggestions: [
      { title: '建议关注资产变动原因', detail: '资产下降原因需进一步了解' },
      { title: '建议维持当前问卷评级', detail: '偏差仅1级，暂不需强制重新测评' },
    ],
  },
}

const defaultKey = 'C00008231'

function getData(key) {
  return customerDataMap[key] || customerDataMap[defaultKey]
}

const currentKpiCards = ref(getData(currentCustomerId.value).kpi)
const currentModuleCards = ref(getData(currentCustomerId.value).modules)
const currentDeclineReasons = ref(getData(currentCustomerId.value).reasons)
const currentSuggestions = ref(getData(currentCustomerId.value).suggestions)
const currentTrendInterp = ref(getData(currentCustomerId.value).trendInterp || '')
const currentRadarInterp = ref(getData(currentCustomerId.value).radarInterp || '')

// ── Customer change handler ──
function onCustomerChange({ id }) {
  currentCustomerId.value = id
  const data = getData(id)
  currentKpiCards.value = data.kpi
  currentModuleCards.value = data.modules
  currentDeclineReasons.value = data.reasons
  currentSuggestions.value = data.suggestions
  currentTrendInterp.value = data.trendInterp || ''
  currentRadarInterp.value = data.radarInterp || ''
  refreshTrendChart(data.trend)
  refreshRadarChart(data.radar)
}

// ── Trend Chart ──
const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测']

function buildTrendOption(t) {
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
          const label = p.seriesName.includes('问卷') ? `问卷等级: C${p.value}` : `综合风险: C${Number(p.value).toFixed(1)}`
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
      axisLabel: { color: '#909399', fontSize: 11, rotate: 30 }
    },
    yAxis: {
      type: 'value', min: 1, max: 5, interval: 1,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
      axisLabel: { color: '#909399', fontSize: 11, formatter: 'C{value}' }
    },
    series: [
      { name: '问卷测评结果', type: 'line', data: t.questionnaire, lineStyle: { color: '#F56C6C', width: 2 }, itemStyle: { color: '#F56C6C' }, symbol: 'circle', symbolSize: 6, smooth: false, connectNulls: false },
      { name: '问卷预测', type: 'line', data: t.questionnairePredict, lineStyle: { color: '#F56C6C', width: 2, type: 'dashed' }, itemStyle: { color: '#F56C6C' }, symbol: 'diamond', symbolSize: 7, smooth: false, connectNulls: false },
      { name: '综合风险变化', type: 'line', data: t.dynamic, lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, symbol: 'circle', symbolSize: 6, smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,93,255,0.15)' }, { offset: 1, color: 'rgba(22,93,255,0.01)' }]) },
        markPoint: { data: [{ type: 'max', name: '最高' }, { type: 'min', name: '最低' }], symbolSize: 40, label: { fontSize: 10, formatter: 'C{c}' } }
      },
      { name: '综合风险预测', type: 'line', data: t.dynamicPredict, lineStyle: { color: '#165DFF', width: 2, type: 'dashed' }, itemStyle: { color: '#165DFF' }, symbol: 'diamond', symbolSize: 7, smooth: true, connectNulls: false },
    ]
  }
}

function refreshTrendChart(t) {
  if (!trendChart) return
  trendChart.setOption(buildTrendOption(t), { notMerge: true })
}

// ── Radar Chart ──
function buildRadarOption(r) {
  return {
    tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5eaf2', borderWidth: 1, textStyle: { color: '#303133', fontSize: 12 } },
    radar: {
      indicator: [{ name: '客观风险承受力', max: 5 }, { name: '风险偏好', max: 5 }, { name: '风险认知', max: 5 }, { name: '异常行为调节', max: 5 }],
      radius: '65%', nameGap: 8,
      axisName: { color: '#606266', fontSize: 11 },
      splitArea: { areaStyle: { color: ['#fff', '#f5f7fa', '#ebeef5', '#e8edf4', '#e0e7f1'] } },
      splitLine: { lineStyle: { color: '#dcdfe6' } },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: r.current, name: '当前风险能力', lineStyle: { color: '#165DFF', width: 2 }, itemStyle: { color: '#165DFF' }, areaStyle: { color: 'rgba(22,93,255,0.2)' } },
        { value: r.last, name: '上月风险能力', lineStyle: { color: '#C0C4CC', width: 1, type: 'dashed' }, itemStyle: { color: '#C0C4CC' }, areaStyle: { color: 'rgba(192,196,204,0.1)' } }
      ]
    }]
  }
}

function refreshRadarChart(r) {
  if (!radarChart) return
  radarChart.setOption(buildRadarOption(r), { notMerge: true })
}

function handleResize() {
  trendChart?.resize()
  radarChart?.resize()
}

onMounted(() => {
  const data = getData(currentCustomerId.value)
  trendChart = echarts.init(trendChartRef.value)
  radarChart = echarts.init(radarChartRef.value)
  trendChart.setOption(buildTrendOption(data.trend))
  radarChart.setOption(buildRadarOption(data.radar))
  window.addEventListener('resize', handleResize)
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
