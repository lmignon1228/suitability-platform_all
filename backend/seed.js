/*  seed.js — 轻量级数据初始化脚本
 *  用法:  node seed.js
 *  前提:  1) PostgreSQL 已启动，数据库 suitability_db 已创建
 *         2) 已执行 sql/schema.sql 建表
 *         3) 已 npm install
 */
const pool = require('./src/db')
const fs = require('fs')
const path = require('path')

/* ================================================================
 * 1. 客户基础信息（对应 customers 表 + 异常用户监控列表）
 * ================================================================ */
const CUSTOMERS = [
  { id:'C00012857', name:'张景豪', ql:5, pl:3, assess:'2026-05-18', diff:-2 },
  { id:'C00012858', name:'王建国', ql:4, pl:5, assess:'2026-06-10', diff: 1 },
  { id:'C00012859', name:'赵思远', ql:5, pl:3, assess:'2026-07-02', diff:-2 },
  { id:'C00012860', name:'陈晓明', ql:3, pl:5, assess:'2026-08-01', diff: 2 },
  { id:'C00008231', name:'张三',   ql:3, pl:3, assess:'2026-03-15', diff: 0 },
  { id:'C00008232', name:'李四',   ql:4, pl:3, assess:'2026-04-20', diff:-1 },
]

const MONTHS = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
                '2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测']
const MONTHS_12 = MONTHS.slice(0, 12)

/* ================================================================
 * 2. 辅助函数 — 生成趋势数组
 * ================================================================ */

/** 生成问卷等级数组（常量 + 末尾 null 预测位） */
function qArr(val) { return Array(12).fill(val).concat([null]) }

/** 生成问卷预测数组 */
function qPArr(val) { return Array(11).fill(null).concat([val, val]) }

/** 生成动态数组（12 实际 + 1 预测） */
function dArr(base, deltaPerMonth, endVal) {
  const arr = []
  for (let i = 0; i < 12; i++) arr.push(+(base + deltaPerMonth * i).toFixed(1))
  arr.push(endVal !== undefined ? endVal : arr[11])
  return arr
}

/** 生成动态预测数组 */
function dPArr(nullCount, ...vals) {
  return Array(nullCount).fill(null).concat(vals)
}

/** 生成常量动态数组 */
function dConst(val) { return Array(12).fill(val).concat([val]) }

/** 生成趋势数据（overview 和各子模块通用格式） */
function makeTrend(qVals, dVals, qPVals, dPVals) {
  return { questionnaire: qVals, dynamic: dVals, dynamicPredict: dPVals, questionnairePredict: qPVals }
}

/** 子模块趋势格式（q/d/qP/dP） */
function makeSubTrend(q, d, qP, dP) {
  return { q, d, dP, qP }
}

/* ================================================================
 * 3. 各客户完整数据生成器
 *    每个函数返回 { overview, objective, preference, cognition }
 * ================================================================ */

function buildC00012857() {
  // 张景豪：问卷C5，动态C3，下降型
  const dynTrend = [3.8,3.6,3.5,3.9,4.1,4.0,3.7,3.5,3.3,3.4,3.2,3.0,3.1]
  const objDyn   = [3.1,3.0,2.9,3.2,3.3,3.2,2.8,2.7,2.6,2.7,2.6,2.6,null]
  const prefDyn  = [3.5,3.6,3.5,3.7,3.8,3.9,3.9,4.0,4.1,4.2,4.3,4.3,null]
  const cogDyn   = [3.0,3.1,3.0,3.1,3.2,3.2,3.1,3.2,3.4,3.3,3.2,3.2,null]

  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C5', valueClass:'text-red-500', sub:'2026-05-18 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C3', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C4', valueClass:'text-gray-700', sub:'2026-04', subClass:'text-gray-400' },
        { label:'等级偏差', value:'-2', unit:'级', valueClass:'text-orange-500', sub:'问卷高于动态', subClass:'text-orange-400' },
        { label:'本月变化', value:'↓1', unit:'级', valueClass:'text-green-500', sub:'较上月下降', subClass:'text-green-400' },
      ],
      trend: makeTrend(qArr(5), dynTrend, qPArr(5), dPArr(11, 3.0, 3.1)),
      radar: { current:[2.6,4.3,3.2,2.8], last:[3.1,3.8,3.2,3.0] },
      modules: [
        { title:'客观风险承受力', value:'C2.6', trend:'↓ 下降', iconName:'TrendCharts', tag:'下降', tagType:'danger', route:'/suitability/objective', iconBg:'bg-red-50', iconColor:'text-red-500', valueClass:'text-red-500', trendClass:'text-red-400 text-xs', desc:'资产规模缩减，风险承受能力下降', disabled:false },
        { title:'风险偏好', value:'C4.3', trend:'↑ 上升', iconName:'Operation', tag:'上升', tagType:'success', route:'/suitability/preference', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'高风险产品购买占比增加', disabled:false },
        { title:'风险认知', value:'C3.2', trend:'— 稳定', iconName:'Reading', tag:'稳定', tagType:'info', route:'/suitability/cognition', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'投资知识测试得分稳定', disabled:false },
        { title:'异常行为监测', value:'高关注', trend:'4 条待处理', iconName:'Monitor', tag:'预警', tagType:'warning', route:'', iconBg:'bg-orange-50', iconColor:'text-orange-500', valueClass:'text-orange-500', trendClass:'text-orange-400 text-xs', desc:'近期存在异常交易模式', disabled:true },
      ],
      reasons: [
        { title:'客观风险承受力大幅下降，综合等级被拖累', detail:'• 具体行为：近3个月可投资资产从520万降至310万（降幅40.4%），负债收入比从0.8升至1.3。\n• 行为解释：资产规模显著缩水且流动性趋紧，导致客观风险承受力评分从C3.5下调至C2.6，综合等级被拉低2级。' },
        { title:'频繁高风险衍生品交易触发监控预警', detail:'• 具体行为：近30天内交易衍生品12次，触发高频高风险交易阈值。\n• 行为解释：高风险偏好交易加剧风险暴露，引发系统监控预警，进一步压低动态评级。' },
        { title:'问卷评级与实际交易偏好严重背离', detail:'• 具体行为：问卷评定为C5（进取型），但实际客观资产与负债指标已显著恶化。\n• 行为解释：触发"行为/资产与问卷不符"规则，动态综合等级向下修正2级至C3。' },
      ],
      trendInterp: '客户问卷评级保持在 <span class="text-red-500 font-semibold">C5 (进取型)</span>，但动态综合风险等级在近1年内从 C3.8 持续下行至 <span class="text-primary-600 font-semibold">C3.0</span>，出现 <span class="text-orange-500 font-semibold">-2级倒挂</span>。主要是由于近期资产大幅缩减与高风险杠杆操作引发风控预警，建议人工介入复核。',
      radarInterp: '当前客观承受力(<span class="text-red-500 font-medium">C2.6</span>)相比上月进一步下滑；虽然风险偏好(<span class="text-green-600 font-medium">C4.3</span>)依然高企，但受客观能力与异常交易行为拖累，综合评估出现较大幅度下调。',
      suggestions: [
        { title:'建议重新进行问卷评估', detail:'距离上次问卷已超过6个月，建议安排重新测评' },
        { title:'建议适当降低产品推荐等级', detail:'当前持有产品风险等级与动态风险承受力不匹配' },
        { title:'建议进行投资者教育回访', detail:'认知得分与实际行为存在偏差，建议安排专项回访' },
        { title:'触发合规审查流程', detail:'问卷等级与动态等级偏差达2级，需合规部门确认' },
      ],
    },
    objective: {
      kpi: [
        { label:'当前分值', value:'C2.6', valueClass:'text-red-500', sub:'较上月下降', subClass:'text-red-400' },
        { label:'上月分值', value:'C3.1', valueClass:'text-gray-700', sub:'2026-04', subClass:'text-gray-400' },
        { label:'未来1月预测', value:'C2.4', valueClass:'text-orange-500', sub:'↓ 预计继续下降', subClass:'text-orange-400' },
        { label:'最近问卷等级', value:'C5', valueClass:'text-primary-600', sub:'2026-05-15 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-2.4', unit:'级', valueClass:'text-red-500', sub:'问卷远高于客观', subClass:'text-red-400' },
      ],
      trend: makeSubTrend(qArr(5), objDyn, qPArr(5), dPArr(11, 2.6, 2.4)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力呈<span class="text-red-500 font-medium">下降</span>趋势，从C3.1降至C2.6', turningPoint:'2026-01起明显下降，与可投资资产大幅缩减高度相关', relationToQ:'问卷评定C5（保守型），客观仅C2.6（积极型），严重不一致', suggestion:'建议重新进行问卷评估并适当降低产品推荐等级' },
      corr: { risk:[3.1,3.0,2.9,3.2,3.3,3.2,2.8,2.7,2.6,2.7,2.6,2.6], hs:[4200,4100,3950,4050,4150,4100,3850,3780,3700,3750,3680,3620] },
      marketInterp: '该客户客观得分对大盘表现出<span class="text-red-500 font-medium">高敏感度与放大效应</span>。由于客户高比例配置高风险权益产品（衍生品及高杠杆持仓），市场回调期间其可投资资产由 520 万骤降至 310 万（降幅40.4%），拖累客观风险得分自 C3.4 快速下滑至 C2.6，系统性风险暴露较为明显。',
      metric: [
        { label:'可投资资产', value:'310万', iconName:'Money', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:31, range:'0 - 1000万' },
        { label:'负债收入比', value:'1.3', iconName:'CreditCard', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:65, range:'0 - 2.0' },
        { label:'资产流动性', value:'42%', iconName:'Histogram', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:42, range:'0% - 100%' },
        { label:'收入稳定性', value:'中等', iconName:'Suitcase', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:55, range:'低 - 高' },
        { label:'投资经验年限', value:'6年', iconName:'Coin', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:60, range:'0 - 10年' },
      ],
    },
    preference: {
      kpi: [
        { label:'当前风险偏好', value:'C4.3', valueClass:'text-green-500', sub:'较上月上升', subClass:'text-green-400' },
        { label:'上月风险偏好', value:'C3.8', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C4.4', valueClass:'text-green-600', sub:'↑ 预计继续上升', subClass:'text-green-400' },
        { label:'最近问卷等级', value:'C5', valueClass:'text-primary-600', sub:'2026-05-15 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-0.7', unit:'级', valueClass:'text-orange-500', sub:'问卷略高于偏好', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(5), prefDyn, qPArr(5), dPArr(11, 4.3, 4.4)),
      interp: { trendDesc:'近12个月风险偏好呈<span class="text-green-500 font-medium">上升</span>趋势，从C3.5升至C4.3', turningPoint:'2026-02起快速上升，与高风险产品购买频率增加高度相关', relationToQ:'问卷评定C5（保守型），实际偏好C4.3（进取型），严重不一致', suggestion:'建议重新进行风险偏好问卷评估，确认客户真实偏好' },
      scatter: [[12,3.5,20],[15,3.6,25],[18,3.5,22],[20,3.7,30],[14,3.8,18],[22,3.9,35],[25,3.9,28],[28,4.0,40],[30,4.1,32],[32,4.2,45],[35,4.3,38],[38,4.3,50]],
      scatterInterp: '散点图分布呈现明显的<span class="text-green-600 font-medium">正向扩张特征</span>。当市场波动率从 12% 增加至 38% 时，客户风险偏好由 C3.5 快速上升至 C4.3，且交易次数（气泡尺寸）急剧放大至 50 次。表明该客户属于典型的"越波动越活跃"的进取型投资者。',
      metric: [
        { label:'高风险产品购买占比', value:'68.6%', iconName:'ShoppingCart', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:68.6, range:'0% - 100%' },
        { label:'波动行情加仓倾向', value:'64.2%', iconName:'TrendCharts', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:64.2, range:'0% - 100%' },
        { label:'回撤暴跌囤/持仓行为', value:'71.5%', iconName:'Timer', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:71.5, range:'0% - 100%' },
        { label:'投资期限偏好', value:'76.8%', iconName:'Ticket', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:76.8, range:'0% - 100%' },
      ],
    },
    cognition: {
      kpi: [
        { label:'当前风险认知', value:'C3.2', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月风险认知', value:'C3.2', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.3', valueClass:'text-blue-500', sub:'预计微升', subClass:'text-blue-400' },
        { label:'最近问卷等级', value:'C5', valueClass:'text-primary-600', sub:'2026-05-15 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-1.8', unit:'级', valueClass:'text-orange-500', sub:'问卷高于认知', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(5), cogDyn, qPArr(5), dPArr(11, 3.2, 3.3)),
      interp: { trendDesc:'近12个月风险认知保持<span class="text-blue-500 font-medium">稳定</span>，维持在C3.2左右', turningPoint:'2026-03小幅提升至C3.4，因客户参加了投资知识培训课程', relationToQ:'问卷评定C5（保守型），认知得分C3.2（稳健型），偏差-1.8级', suggestion:'认知水平稳定，建议加强高风险产品知识教育以提升风险认知' },
      dualAxis: { knowledge:[65,68,66,70,72,70,68,71,78,75,72,72], behavior:[8,10,9,12,14,13,15,16,12,14,15,16] },
      dualAxisInterp: '客户在 2026-03 参加培训后<span class="text-blue-600 font-medium">知识得分</span>跃升至 78 分，但随后<span class="text-amber-600 font-medium">产品行为频次</span>出现小幅波动后回落至 16 次/月，表明知识转化为实际高频交易的意愿整体趋于理性。',
      metric: [
        { label:'历史交易产品类型', value:'78%', iconName:'ShoppingBag', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:78, range:'0% - 100%' },
        { label:'对应金额加权', value:'63%', iconName:'Coin', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:63, range:'0% - 100%' },
        { label:'知识测评', value:'72分', iconName:'Reading', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:72, range:'0 - 100分' },
        { label:'内容阅读深度', value:'48%', iconName:'Document', bgClass:'bg-yellow-50', iconClass:'text-yellow-500', barClass:'bg-yellow-500', pct:48, range:'0% - 100%' },
        { label:'复杂产品理解度', value:'65分', iconName:'EditPen', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:65, range:'0 - 100分' },
      ],
    },
  }
}

function buildC00012858() {
  // 王建国：问卷C4，动态C5，上升型
  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C4', valueClass:'text-yellow-500', sub:'2026-06-10 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C5', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C4', valueClass:'text-gray-700', sub:'2026-05', subClass:'text-gray-400' },
        { label:'等级偏差', value:'+1', unit:'级', valueClass:'text-orange-500', sub:'动态高于问卷', subClass:'text-orange-400' },
        { label:'本月变化', value:'↑1', unit:'级', valueClass:'text-red-500', sub:'较上月上升', subClass:'text-red-400' },
      ],
      trend: makeTrend(qArr(4), [3.2,3.4,3.5,3.6,3.8,4.0,4.1,4.3,4.5,4.6,4.8,4.9,5.0], qPArr(4), dPArr(11,4.9,5.0)),
      radar: { current:[4.5,4.8,4.0,3.5], last:[4.0,4.2,3.8,3.2] },
      modules: [
        { title:'客观风险承受力', value:'C4.5', trend:'↑ 上升', iconName:'TrendCharts', tag:'上升', tagType:'success', route:'/suitability/objective', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'资产规模持续增长，风险承受力提升', disabled:false },
        { title:'风险偏好', value:'C4.8', trend:'↑ 上升', iconName:'Operation', tag:'上升', tagType:'success', route:'/suitability/preference', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'高风险产品购买占比持续增加', disabled:false },
        { title:'风险认知', value:'C4.0', trend:'— 稳定', iconName:'Reading', tag:'稳定', tagType:'info', route:'/suitability/cognition', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'投资知识测试得分中等偏上', disabled:false },
        { title:'异常行为监测', value:'一般关注', trend:'1 条待处理', iconName:'Monitor', tag:'关注', tagType:'warning', route:'', iconBg:'bg-orange-50', iconColor:'text-orange-500', valueClass:'text-orange-500', trendClass:'text-orange-400 text-xs', desc:'交易行为基本正常', disabled:true },
      ],
      reasons: [
        { title:'实际风险偏好持续高于问卷评级，动态等级上移', detail:'• 具体行为：客户频繁进行高风险交易，近60天内连续购买R4及以上高风险产品7次。\n• 行为解释：主观风险偏好得分飙升至C4.8，驱动动态等级上升至C5（高于问卷1级）。' },
      ],
      trendInterp: '客户问卷评估为 <span class="text-yellow-600 font-semibold">C4</span>，但其动态综合风险等级呈现连续抬升趋势，已由 C3.2 上升至 <span class="text-primary-600 font-semibold">C5.0</span>，表现出高出问卷 <span class="text-orange-500 font-semibold">+1级</span> 的交易热度与风险偏好。',
      radarInterp: '客观承受力(<span class="text-green-600 font-medium">C4.5</span>)与风险偏好(<span class="text-green-600 font-medium">C4.8</span>)较上月均有明显扩张，各项维度均达到高风险承受水平，建议同步上调问卷评级。',
      suggestions: [
        { title:'建议上调问卷风险等级', detail:'实际行为显示客户风险偏好已提升，建议重新测评' },
        { title:'建议关注持仓集中度', detail:'单一高风险产品持仓占比达45%，需提示风险' },
      ],
    },
    objective: {
      kpi: [
        { label:'当前分值', value:'C4.5', valueClass:'text-green-500', sub:'较上月上升', subClass:'text-green-400' },
        { label:'上月分值', value:'C4.0', valueClass:'text-gray-700', sub:'2026-05', subClass:'text-gray-400' },
        { label:'未来1月预测', value:'C4.7', valueClass:'text-green-600', sub:'↑ 预计继续上升', subClass:'text-green-400' },
        { label:'最近问卷等级', value:'C4', valueClass:'text-primary-600', sub:'2026-06-10 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-0.5', unit:'级', valueClass:'text-orange-500', sub:'问卷略高于客观', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(4), [3.5,3.6,3.7,3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5,null], qPArr(4), dPArr(11,4.5,4.7)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力呈<span class="text-green-500 font-medium">上升</span>趋势，从C3.5升至C4.5', turningPoint:'2026-01起稳步上升，与资产规模持续增长高度相关', relationToQ:'问卷评定C4（稳健型），客观C4.5（积极型），基本一致', suggestion:'风险承受力良好，建议维持当前产品推荐等级' },
      corr: { risk:[3.5,3.6,3.7,3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5], hs:[3800,3850,3920,3980,4050,4100,4180,4250,4300,4350,4400,4450] },
      marketInterp: '该客户客观得分与大盘走势呈<span class="text-green-600 font-medium">逆势增长/独立行情</span>。尽管沪深300指数总体处于震荡筑底阶段，但该客户因主营业务现金流持续注入及低位加仓高股息资产，可投资资产不降反升，推动客观风险承受得分由 C4.0 稳步增长至 C4.5。',
      metric: [
        { label:'可投资资产', value:'680万', iconName:'Money', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:68, range:'0 - 1000万' },
        { label:'负债收入比', value:'0.4', iconName:'CreditCard', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:20, range:'0 - 2.0' },
        { label:'资产流动性', value:'55%', iconName:'Histogram', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:55, range:'0% - 100%' },
        { label:'收入稳定性', value:'高', iconName:'Suitcase', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:85, range:'低 - 高' },
        { label:'投资经验年限', value:'8年', iconName:'Coin', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:80, range:'0 - 10年' },
      ],
    },
    preference: {
      kpi: [
        { label:'当前风险偏好', value:'C4.8', valueClass:'text-green-500', sub:'较上月上升', subClass:'text-green-400' },
        { label:'上月风险偏好', value:'C4.5', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C5.0', valueClass:'text-green-600', sub:'↑ 预计升至上限', subClass:'text-green-400' },
        { label:'最近问卷等级', value:'C4', valueClass:'text-primary-600', sub:'2026-06-10 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'+0.8', unit:'级', valueClass:'text-red-500', sub:'偏好高于问卷', subClass:'text-red-400' },
      ],
      trend: makeSubTrend(qArr(4), [3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5,4.6,4.7,4.8,null], qPArr(4), dPArr(11,4.8,5.0)),
      interp: { trendDesc:'近12个月风险偏好呈<span class="text-green-500 font-medium">快速上升</span>趋势，从C3.8升至C4.8', turningPoint:'2026-01起加速上升，衍生品交易频次明显增加', relationToQ:'问卷评定C4（稳健型），实际偏好C4.8（激进型），偏差+0.8级', suggestion:'建议上调问卷风险等级，实际行为已显示激进偏好' },
      scatter: [[10,4.0,15],[12,4.1,18],[14,4.0,20],[16,4.2,22],[18,4.3,25],[20,4.4,28],[22,4.5,30],[24,4.6,32],[26,4.5,35],[28,4.6,38],[30,4.7,40],[32,4.8,42]],
      scatterInterp: '散点分布呈现<span class="text-purple-600 font-medium">高偏好高频次聚集</span>。波动率在 10%~32% 波动过程中，客户风险偏好持续上攀至 C4.8，交易频率密集（气泡多在 30~42 次）。表明其交易行为受外部市场波动干扰小，主要由其自身积极加仓激进产品的投资意向驱动。',
      metric: [
        { label:'高风险产品购买占比', value:'75.3%', iconName:'ShoppingCart', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:75.3, range:'0% - 100%' },
        { label:'波动行情加仓倾向', value:'72.1%', iconName:'TrendCharts', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:72.1, range:'0% - 100%' },
        { label:'回撤暴跌囤/持仓行为', value:'68.4%', iconName:'Timer', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:68.4, range:'0% - 100%' },
        { label:'投资期限偏好', value:'82.0%', iconName:'Ticket', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:82, range:'0% - 100%' },
      ],
    },
    cognition: {
      kpi: [
        { label:'当前风险认知', value:'C4.0', valueClass:'text-blue-600', sub:'较上月提升', subClass:'text-blue-400' },
        { label:'上月风险认知', value:'C3.8', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C4.1', valueClass:'text-blue-600', sub:'↑ 预计小幅提升', subClass:'text-blue-400' },
        { label:'最近问卷等级', value:'C4', valueClass:'text-primary-600', sub:'2026-06-10 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'0', unit:'级', valueClass:'text-green-500', sub:'问卷与认知一致', subClass:'text-green-400' },
      ],
      trend: makeSubTrend(qArr(4), [3.5,3.6,3.7,3.7,3.8,3.8,3.9,3.9,4.0,4.0,4.0,4.0,null], qPArr(4), dPArr(11,4.0,4.1)),
      interp: { trendDesc:'近12个月风险认知呈<span class="text-blue-500 font-medium">小幅上升</span>趋势，从C3.5升至C4.0', turningPoint:'2026-02起逐步提升，与主动学习投资知识相关', relationToQ:'问卷评定C4（稳健型），认知得分C4.0（稳健型），完全一致', suggestion:'认知水平良好，建议维持当前学习节奏' },
      dualAxis: { knowledge:[70,72,74,75,78,76,80,82,85,83,86,88], behavior:[10,12,14,15,18,16,20,22,18,20,22,24] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>从 70 分一路攀升至 88 分的高位，带动<span class="text-amber-600 font-medium">产品行为频次</span>从 10 次/月显著增加至 24 次/月。表现出强烈的学习意愿与极高的交易转化率，知行同步提升。',
      metric: [
        { label:'历史交易产品类型', value:'65%', iconName:'ShoppingBag', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:65, range:'0% - 100%' },
        { label:'对应金额加权', value:'58%', iconName:'Coin', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:58, range:'0% - 100%' },
        { label:'知识测评', value:'88分', iconName:'Reading', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:88, range:'0 - 100分' },
        { label:'内容阅读深度', value:'82%', iconName:'Document', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:82, range:'0% - 100%' },
        { label:'复杂产品理解度', value:'85分', iconName:'EditPen', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:85, range:'0 - 100分' },
      ],
    },
  }
}

function buildC00012859() {
  // 赵思远：问卷C5，动态C3，稳定偏低型
  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C5', valueClass:'text-red-500', sub:'2026-07-02 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C3', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C3', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'等级偏差', value:'-2', unit:'级', valueClass:'text-orange-500', sub:'问卷高于动态', subClass:'text-orange-400' },
        { label:'本月变化', value:'→0', unit:'级', valueClass:'text-gray-500', sub:'与上月持平', subClass:'text-gray-400' },
      ],
      trend: makeTrend(qArr(5), [3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2,3.2], qPArr(5), dPArr(11,3.2,3.2)),
      radar: { current:[3.0,3.5,3.8,2.5], last:[3.1,3.4,3.7,2.6] },
      modules: [
        { title:'客观风险承受力', value:'C3.0', trend:'— 稳定', iconName:'TrendCharts', tag:'稳定', tagType:'info', route:'/suitability/objective', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'资产规模稳定，风险承受力中等', disabled:false },
        { title:'风险偏好', value:'C3.5', trend:'— 稳定', iconName:'Operation', tag:'稳定', tagType:'info', route:'/suitability/preference', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'产品购买行为较为均衡', disabled:false },
        { title:'风险认知', value:'C3.8', trend:'— 稳定', iconName:'Reading', tag:'稳定', tagType:'info', route:'/suitability/cognition', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'投资知识测试得分中等', disabled:false },
        { title:'异常行为监测', value:'低关注', trend:'0 条待处理', iconName:'Monitor', tag:'正常', tagType:'success', route:'', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'交易行为正常无异常', disabled:true },
      ],
      reasons: [
        { title:'客观资产与经验不支持C5最高评级', detail:'• 具体行为：客户客观资产规模仅能支撑中等风险水平，仅有3年实际投资经验。\n• 行为解释：客观承受力得分仅为C3.0，与问卷C5存在明显偏差，拉低综合动态等级。' },
      ],
      trendInterp: '客户问卷填报为最高的 <span class="text-red-500 font-semibold">C5</span> 级，但近12个月动态综合风险等级长期横盘在 <span class="text-primary-600 font-semibold">C3.2 左右</span>，偏差达 <span class="text-orange-500 font-semibold">-2级</span>。主要因其客观资产规模与投资年限无法支撑 C5 的激进评级。',
      radarInterp: '各项能力维度非常平稳，风险认知(<span class="text-blue-600 font-medium">C3.8</span>)良好，但客观承受力(<span class="text-blue-600 font-medium">C3.0</span>)偏低，呈典型"认知高于实际承受力"的特征。',
      suggestions: [
        { title:'建议下调问卷风险等级至C3', detail:'客观资产与投资经验均不支持C5评级' },
        { title:'建议安排风险承受力专项评估', detail:'问卷与客观指标偏差达2级，需专项复核' },
      ],
    },
    objective: {
      kpi: [
        { label:'当前分值', value:'C3.0', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月分值', value:'C3.1', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1月预测', value:'C3.0', valueClass:'text-blue-500', sub:'预计维持稳定', subClass:'text-gray-400' },
        { label:'最近问卷等级', value:'C5', valueClass:'text-primary-600', sub:'2026-07-02 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-2.0', unit:'级', valueClass:'text-red-500', sub:'问卷远高于客观', subClass:'text-red-400' },
      ],
      trend: makeSubTrend(qArr(5), [3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2,null], qPArr(5), dPArr(11,3.2,3.0)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力<span class="text-gray-500 font-medium">基本稳定</span>，维持在C3.2左右', turningPoint:'整体平稳，无明显拐点，资产规模保持稳定', relationToQ:'问卷评定C5（保守型），客观仅C3.0（稳健型），偏差-2级', suggestion:'建议下调问卷风险等级至C3，安排专项评估' },
      corr: { risk:[3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2], hs:[3950,3820,3780,3900,4020,3980,3720,3650,3580,3620,3550,3520] },
      marketInterp: '该客户客观得分与大盘走势<span class="text-blue-600 font-medium">高度贴合</span>。其持仓结构以大盘蓝筹指数基金为主，客观得分基本随沪深300指数的起伏在 C3.0~C3.2 区间微幅波动，资产弹性较好，无超额波动风险。',
      metric: [
        { label:'可投资资产', value:'260万', iconName:'Money', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:26, range:'0 - 1000万' },
        { label:'负债收入比', value:'0.9', iconName:'CreditCard', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:45, range:'0 - 2.0' },
        { label:'资产流动性', value:'48%', iconName:'Histogram', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:48, range:'0% - 100%' },
        { label:'收入稳定性', value:'中等', iconName:'Suitcase', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:50, range:'低 - 高' },
        { label:'投资经验年限', value:'3年', iconName:'Coin', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:30, range:'0 - 10年' },
      ],
    },
    preference: {
      kpi: [
        { label:'当前风险偏好', value:'C3.5', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月风险偏好', value:'C3.4', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.5', valueClass:'text-blue-500', sub:'预计维持稳定', subClass:'text-gray-400' },
        { label:'最近问卷等级', value:'C5', valueClass:'text-primary-600', sub:'2026-07-02 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-1.5', unit:'级', valueClass:'text-orange-500', sub:'问卷远高于偏好', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(5), [3.4,3.5,3.4,3.5,3.4,3.5,3.5,3.5,3.5,3.5,3.5,3.5,null], qPArr(5), dPArr(11,3.5,3.5)),
      interp: { trendDesc:'近12个月风险偏好<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.5左右', turningPoint:'无明显拐点，产品购买行为较为均衡', relationToQ:'问卷评定C5（保守型），实际偏好C3.5（稳健型），偏差-1.5级', suggestion:'建议下调问卷评级至C3，实际偏好并不激进' },
      scatter: [[8,3.5,10],[10,3.4,12],[12,3.5,14],[14,3.6,16],[16,3.5,18],[18,3.4,15],[20,3.5,20],[22,3.6,18],[24,3.5,22],[26,3.4,20],[28,3.5,24],[30,3.6,22]],
      scatterInterp: '散点集中分布于 <span class="text-blue-600 font-medium">C3.4~C3.6 水平横轴</span>，且气泡尺寸均匀（10~24 次）。无论市场波动率在 8% 到 30% 之间如何变化，客户的偏好评分与购买行为均无剧烈波动，表现出强抗干扰能力与明确的自我定力。',
      metric: [
        { label:'高风险产品购买占比', value:'32.0%', iconName:'ShoppingCart', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:32, range:'0% - 100%' },
        { label:'波动行情加仓倾向', value:'28.7%', iconName:'TrendCharts', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:28.7, range:'0% - 100%' },
        { label:'回撤暴跌囤/持仓行为', value:'35.6%', iconName:'Timer', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:35.6, range:'0% - 100%' },
        { label:'投资期限偏好', value:'52.3%', iconName:'Ticket', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:52.3, range:'0% - 100%' },
      ],
    },
    cognition: {
      kpi: [
        { label:'当前风险认知', value:'C3.8', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月风险认知', value:'C3.7', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.8', valueClass:'text-blue-500', sub:'预计维持稳定', subClass:'text-gray-400' },
        { label:'最近问卷等级', value:'C5', valueClass:'text-primary-600', sub:'2026-07-02 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-1.2', unit:'级', valueClass:'text-orange-500', sub:'问卷高于认知', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(5), [3.5,3.6,3.6,3.7,3.7,3.7,3.8,3.8,3.8,3.8,3.8,3.8,null], qPArr(5), dPArr(11,3.8,3.8)),
      interp: { trendDesc:'近12个月风险认知<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.7左右', turningPoint:'无明显拐点，投资知识测试得分中等偏上', relationToQ:'问卷评定C5（保守型），认知得分C3.8（稳健型），偏差-1.2级', suggestion:'认知水平中等，建议安排专项投资知识培训' },
      dualAxis: { knowledge:[60,62,64,66,68,70,68,72,74,72,75,76], behavior:[6,8,7,10,12,11,14,15,12,14,15,14] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">投资知识得分</span>稳步升至 76 分，但<span class="text-amber-600 font-medium">产品行为频次</span>长期维持在 12-15 次/月的较低水平。呈现"重知识积累、轻频繁操作"的稳健审慎型特征。',
      metric: [
        { label:'历史交易产品类型', value:'55%', iconName:'ShoppingBag', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:55, range:'0% - 100%' },
        { label:'对应金额加权', value:'50%', iconName:'Coin', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:50, range:'0% - 100%' },
        { label:'知识测评', value:'76分', iconName:'Reading', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:76, range:'0 - 100分' },
        { label:'内容阅读深度', value:'58%', iconName:'Document', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:58, range:'0% - 100%' },
        { label:'复杂产品理解度', value:'62分', iconName:'EditPen', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:62, range:'0 - 100分' },
      ],
    },
  }
}

function buildC00012860() {
  // 陈晓明：问卷C3，动态C5，快速上升型
  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C3', valueClass:'text-blue-500', sub:'2026-08-01 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C5', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C4', valueClass:'text-gray-700', sub:'2026-07', subClass:'text-gray-400' },
        { label:'等级偏差', value:'+2', unit:'级', valueClass:'text-orange-500', sub:'动态高于问卷', subClass:'text-orange-400' },
        { label:'本月变化', value:'↑1', unit:'级', valueClass:'text-red-500', sub:'较上月上升', subClass:'text-red-400' },
      ],
      trend: makeTrend(qArr(3), [3.0,3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.7,4.8,4.9,5.0], qPArr(3), dPArr(11,4.9,5.0)),
      radar: { current:[4.8,5.0,4.2,3.8], last:[4.3,4.5,4.0,3.5] },
      modules: [
        { title:'客观风险承受力', value:'C4.8', trend:'↑ 上升', iconName:'TrendCharts', tag:'上升', tagType:'success', route:'/suitability/objective', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'可投资资产大幅增长', disabled:false },
        { title:'风险偏好', value:'C5.0', trend:'↑ 上升', iconName:'Operation', tag:'上升', tagType:'success', route:'/suitability/preference', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'激进型投资行为明显', disabled:false },
        { title:'风险认知', value:'C4.2', trend:'↑ 上升', iconName:'Reading', tag:'上升', tagType:'success', route:'/suitability/cognition', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'投资知识测试得分提升', disabled:false },
        { title:'异常行为监测', value:'高关注', trend:'3 条待处理', iconName:'Monitor', tag:'预警', tagType:'warning', route:'', iconBg:'bg-orange-50', iconColor:'text-orange-500', valueClass:'text-orange-500', trendClass:'text-orange-400 text-xs', desc:'高杠杆操作频次较高', disabled:true },
      ],
      reasons: [
        { title:'实际风险偏好激进，远超问卷评估，动态等级偏离2级', detail:'• 具体行为：问卷填写为C3稳健型，但实际交易频次与风险偏好指标已全面达到C5激进水平。\n• 行为解释：主观偏好与实际行为激增，导致动态等级向上偏离问卷2级。' },
        { title:'衍生品及高杠杆持仓高度集中，风险敞口过大', detail:'• 具体行为：衍生品及杠杆ETF持仓占比已高达52%，近30天交易频次高达38次。\n• 行为解释：高杠杆持仓大幅抬升整体风险敞口，高频交易触发异常行为高关注预警。' },
      ],
      trendInterp: '客户静态问卷为 <span class="text-blue-600 font-semibold">C3</span>，但近一年动态风险等级直线上升至 <span class="text-primary-600 font-semibold">C5.0</span>，呈现极强的正向偏离（<span class="text-orange-500 font-semibold">+2级</span>）。反映其近期发生了剧烈的激进投资行为转型。',
      radarInterp: '风险偏好飙升至极限值 <span class="text-green-600 font-medium">C5.0</span>，客观承受力(<span class="text-green-600 font-medium">C4.8</span>)大幅强于上月，但伴随高杠杆衍生品操作，导致异常行为控制维度风险敞口快速放大。',
      suggestions: [
        { title:'强烈建议重新问卷评估', detail:'偏差达2级，当前问卷已无法反映真实风险偏好' },
        { title:'建议限制杠杆产品买入', detail:'高杠杆产品占比过高，需进行适当性适当性提示' },
        { title:'触发合规审查', detail:'问卷与动态偏差达2级，需合规部门专项审查' },
      ],
    },
    objective: {
      kpi: [
        { label:'当前分值', value:'C4.8', valueClass:'text-green-500', sub:'较上月上升', subClass:'text-green-400' },
        { label:'上月分值', value:'C4.3', valueClass:'text-gray-700', sub:'2026-07', subClass:'text-gray-400' },
        { label:'未来1月预测', value:'C5.0', valueClass:'text-green-600', sub:'↑ 预计继续上升', subClass:'text-green-400' },
        { label:'最近问卷等级', value:'C3', valueClass:'text-primary-600', sub:'2026-08-01 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'+1.8', unit:'级', valueClass:'text-red-500', sub:'动态远高于问卷', subClass:'text-red-400' },
      ],
      trend: makeSubTrend(qArr(3), [3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.6,4.7,4.8,4.8,null], qPArr(3), dPArr(11,4.8,5.0)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力呈<span class="text-green-500 font-medium">快速上升</span>趋势，从C3.2升至C4.8', turningPoint:'2025-10起加速上升，与可投资资产大幅增长相关', relationToQ:'问卷评定C3（稳健型），客观C4.8（激进型），严重不一致', suggestion:'建议重新问卷评估，当前客观承受力远超问卷评级' },
      corr: { risk:[3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.6,4.7,4.8,4.8], hs:[3600,3650,3700,3780,3850,3920,4000,4080,4150,4200,4280,4350] },
      marketInterp: '该客户客观得分与大盘走势呈<span class="text-purple-600 font-medium">强顺周期扩张性</span>。大盘微幅反弹期间，客户通过高杠杆交易获得了超额资本增值，可投资资产大幅提升，驱动客观得分由 C3.5 快速上升至 C4.8。需注意大盘一旦回调可能引发的杠杆资产加速穿仓风险。',
      metric: [
        { label:'可投资资产', value:'820万', iconName:'Money', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:82, range:'0 - 1000万' },
        { label:'负债收入比', value:'0.2', iconName:'CreditCard', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:10, range:'0 - 2.0' },
        { label:'资产流动性', value:'35%', iconName:'Histogram', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:35, range:'0% - 100%' },
        { label:'收入稳定性', value:'高', iconName:'Suitcase', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:90, range:'低 - 高' },
        { label:'投资经验年限', value:'9年', iconName:'Coin', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:90, range:'0 - 10年' },
      ],
    },
    preference: {
      kpi: [
        { label:'当前风险偏好', value:'C5.0', valueClass:'text-red-500', sub:'较上月上升', subClass:'text-red-400' },
        { label:'上月风险偏好', value:'C4.5', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C5.0', valueClass:'text-red-600', sub:'已到上限', subClass:'text-red-400' },
        { label:'最近问卷等级', value:'C3', valueClass:'text-primary-600', sub:'2026-08-01 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'+2.0', unit:'级', valueClass:'text-red-500', sub:'偏好远高于问卷', subClass:'text-red-400' },
      ],
      trend: makeSubTrend(qArr(3), [4.0,4.2,4.3,4.4,4.5,4.6,4.7,4.8,4.8,4.9,5.0,5.0,null], qPArr(3), dPArr(11,5.0,5.0)),
      interp: { trendDesc:'近12个月风险偏好呈<span class="text-red-500 font-medium">快速上升</span>趋势，从C4.0升至C5.0', turningPoint:'2025-12起加速上升，衍生品和杠杆产品占比大幅增加', relationToQ:'问卷评定C3（稳健型），实际偏好C5.0（激进型），严重不一致', suggestion:'强烈建议重新评估问卷，客户实际偏好已达最高级' },
      scatter: [[15,4.0,20],[18,4.2,25],[20,4.3,28],[22,4.4,32],[24,4.5,35],[26,4.6,38],[28,4.7,42],[30,4.8,45],[32,4.9,48],[34,5.0,50],[36,5.0,52],[38,5.0,55]],
      scatterInterp: '散点图向右上角<span class="text-red-500 font-medium">强烈倾斜与扩张</span>。随着市场波动率提升至 38%，风险偏好封顶至 C5.0，购买频次飙升至 55 次（最大气泡）。反映客户具有极高的风险偏好和极强的抄底/加杠杆交易欲望，需重点防范高波动下的穿仓风险。',
      metric: [
        { label:'高风险产品购买占比', value:'82.4%', iconName:'ShoppingCart', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:82.4, range:'0% - 100%' },
        { label:'波动行情加仓倾向', value:'78.9%', iconName:'TrendCharts', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:78.9, range:'0% - 100%' },
        { label:'回撤暴跌囤/持仓行为', value:'85.1%', iconName:'Timer', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:85.1, range:'0% - 100%' },
        { label:'投资期限偏好', value:'90.2%', iconName:'Ticket', bgClass:'bg-red-50', iconClass:'text-red-500', barClass:'bg-red-500', pct:90.2, range:'0% - 100%' },
      ],
    },
    cognition: {
      kpi: [
        { label:'当前风险认知', value:'C4.2', valueClass:'text-blue-600', sub:'较上月提升', subClass:'text-blue-400' },
        { label:'上月风险认知', value:'C4.0', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C4.3', valueClass:'text-blue-600', sub:'↑ 预计小幅提升', subClass:'text-blue-400' },
        { label:'最近问卷等级', value:'C3', valueClass:'text-primary-600', sub:'2026-08-01 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'+1.2', unit:'级', valueClass:'text-red-500', sub:'认知高于问卷', subClass:'text-red-400' },
      ],
      trend: makeSubTrend(qArr(3), [3.5,3.6,3.7,3.8,3.9,4.0,4.0,4.1,4.2,4.2,4.2,4.2,null], qPArr(3), dPArr(11,4.2,4.3)),
      interp: { trendDesc:'近12个月风险认知呈<span class="text-blue-500 font-medium">上升</span>趋势，从C3.5升至C4.2', turningPoint:'2026-01起持续提升，客户主动参与多次投教活动', relationToQ:'问卷评定C3（稳健型），认知得分C4.2（稳健型偏上），偏差+1.2级', suggestion:'认知水平较高，建议重新评估问卷以匹配实际认知' },
      dualAxis: { knowledge:[72,74,76,78,80,82,84,86,88,90,92,94], behavior:[12,14,16,18,20,22,24,26,22,24,26,28] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>突破 90 分达到 94 分，<span class="text-amber-600 font-medium">产品行为频次</span>也随之飙升至 28 次/月。知识储备的爆发式增长显著激发了复杂产品的交易行为，建议关注其高频交易的风控限制。',
      metric: [
        { label:'历史交易产品类型', value:'78%', iconName:'ShoppingBag', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:78, range:'0% - 100%' },
        { label:'对应金额加权', value:'63%', iconName:'Coin', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:63, range:'0% - 100%' },
        { label:'知识测评', value:'94分', iconName:'Reading', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:94, range:'0 - 100分' },
        { label:'内容阅读深度', value:'88%', iconName:'Document', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:88, range:'0% - 100%' },
        { label:'复杂产品理解度', value:'91分', iconName:'EditPen', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:91, range:'0 - 100分' },
      ],
    },
  }
}

function buildC00008231() {
  // 张三：问卷C3，动态C3，稳定基准型
  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C3', valueClass:'text-blue-500', sub:'2026-03-15 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C3', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C3', valueClass:'text-gray-700', sub:'2026-02', subClass:'text-gray-400' },
        { label:'等级偏差', value:'0', unit:'级', valueClass:'text-green-500', sub:'问卷与动态一致', subClass:'text-green-400' },
        { label:'本月变化', value:'→0', unit:'级', valueClass:'text-gray-500', sub:'与上月持平', subClass:'text-gray-400' },
      ],
      trend: makeTrend(qArr(3), [3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1,3.1], qPArr(3), dPArr(11,3.1,3.1)),
      radar: { current:[3.2,3.0,3.5,3.1], last:[3.1,3.0,3.4,3.0] },
      modules: [
        { title:'客观风险承受力', value:'C3.2', trend:'— 稳定', iconName:'TrendCharts', tag:'稳定', tagType:'info', route:'/suitability/objective', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'资产规模稳定，风险承受力中等', disabled:false },
        { title:'风险偏好', value:'C3.0', trend:'— 稳定', iconName:'Operation', tag:'稳定', tagType:'info', route:'/suitability/preference', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'产品购买行为均衡', disabled:false },
        { title:'风险认知', value:'C3.5', trend:'— 稳定', iconName:'Reading', tag:'稳定', tagType:'info', route:'/suitability/cognition', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'投资知识测试得分中等偏上', disabled:false },
        { title:'异常行为监测', value:'低关注', trend:'0 条待处理', iconName:'Monitor', tag:'正常', tagType:'success', route:'', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'交易行为正常', disabled:true },
      ],
      reasons: [
        { title:'指标运行平稳，暂无风险下调原因', detail:'• 具体行为：近12个月资产规模、持仓结构及交易行为均与问卷测评保持高度一致。\n• 行为解释：动态综合等级（C3）与问卷等级（C3）完全匹配，未触发任何风控下调规则。' },
      ],
      trendInterp: '问卷测评结果（<span class="text-blue-600 font-semibold">C3</span>）与近12个月动态综合风险走势（<span class="text-primary-600 font-semibold">C3.1</span>）高度重合，偏差为 <span class="text-green-600 font-semibold">0级</span>，表现出极高的画像匹配度与行为稳定性。',
      radarInterp: '四维能力分布均衡且与上月基本持平，客观承受力(<span class="text-blue-600 font-medium">C3.2</span>)、风险偏好(<span class="text-blue-600 font-medium">C3.0</span>)均在中等稳健区间，无异常风险暴露。',
      suggestions: [
        { title:'建议维持当前风险评级', detail:'问卷与动态一致，无需调整' },
        { title:'建议定期回访跟进', detail:'建议每季度进行一次适当性回访' },
      ],
    },
    objective: {
      kpi: [
        { label:'当前分值', value:'C3.2', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月分值', value:'C3.1', valueClass:'text-gray-700', sub:'2026-02', subClass:'text-gray-400' },
        { label:'未来1月预测', value:'C3.1', valueClass:'text-blue-500', sub:'预计维持稳定', subClass:'text-gray-400' },
        { label:'最近问卷等级', value:'C3', valueClass:'text-primary-600', sub:'2026-03-15 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-0.2', unit:'级', valueClass:'text-green-500', sub:'问卷与客观一致', subClass:'text-green-400' },
      ],
      trend: makeSubTrend(qArr(3), [3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1,null], qPArr(3), dPArr(11,3.1,3.1)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.1左右', turningPoint:'无明显拐点，资产规模稳定', relationToQ:'问卷评定C3（稳健型），客观C3.2（稳健型），基本一致', suggestion:'无需调整，建议维持当前评级并定期回访' },
      corr: { risk:[3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1], hs:[3900,3850,3880,3920,3950,3900,3850,3880,3920,3880,3850,3860] },
      marketInterp: '该客户客观风险得分与沪深300指数走势呈现<span class="text-blue-600 font-medium">低相关性</span>。由于客户资产主要集中于货币基金与低风险固收类理财（流动性资金占50%），受大盘权益市场波动冲击极小，客观风险承受能力始终稳定在 C3.1 左右，具备较强的抗市场系统性风险能力。',
      metric: [
        { label:'可投资资产', value:'350万', iconName:'Money', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:35, range:'0 - 1000万' },
        { label:'负债收入比', value:'0.6', iconName:'CreditCard', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:30, range:'0 - 2.0' },
        { label:'资产流动性', value:'50%', iconName:'Histogram', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:50, range:'0% - 100%' },
        { label:'收入稳定性', value:'中等', iconName:'Suitcase', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:55, range:'低 - 高' },
        { label:'投资经验年限', value:'5年', iconName:'Coin', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:50, range:'0 - 10年' },
      ],
    },
    preference: {
      kpi: [
        { label:'当前风险偏好', value:'C3.0', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月风险偏好', value:'C3.0', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.1', valueClass:'text-blue-500', sub:'↑ 预计微升', subClass:'text-blue-400' },
        { label:'最近问卷等级', value:'C3', valueClass:'text-primary-600', sub:'2026-03-15 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'0', unit:'级', valueClass:'text-green-500', sub:'问卷与偏好一致', subClass:'text-green-400' },
      ],
      trend: makeSubTrend(qArr(3), [3.0,3.1,3.0,3.1,3.0,3.1,3.0,3.0,3.1,3.0,3.0,3.0,null], qPArr(3), dPArr(11,3.0,3.1)),
      interp: { trendDesc:'近12个月风险偏好<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.0左右', turningPoint:'无明显拐点，产品购买行为均衡', relationToQ:'问卷评定C3（稳健型），实际偏好C3.0（稳健型），完全一致', suggestion:'无需调整，建议维持当前评级并持续观察' },
      scatter: [[8,3.0,10],[10,3.1,12],[12,3.0,14],[14,3.1,13],[16,3.0,15],[18,3.1,14],[20,3.0,16],[22,3.0,15],[24,3.1,17],[26,3.0,16],[28,3.0,18],[30,3.1,17]],
      scatterInterp: '散点图分布显示，该客户在市场波动率从 8% 上升至 30% 期间，其风险偏好稳定在 <span class="text-blue-600 font-medium">C3.0 左右</span>，购买频次（气泡大小）保持在 10~18 次平稳区间。表明客户对市场波动不敏感，不存在追涨杀跌行为，具备极高理性的稳健投资习惯。',
      metric: [
        { label:'高风险产品购买占比', value:'28.0%', iconName:'ShoppingCart', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:28, range:'0% - 100%' },
        { label:'波动行情加仓倾向', value:'32.5%', iconName:'TrendCharts', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:32.5, range:'0% - 100%' },
        { label:'回撤暴跌囤/持仓行为', value:'35.2%', iconName:'Timer', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:35.2, range:'0% - 100%' },
        { label:'投资期限偏好', value:'42.8%', iconName:'Ticket', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:42.8, range:'0% - 100%' },
      ],
    },
    cognition: {
      kpi: [
        { label:'当前风险认知', value:'C3.5', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月风险认知', value:'C3.4', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.5', valueClass:'text-blue-500', sub:'预计维持稳定', subClass:'text-gray-400' },
        { label:'最近问卷等级', value:'C3', valueClass:'text-primary-600', sub:'2026-03-15 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-0.5', unit:'级', valueClass:'text-green-500', sub:'问卷与认知接近', subClass:'text-green-400' },
      ],
      trend: makeSubTrend(qArr(3), [3.4,3.5,3.4,3.5,3.5,3.4,3.5,3.5,3.4,3.5,3.5,3.5,null], qPArr(3), dPArr(11,3.5,3.5)),
      interp: { trendDesc:'近12个月风险认知<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.5左右', turningPoint:'无明显拐点，投资知识测试得分稳定', relationToQ:'问卷评定C3（稳健型），认知得分C3.5（稳健型），基本一致', suggestion:'无需调整，建议定期参加投教活动保持认知水平' },
      dualAxis: { knowledge:[68,70,72,70,74,72,70,72,74,72,73,74], behavior:[8,10,12,10,14,12,14,16,12,14,14,16] },
      dualAxisInterp: '客户的<span class="text-blue-600 font-medium">投资知识得分</span>稳定在 70-74 分区间，<span class="text-amber-600 font-medium">产品行为频次</span>保持在 10-16 次/月的温和水平。知识储备与实际投资行为高度匹配，未出现"盲目交易"或"知行不一"现象。',
      metric: [
        { label:'历史交易产品类型', value:'52%', iconName:'ShoppingBag', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:52, range:'0% - 100%' },
        { label:'对应金额加权', value:'48%', iconName:'Coin', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:48, range:'0% - 100%' },
        { label:'知识测评', value:'74分', iconName:'Reading', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:74, range:'0 - 100分' },
        { label:'内容阅读深度', value:'65%', iconName:'Document', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:65, range:'0% - 100%' },
        { label:'复杂产品理解度', value:'68分', iconName:'EditPen', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:68, range:'0 - 100分' },
      ],
    },
  }
}

function buildC00008232() {
  // 李四：问卷C4，动态C3，轻微下降型
  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C4', valueClass:'text-yellow-500', sub:'2026-04-20 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C3', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C4', valueClass:'text-gray-700', sub:'2026-03', subClass:'text-gray-400' },
        { label:'等级偏差', value:'-1', unit:'级', valueClass:'text-orange-500', sub:'问卷略高于动态', subClass:'text-orange-400' },
        { label:'本月变化', value:'↓1', unit:'级', valueClass:'text-green-500', sub:'较上月下降', subClass:'text-green-400' },
      ],
      trend: makeTrend(qArr(4), [4.0,3.9,3.8,3.7,3.8,3.7,3.6,3.5,3.4,3.5,3.4,3.3,3.3], qPArr(4), dPArr(11,3.3,3.3)),
      radar: { current:[3.0,3.5,3.2,2.8], last:[3.3,3.8,3.3,3.0] },
      modules: [
        { title:'客观风险承受力', value:'C3.0', trend:'↓ 下降', iconName:'TrendCharts', tag:'下降', tagType:'danger', route:'/suitability/objective', iconBg:'bg-red-50', iconColor:'text-red-500', valueClass:'text-red-500', trendClass:'text-red-400 text-xs', desc:'可投资资产小幅缩减', disabled:false },
        { title:'风险偏好', value:'C3.5', trend:'↓ 下降', iconName:'Operation', tag:'下降', tagType:'danger', route:'/suitability/preference', iconBg:'bg-red-50', iconColor:'text-red-500', valueClass:'text-red-500', trendClass:'text-red-400 text-xs', desc:'高风险产品购买减少', disabled:false },
        { title:'风险认知', value:'C3.2', trend:'— 稳定', iconName:'Reading', tag:'稳定', tagType:'info', route:'/suitability/cognition', iconBg:'bg-blue-50', iconColor:'text-blue-500', valueClass:'text-blue-500', trendClass:'text-blue-400 text-xs', desc:'投资知识测试得分稳定', disabled:false },
        { title:'异常行为监测', value:'低关注', trend:'0 条待处理', iconName:'Monitor', tag:'正常', tagType:'success', route:'', iconBg:'bg-green-50', iconColor:'text-green-500', valueClass:'text-green-500', trendClass:'text-green-400 text-xs', desc:'交易行为正常', disabled:true },
      ],
      reasons: [
        { title:'可投资资产小幅缩减，客观承受力微调下降', detail:'• 具体行为：近2个月可投资资产从280万降至220万，资本缓冲空间有所收窄。\n• 行为解释：客观风险承受力由C3.3微调至C3.0，驱动动态等级下调1级。' },
        { title:'高风险产品主动减仓，综合等级回归C3', detail:'• 具体行为：高风险持仓比例从35%自主降至22%，交易偏好有所收敛。\n• 行为解释：客户实际风险偏好主动降低，综合动态等级从C4调整为C3。' },
      ],
      trendInterp: '客户问卷等级为 <span class="text-yellow-600 font-semibold">C4</span>，近12个月动态风险等级由 C4.0 缓步下行至 <span class="text-primary-600 font-semibold">C3.3</span>，存在 <span class="text-orange-500 font-semibold">-1级</span> 的微幅回落，整体属于受资产波动影响的正常调整。',
      radarInterp: '客观承受力(<span class="text-red-500 font-medium">C3.0</span>)和风险偏好(<span class="text-red-500 font-medium">C3.5</span>)较上月均有轻微收缩，反映客户在资产变动后自主采取了相对保守的避险策略。',
      suggestions: [
        { title:'建议关注资产变动原因', detail:'资产下降原因需进一步了解' },
        { title:'建议维持当前问卷评级', detail:'偏差仅1级，暂不需强制重新测评' },
      ],
    },
    objective: {
      kpi: [
        { label:'当前分值', value:'C3.0', valueClass:'text-red-500', sub:'较上月下降', subClass:'text-red-400' },
        { label:'上月分值', value:'C3.3', valueClass:'text-gray-700', sub:'2026-03', subClass:'text-gray-400' },
        { label:'未来1月预测', value:'C2.9', valueClass:'text-orange-500', sub:'↓ 预计小幅下降', subClass:'text-orange-400' },
        { label:'最近问卷等级', value:'C4', valueClass:'text-primary-600', sub:'2026-04-20 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-1.0', unit:'级', valueClass:'text-orange-500', sub:'问卷略高于客观', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(4), [3.5,3.4,3.3,3.4,3.3,3.2,3.3,3.2,3.1,3.2,3.1,3.0,null], qPArr(4), dPArr(11,3.0,2.9)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力呈<span class="text-red-500 font-medium">小幅下降</span>趋势，从C3.5降至C3.0', turningPoint:'2026-01起逐步下降，与可投资资产缩减相关', relationToQ:'问卷评定C4（稳健型），客观C3.0（稳健型），偏差-1级', suggestion:'建议关注资产变动原因，暂不需强制重新测评' },
      corr: { risk:[3.5,3.4,3.3,3.4,3.3,3.2,3.3,3.2,3.1,3.2,3.1,3.0], hs:[4000,3950,3880,3920,3850,3800,3750,3720,3680,3700,3650,3600] },
      marketInterp: '该客户客观得分与大盘存在<span class="text-orange-500 font-medium">中度正相关性</span>。随着近期大盘指数从 4,100 点回落至 3,900 点，客户持有的权益类资产市值缩水近 60 万，导致客观风险承受得分从 C3.3 微降至 C3.0。市场波动是导致其客观得分下调的主要外部因素。',
      metric: [
        { label:'可投资资产', value:'220万', iconName:'Money', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:22, range:'0 - 1000万' },
        { label:'负债收入比', value:'0.8', iconName:'CreditCard', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:40, range:'0 - 2.0' },
        { label:'资产流动性', value:'45%', iconName:'Histogram', bgClass:'bg-green-50', iconClass:'text-green-500', barClass:'bg-green-500', pct:45, range:'0% - 100%' },
        { label:'收入稳定性', value:'中等', iconName:'Suitcase', bgClass:'bg-orange-50', iconClass:'text-orange-500', barClass:'bg-orange-500', pct:50, range:'低 - 高' },
        { label:'投资经验年限', value:'4年', iconName:'Coin', bgClass:'bg-purple-50', iconClass:'text-purple-500', barClass:'bg-purple-500', pct:40, range:'0 - 10年' },
      ],
    },
    preference: {
      kpi: [
        { label:'当前风险偏好', value:'C3.5', valueClass:'text-blue-500', sub:'较上月下降', subClass:'text-blue-400' },
        { label:'上月风险偏好', value:'C3.8', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.3', valueClass:'text-blue-500', sub:'↓ 预计下降', subClass:'text-blue-400' },
        { label:'最近问卷等级', value:'C4', valueClass:'text-primary-600', sub:'2026-04-20 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-0.5', unit:'级', valueClass:'text-orange-500', sub:'问卷略高于偏好', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(4), [3.8,3.7,3.6,3.7,3.6,3.5,3.6,3.5,3.5,3.5,3.5,3.5,null], qPArr(4), dPArr(11,3.5,3.3)),
      interp: { trendDesc:'近12个月风险偏好呈<span class="text-blue-500 font-medium">小幅下降</span>趋势，从C3.8降至C3.5', turningPoint:'2026-02起逐步下降，高风险产品购买减少', relationToQ:'问卷评定C4（稳健型），实际偏好C3.5（稳健型），偏差-0.5级', suggestion:'偏差较小，建议维持当前评级并持续观察' },
      scatter: [[8,3.8,10],[10,3.7,12],[12,3.6,14],[14,3.7,13],[16,3.6,15],[18,3.5,14],[20,3.6,16],[22,3.5,15],[24,3.5,14],[26,3.5,16],[28,3.5,14],[30,3.5,15]],
      scatterInterp: '散点图呈现<span class="text-orange-500 font-medium">弱负相关性</span>。随着市场波动率从 8% 攀升至 30%，客户的风险偏好从 C3.8 逐步回落至 C3.5，且气泡大小有所收缩。说明行情波动加大时，客户风险偏好有所收敛，偏向避险并小幅减少产品交易频率。',
      metric: [
        { label:'高风险产品购买占比', value:'22.0%', iconName:'ShoppingCart', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:22, range:'0% - 100%' },
        { label:'波动行情加仓倾向', value:'28.3%', iconName:'TrendCharts', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:28.3, range:'0% - 100%' },
        { label:'回撤暴跌囤/持仓行为', value:'30.1%', iconName:'Timer', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:30.1, range:'0% - 100%' },
        { label:'投资期限偏好', value:'38.5%', iconName:'Ticket', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:38.5, range:'0% - 100%' },
      ],
    },
    cognition: {
      kpi: [
        { label:'当前风险认知', value:'C3.2', valueClass:'text-blue-500', sub:'与上月持平', subClass:'text-gray-400' },
        { label:'上月风险认知', value:'C3.3', valueClass:'text-gray-700', sub:'2026-06', subClass:'text-gray-400' },
        { label:'未来1个月预测', value:'C3.2', valueClass:'text-blue-500', sub:'预计维持稳定', subClass:'text-gray-400' },
        { label:'最近问卷等级', value:'C4', valueClass:'text-primary-600', sub:'2026-04-20 测评', subClass:'text-gray-400' },
        { label:'偏差值', value:'-0.8', unit:'级', valueClass:'text-orange-500', sub:'问卷略高于认知', subClass:'text-orange-400' },
      ],
      trend: makeSubTrend(qArr(4), [3.3,3.2,3.3,3.2,3.2,3.3,3.2,3.2,3.2,3.2,3.2,3.2,null], qPArr(4), dPArr(11,3.2,3.2)),
      interp: { trendDesc:'近12个月风险认知<span class="text-blue-500 font-medium">基本稳定</span>，维持在C3.2左右', turningPoint:'无明显拐点，投资知识测试得分中等', relationToQ:'问卷评定C4（稳健型），认知得分C3.2（稳健型），偏差-0.8级', suggestion:'偏差较小，建议维持当前评级并鼓励参加投教活动' },
      dualAxis: { knowledge:[62,64,63,66,68,67,65,68,70,68,72,70], behavior:[6,8,7,10,12,11,10,12,14,12,14,12] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>由 62 分缓慢提升至 70 分，同时<span class="text-amber-600 font-medium">产品行为频次</span>从 6 次稳步增至 12 次/月。知识积累有效驱动了产品交易活跃度的提升，行为拓展节奏平稳。',
      metric: [
        { label:'历史交易产品类型', value:'45%', iconName:'ShoppingBag', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:45, range:'0% - 100%' },
        { label:'对应金额加权', value:'42%', iconName:'Coin', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:42, range:'0% - 100%' },
        { label:'知识测评', value:'70分', iconName:'Reading', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:70, range:'0 - 100分' },
        { label:'内容阅读深度', value:'55%', iconName:'Document', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:55, range:'0% - 100%' },
        { label:'复杂产品理解度', value:'60分', iconName:'EditPen', bgClass:'bg-blue-50', iconClass:'text-blue-500', barClass:'bg-blue-500', pct:60, range:'0 - 100分' },
      ],
    },
  }
}

/* ================================================================
 * 4. 数据构建映射
 * ================================================================ */
const BUILDERS = {
  C00012857: buildC00012857,
  C00012858: buildC00012858,
  C00012859: buildC00012859,
  C00012860: buildC00012860,
  C00008231: buildC00008231,
  C00008232: buildC00008232,
}

/* ================================================================
 * 5. 主流程
 * ================================================================ */
async function main() {
  console.log('--- 开始初始化数据库 ---')

  // 5a. 执行建表 SQL
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, 'sql', 'schema.sql'),
    'utf-8'
  )
  await pool.query(schemaSQL)
  console.log('✓ 表结构已创建/更新')

  // 5b. 插入 customers 表
  for (const c of CUSTOMERS) {
    await pool.query(
      `INSERT INTO customers (id, name, questionnaire_level, predict_level, assess_time, level_diff)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET
         name=EXCLUDED.name, questionnaire_level=EXCLUDED.questionnaire_level,
         predict_level=EXCLUDED.predict_level, assess_time=EXCLUDED.assess_time,
         level_diff=EXCLUDED.level_diff`,
      [c.id, c.name, c.ql, c.pl, c.assess, c.diff]
    )
  }
  console.log(`✓ 已插入 ${CUSTOMERS.length} 条客户记录`)

  // 5c. 插入 customer_risk_data 表
  for (const c of CUSTOMERS) {
    const data = BUILDERS[c.id]()
    const o = data.overview
    const obj = data.objective
    const pref = data.preference
    const cog = data.cognition

    await pool.query(
      `INSERT INTO customer_risk_data (
        customer_id,
        overview_kpi, overview_trend, overview_radar, overview_modules,
        overview_reasons, overview_suggestions, overview_trend_interp, overview_radar_interp,
        objective_kpi, objective_trend, objective_months, objective_interp,
        objective_corr, objective_market_interp, objective_metric,
        preference_kpi, preference_trend, preference_interp,
        preference_scatter, preference_scatter_interp, preference_metric,
        cognition_kpi, cognition_trend, cognition_interp,
        cognition_dual_axis, cognition_dual_axis_interp, cognition_metric
      ) VALUES (
        $1,
        $2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,
        $23,$24,$25,$26,$27,$28
      )
      ON CONFLICT (customer_id) DO UPDATE SET
        overview_kpi=EXCLUDED.overview_kpi, overview_trend=EXCLUDED.overview_trend,
        overview_radar=EXCLUDED.overview_radar, overview_modules=EXCLUDED.overview_modules,
        overview_reasons=EXCLUDED.overview_reasons, overview_suggestions=EXCLUDED.overview_suggestions,
        overview_trend_interp=EXCLUDED.overview_trend_interp, overview_radar_interp=EXCLUDED.overview_radar_interp,
        objective_kpi=EXCLUDED.objective_kpi, objective_trend=EXCLUDED.objective_trend,
        objective_months=EXCLUDED.objective_months, objective_interp=EXCLUDED.objective_interp,
        objective_corr=EXCLUDED.objective_corr, objective_market_interp=EXCLUDED.objective_market_interp,
        objective_metric=EXCLUDED.objective_metric,
        preference_kpi=EXCLUDED.preference_kpi, preference_trend=EXCLUDED.preference_trend,
        preference_interp=EXCLUDED.preference_interp, preference_scatter=EXCLUDED.preference_scatter,
        preference_scatter_interp=EXCLUDED.preference_scatter_interp, preference_metric=EXCLUDED.preference_metric,
        cognition_kpi=EXCLUDED.cognition_kpi, cognition_trend=EXCLUDED.cognition_trend,
        cognition_interp=EXCLUDED.cognition_interp, cognition_dual_axis=EXCLUDED.cognition_dual_axis,
        cognition_dual_axis_interp=EXCLUDED.cognition_dual_axis_interp, cognition_metric=EXCLUDED.cognition_metric`,
      [
        c.id,
        JSON.stringify(o.kpi), JSON.stringify(o.trend), JSON.stringify(o.radar),
        JSON.stringify(o.modules), JSON.stringify(o.reasons), JSON.stringify(o.suggestions),
        o.trendInterp, o.radarInterp,
        JSON.stringify(obj.kpi), JSON.stringify(obj.trend), JSON.stringify(obj.months),
        JSON.stringify(obj.interp), JSON.stringify(obj.corr), obj.marketInterp,
        JSON.stringify(obj.metric),
        JSON.stringify(pref.kpi), JSON.stringify(pref.trend), JSON.stringify(pref.interp),
        JSON.stringify(pref.scatter), pref.scatterInterp, JSON.stringify(pref.metric),
        JSON.stringify(cog.kpi), JSON.stringify(cog.trend), JSON.stringify(cog.interp),
        JSON.stringify(cog.dualAxis), cog.dualAxisInterp, JSON.stringify(cog.metric),
      ]
    )
  }
  console.log(`✓ 已插入 ${CUSTOMERS.length} 条风险数据记录`)

  // 5d. 插入仪表盘统计
  const stats = [
    { label:'管理客户总数', value:'12,847', bg:'bg-blue-50', ic:'text-blue-500', change:'↑ 较上月 +3.2%', cc:'text-green-500', icon:'User', order:1 },
    { label:'已完成评估', value:'11,203', bg:'bg-green-50', ic:'text-green-500', change:'↑ 评估完成率 87.2%', cc:'text-green-500', icon:'CircleCheck', order:2 },
    { label:'风险预警数', value:'236', bg:'bg-red-50', ic:'text-red-500', change:'↑ 较上月 +12', cc:'text-red-500', icon:'Warning', order:3 },
    { label:'待处理工单', value:'48', bg:'bg-orange-50', ic:'text-orange-500', change:'↓ 较上月 -5', cc:'text-green-500', icon:'DataAnalysis', order:4 },
  ]
  for (const s of stats) {
    await pool.query(
      `INSERT INTO dashboard_stats (label, value, bg_class, icon_class, change_text, change_class, icon_name, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         label=EXCLUDED.label, value=EXCLUDED.value, bg_class=EXCLUDED.bg_class,
         icon_class=EXCLUDED.icon_class, change_text=EXCLUDED.change_text,
         change_class=EXCLUDED.change_class, icon_name=EXCLUDED.icon_name`,
      [s.label, s.value, s.bg, s.ic, s.change, s.cc, s.icon, s.order]
    )
  }
  console.log(`✓ 已插入 ${stats.length} 条仪表盘统计`)

  console.log('--- 数据库初始化完成 ---')
  await pool.end()
}

main().catch(err => {
  console.error('初始化失败:', err)
  process.exit(1)
})
