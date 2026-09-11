/*  seed.js — 轻量级数据初始化脚本
 *  用法:  node seed.js
 *  前提:  1) MySQL 已启动，数据库 suitability_db 已创建
 *         2) 已执行 sql/schema.sql 建表
 *         3) 已 npm install
 */
const pool = require('./src/db')
const fs = require('fs')
const path = require('path')

/* ================================================================
 * 1. 客户基础信息
 * ================================================================ */
const CUSTOMERS = [
  { id:'C00012857', name:'张景豪', nameEn:'Zhang Jinghao', ql:5, pl:3, assess:'2026-05-18', diff:-2 },
  { id:'C00012858', name:'王建国', nameEn:'Wang Jianguo', ql:4, pl:5, assess:'2026-06-10', diff: 1 },
  { id:'C00012859', name:'赵思远', nameEn:'Zhao Siyuan', ql:5, pl:3, assess:'2026-07-02', diff:-2 },
  { id:'C00012860', name:'陈晓明', nameEn:'Chen Xiaoming', ql:3, pl:5, assess:'2026-08-01', diff: 2 },
  { id:'C00008231', name:'张三',   nameEn:'Zhang San', ql:3, pl:3, assess:'2026-03-15', diff: 0 },
  { id:'C00008232', name:'李四',   nameEn:'Li Si', ql:4, pl:3, assess:'2026-04-20', diff:-1 },
]

const MONTHS = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
                '2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07预测']
const MONTHS_12 = MONTHS.slice(0, 12)

/* ================================================================
 * 2. 辅助函数
 * ================================================================ */
function qArr(val) { return Array(12).fill(val).concat([null]) }
function qPArr(val) { return Array(11).fill(null).concat([val, val]) }
function dArr(base, deltaPerMonth, endVal) {
  const arr = []
  for (let i = 0; i < 12; i++) arr.push(+(base + deltaPerMonth * i).toFixed(1))
  arr.push(endVal !== undefined ? endVal : arr[11])
  return arr
}
function dPArr(nullCount, ...vals) { return Array(nullCount).fill(null).concat(vals) }
function dConst(val) { return Array(12).fill(val).concat([val]) }
function makeTrend(qVals, dVals, qPVals, dPVals) {
  return { questionnaire: qVals, dynamic: dVals, dynamicPredict: dPVals, questionnairePredict: qPVals }
}
function makeSubTrend(q, d, qP, dP) { return { q, d, dP, qP } }

/* ================================================================
 * 3. 各客户完整数据生成器
 * ================================================================ */

function buildC00012857() {
  return {
    overview: {
      kpi: [
        { label:'最近问卷等级', value:'C5', valueClass:'text-red-500', sub:'2026-05-18 测评', subClass:'text-gray-400' },
        { label:'当前动态综合风险等级', value:'C3', valueClass:'text-primary-600', sub:'实时计算', subClass:'text-primary-400' },
        { label:'上月动态综合风险等级', value:'C4', valueClass:'text-gray-700', sub:'2026-04', subClass:'text-gray-400' },
        { label:'等级偏差', value:'-2', unit:'级', valueClass:'text-orange-500', sub:'问卷高于动态', subClass:'text-orange-400' },
        { label:'本月变化', value:'↓1', unit:'级', valueClass:'text-green-500', sub:'较上月下降', subClass:'text-green-400' },
      ],
      trend: makeTrend(qArr(5), [3.8,3.6,3.5,3.9,4.1,4.0,3.7,3.5,3.3,3.4,3.2,3.0,3.1], qPArr(5), dPArr(11, 3.0, 3.1)),
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
      reasonsEn: [
        { title:'Objective risk tolerance dropped sharply, dragging down the composite level', detail:'• Specific behavior: over the past 3 months, investable assets fell from 5.2M to 3.1M (down 40.4%) and the debt-to-income ratio rose from 0.8 to 1.3.\n• Behavior explanation: the notable asset shrinkage and tighter liquidity lowered the objective risk tolerance score from C3.5 to C2.6, pulling the composite level down 2 levels.' },
        { title:'Frequent high-risk derivatives trading triggered monitoring alerts', detail:'• Specific behavior: 12 derivative trades within the last 30 days exceeded the high-frequency high-risk trading threshold.\n• Behavior explanation: high-risk preference trading increased risk exposure, triggering system monitoring alerts and further lowering the dynamic rating.' },
        { title:'Questionnaire rating deviates sharply from actual trading preference', detail:'• Specific behavior: the questionnaire rated the customer C5 (Aggressive), but actual objective asset and liability indicators have deteriorated notably.\n• Behavior explanation: the "behavior/assets inconsistent with questionnaire" rule was triggered, revising the dynamic composite level down 2 levels to C3.' },
      ],
      trendInterp: '客户问卷评级保持在 <span class="text-red-500 font-semibold">C5 (进取型)</span>，但动态综合风险等级在近1年内从 C3.8 持续下行至 <span class="text-primary-600 font-semibold">C3.0</span>，出现 <span class="text-orange-500 font-semibold">-2级倒挂</span>。主要是由于近期资产大幅缩减与高风险杠杆操作引发风控预警，建议人工介入复核。',
      trendInterpEn: 'The customer questionnaire rating remains at <span class="text-red-500 font-semibold">C5 (Aggressive)</span>, but the dynamic composite risk level has declined from C3.8 to <span class="text-primary-600 font-semibold">C3.0</span> over the past year, a <span class="text-orange-500 font-semibold">-2 level inversion</span>. This is mainly caused by a sharp reduction in assets and high-risk leveraged operations triggering risk-control alerts; manual review is recommended.',
      radarInterp: '当前客观承受力(<span class="text-red-500 font-medium">C2.6</span>)相比上月进一步下滑；虽然风险偏好(<span class="text-green-600 font-medium">C4.3</span>)依然高企，但受客观能力与异常交易行为拖累，综合评估出现较大幅度下调。',
      radarInterpEn: 'Current objective tolerance (<span class="text-red-500 font-medium">C2.6</span>) declined further vs last month; although risk preference (<span class="text-green-600 font-medium">C4.3</span>) remains high, the overall assessment was revised down considerably due to objective capacity and abnormal trading behavior.',
      suggestions: [
        { title:'建议重新进行问卷评估', detail:'距离上次问卷已超过6个月，建议安排重新测评' },
        { title:'建议适当降低产品推荐等级', detail:'当前持有产品风险等级与动态风险承受力不匹配' },
        { title:'建议进行投资者教育回访', detail:'认知得分与实际行为存在偏差，建议安排专项回访' },
        { title:'触发合规审查流程', detail:'问卷等级与动态等级偏差达2级，需合规部门确认' },
      ],
      suggestionsEn: [
        { title:'Questionnaire reassessment recommended', detail:'Over 6 months have passed since the last questionnaire; scheduling a reassessment is recommended' },
        { title:'Lower the product recommendation level', detail:'The risk level of currently held products does not match the dynamic risk tolerance' },
        { title:'Conduct investor-education follow-up', detail:'Deviation exists between the cognition score and actual behavior; arranging a dedicated follow-up is recommended' },
        { title:'Trigger compliance review process', detail:'The deviation between the questionnaire and dynamic levels is 2 levels; confirmation by the compliance department is required' },
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
      trend: makeSubTrend(qArr(5), [3.1,3.0,2.9,3.2,3.3,3.2,2.8,2.7,2.6,2.7,2.6,2.6,null], qPArr(5), dPArr(11, 2.6, 2.4)),
      months: MONTHS,
      interp: { trendDesc:'近12个月客观风险承受力呈<span class="text-red-500 font-medium">下降</span>趋势，从C3.1降至C2.6', turningPoint:'2026-01起明显下降，与可投资资产大幅缩减高度相关', relationToQ:'问卷评定C5（保守型），客观仅C2.6（积极型），严重不一致', suggestion:'建议重新进行问卷评估并适当降低产品推荐等级' },
      interpEn: { trendDesc:'Objective risk tolerance shows a <span class="text-red-500 font-medium">downward</span> trend over the past 12 months, from C3.1 to C2.6', turningPoint:'A clear decline started in 2026-01, highly correlated with the sharp reduction in investable assets', relationToQ:'Questionnaire rated C5 (Conservative) while objective is only C2.6 (Aggressive) — seriously inconsistent', suggestion:'A questionnaire reassessment is recommended along with appropriately lowering the product recommendation level' },
      corr: { risk:[3.1,3.0,2.9,3.2,3.3,3.2,2.8,2.7,2.6,2.7,2.6,2.6], hs:[4200,4100,3950,4050,4150,4100,3850,3780,3700,3750,3680,3620] },
      marketInterp: '该客户客观得分对大盘表现出<span class="text-red-500 font-medium">高敏感度与放大效应</span>。由于客户高比例配置高风险权益产品（衍生品及高杠杆持仓），市场回调期间其可投资资产由 520 万骤降至 310 万（降幅40.4%），拖累客观风险得分自 C3.4 快速下滑至 C2.6，系统性风险暴露较为明显。',
      marketInterpEn: 'The customer objective score shows <span class="text-red-500 font-medium">high sensitivity and amplification</span> to the market. With a high allocation to high-risk equity products (derivatives and high-leverage positions), investable assets plunged from 5.2M to 3.1M (down 40.4%) during the correction, dragging the objective risk score quickly from C3.4 down to C2.6, with notable systemic risk exposure.',
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
      trend: makeSubTrend(qArr(5), [3.5,3.6,3.5,3.7,3.8,3.9,3.9,4.0,4.1,4.2,4.3,4.3,null], qPArr(5), dPArr(11, 4.3, 4.4)),
      interp: { trendDesc:'近12个月风险偏好呈<span class="text-green-500 font-medium">上升</span>趋势，从C3.5升至C4.3', turningPoint:'2026-02起快速上升，与高风险产品购买频率增加高度相关', relationToQ:'问卷评定C5（保守型），实际偏好C4.3（进取型），严重不一致', suggestion:'建议重新进行风险偏好问卷评估，确认客户真实偏好' },
      interpEn: { trendDesc:'Risk preference shows an <span class="text-green-500 font-medium">upward</span> trend over the past 12 months, from C3.5 to C4.3', turningPoint:'A rapid rise began in 2026-02, highly correlated with the increased frequency of high-risk product purchases', relationToQ:'Questionnaire rated C5 (Conservative) while actual preference is C4.3 (Aggressive) — seriously inconsistent', suggestion:'A risk preference questionnaire reassessment is recommended to confirm the customer\'s true preference' },
      scatter: [[12,3.5,20],[15,3.6,25],[18,3.5,22],[20,3.7,30],[14,3.8,18],[22,3.9,35],[25,3.9,28],[28,4.0,40],[30,4.1,32],[32,4.2,45],[35,4.3,38],[38,4.3,50]],
      scatterInterp: '散点图分布呈现明显的<span class="text-green-600 font-medium">正向扩张特征</span>。当市场波动率从 12% 增加至 38% 时，客户风险偏好由 C3.5 快速上升至 C4.3，且交易次数（气泡尺寸）急剧放大至 50 次。表明该客户属于典型的"越波动越活跃"的进取型投资者。',
      scatterInterpEn: 'The scatter distribution shows clear <span class="text-green-600 font-medium">positive expansion</span>. As market volatility rose from 12% to 38%, the customer risk preference climbed quickly from C3.5 to C4.3, with trading frequency (bubble size) surging to 50 trades. This reflects a classic aggressive investor of the "more volatility, more activity" type.',
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
      trend: makeSubTrend(qArr(5), [3.0,3.1,3.0,3.1,3.2,3.2,3.1,3.2,3.4,3.3,3.2,3.2,null], qPArr(5), dPArr(11, 3.2, 3.3)),
      interp: { trendDesc:'近12个月风险认知保持<span class="text-blue-500 font-medium">稳定</span>，维持在C3.2左右', turningPoint:'2026-03小幅提升至C3.4，因客户参加了投资知识培训课程', relationToQ:'问卷评定C5（保守型），认知得分C3.2（稳健型），偏差-1.8级', suggestion:'认知水平稳定，建议加强高风险产品知识教育以提升风险认知' },
      interpEn: { trendDesc:'Risk cognition has been <span class="text-blue-500 font-medium">stable</span> around C3.2 over the past 12 months', turningPoint:'A slight rise to C3.4 occurred in 2026-03 after the customer attended an investment knowledge training course', relationToQ:'Questionnaire rated C5 (Conservative) with cognition scored C3.2 (Balanced), a deviation of -1.8 levels', suggestion:'Cognition is stable; strengthening education on high-risk products is recommended to improve risk cognition' },
      dualAxis: { knowledge:[65,68,66,70,72,70,68,71,78,75,72,72], behavior:[8,10,9,12,14,13,15,16,12,14,15,16] },
      dualAxisInterp: '客户在 2026-03 参加培训后<span class="text-blue-600 font-medium">知识得分</span>跃升至 78 分，但随后<span class="text-amber-600 font-medium">产品行为频次</span>出现小幅波动后回落至 16 次/月，表明知识转化为实际高频交易的意愿整体趋于理性。',
      dualAxisInterpEn: 'After the customer attended training in 2026-03, the <span class="text-blue-600 font-medium">knowledge score</span> jumped to 78, but the <span class="text-amber-600 font-medium">product behavior frequency</span> fluctuated slightly before settling back to 16 trades/month, indicating that converting knowledge into high-frequency trading has become more rational overall.',
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
      reasonsEn: [
        { title:'Actual risk preference consistently exceeds the questionnaire rating, raising the dynamic level', detail:'• Specific behavior: the customer frequently traded high-risk products, buying R4-and-above products 7 times in the last 60 days.\n• Behavior explanation: the subjective risk preference score soared to C4.8, driving the dynamic level up to C5 (1 level above the questionnaire).' },
      ],
      trendInterp: '客户问卷评估为 <span class="text-yellow-600 font-semibold">C4</span>，但其动态综合风险等级呈现连续抬升趋势，已由 C3.2 上升至 <span class="text-primary-600 font-semibold">C5.0</span>，表现出高出问卷 <span class="text-orange-500 font-semibold">+1级</span> 的交易热度与风险偏好。',
      trendInterpEn: 'The customer questionnaire assessment is <span class="text-yellow-600 font-semibold">C4</span>, but the dynamic composite risk level shows a continuous upward trend, rising from C3.2 to <span class="text-primary-600 font-semibold">C5.0</span>, reflecting trading enthusiasm and risk preference <span class="text-orange-500 font-semibold">+1 level</span> above the questionnaire.',
      radarInterp: '客观承受力(<span class="text-green-600 font-medium">C4.5</span>)与风险偏好(<span class="text-green-600 font-medium">C4.8</span>)较上月均有明显扩张，各项维度均达到高风险承受水平，建议同步上调问卷评级。',
      radarInterpEn: 'Objective tolerance (<span class="text-green-600 font-medium">C4.5</span>) and risk preference (<span class="text-green-600 font-medium">C4.8</span>) both expanded notably vs last month, with all dimensions at high-risk tolerance levels; raising the questionnaire rating accordingly is recommended.',
      suggestions: [
        { title:'建议上调问卷风险等级', detail:'实际行为显示客户风险偏好已提升，建议重新测评' },
        { title:'建议关注持仓集中度', detail:'单一高风险产品持仓占比达45%，需提示风险' },
      ],
      suggestionsEn: [
        { title:'Raise the questionnaire risk level', detail:'Actual behavior shows the customer risk preference has increased; a reassessment is recommended' },
        { title:'Pay attention to holding concentration', detail:'A single high-risk product accounts for 45% of holdings; the risk should be flagged' },
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
      interpEn: { trendDesc:'Objective risk tolerance shows an <span class="text-green-500 font-medium">upward</span> trend over the past 12 months, from C3.5 to C4.5', turningPoint:'A steady rise began in 2026-01, highly correlated with sustained asset growth', relationToQ:'Questionnaire rated C4 (Moderate) and objective C4.5 (Aggressive) — basically consistent', suggestion:'Risk tolerance is sound; maintaining the current product recommendation level is recommended' },
      corr: { risk:[3.5,3.6,3.7,3.8,3.9,4.0,4.1,4.2,4.3,4.4,4.5,4.5], hs:[3800,3850,3920,3980,4050,4100,4180,4250,4300,4350,4400,4450] },
      marketInterp: '该客户客观得分与大盘走势呈<span class="text-green-600 font-medium">逆势增长/独立行情</span>。尽管沪深300指数总体处于震荡筑底阶段，但该客户因主营业务现金流持续注入及低位加仓高股息资产，可投资资产不降反升，推动客观风险承受得分由 C4.0 稳步增长至 C4.5。',
      marketInterpEn: 'The customer objective score shows <span class="text-green-600 font-medium">counter-trend growth / independent movement</span> vs the market. Although the CSI 300 has been in a bottoming range, steady cash flow from the main business and adding to high-dividend assets at low levels lifted investable assets instead of lowering them, driving the objective risk tolerance score from C4.0 to C4.5.',
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
      interpEn: { trendDesc:'Risk preference shows a <span class="text-green-500 font-medium">rapidly rising</span> trend over the past 12 months, from C3.8 to C4.8', turningPoint:'Acceleration began in 2026-01, with noticeably higher derivative trading frequency', relationToQ:'Questionnaire rated C4 (Moderate) while actual preference is C4.8 (Aggressive), a deviation of +0.8 levels', suggestion:'Raising the questionnaire risk level is recommended; actual behavior already shows an aggressive preference' },
      scatter: [[10,4.0,15],[12,4.1,18],[14,4.0,20],[16,4.2,22],[18,4.3,25],[20,4.4,28],[22,4.5,30],[24,4.6,32],[26,4.5,35],[28,4.6,38],[30,4.7,40],[32,4.8,42]],
      scatterInterp: '散点分布呈现<span class="text-purple-600 font-medium">高偏好高频次聚集</span>。波动率在 10%~32% 波动过程中，客户风险偏好持续上攀至 C4.8，交易频率密集（气泡多在 30~42 次）。表明其交易行为受外部市场波动干扰小，主要由其自身积极加仓激进产品的投资意向驱动。',
      scatterInterpEn: 'The scatter distribution shows <span class="text-purple-600 font-medium">high-preference, high-frequency clustering</span>. As volatility moved within 10%-32%, the customer risk preference climbed steadily to C4.8 with dense trading frequency (bubbles mostly at 30-42 trades). Trading behavior is barely disturbed by external market swings and is mainly driven by the customer&#39;s own intent to actively add to aggressive products.',
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
      interpEn: { trendDesc:'Risk cognition shows a <span class="text-blue-500 font-medium">slightly rising</span> trend over the past 12 months, from C3.5 to C4.0', turningPoint:'Gradual improvement began in 2026-02, related to proactive learning of investment knowledge', relationToQ:'Questionnaire rated C4 (Moderate) and cognition scored C4.0 (Moderate) — fully consistent', suggestion:'Cognition level is good; maintaining the current learning pace is recommended' },
      dualAxis: { knowledge:[70,72,74,75,78,76,80,82,85,83,86,88], behavior:[10,12,14,15,18,16,20,22,18,20,22,24] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>从 70 分一路攀升至 88 分的高位，带动<span class="text-amber-600 font-medium">产品行为频次</span>从 10 次/月显著增加至 24 次/月。表现出强烈的学习意愿与极高的交易转化率，知行同步提升。',
      dualAxisInterpEn: 'The customer <span class="text-blue-600 font-medium">knowledge score</span> climbed from 70 to a high of 88, driving the <span class="text-amber-600 font-medium">product behavior frequency</span> from 10 to 24 trades/month. This reflects a strong willingness to learn and a very high trading conversion rate, with knowledge and behavior improving in sync.',
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
      reasonsEn: [
        { title:'Objective assets and experience do not support the highest C5 rating', detail:'• Specific behavior: the customer objective asset scale can only support a moderate risk level, with only 3 years of actual investment experience.\n• Behavior explanation: the objective tolerance score is only C3.0, clearly deviating from the questionnaire C5 and lowering the composite dynamic level.' },
      ],
      trendInterp: '客户问卷填报为最高的 <span class="text-red-500 font-semibold">C5</span> 级，但近12个月动态综合风险等级长期横盘在 <span class="text-primary-600 font-semibold">C3.2 左右</span>，偏差达 <span class="text-orange-500 font-semibold">-2级</span>。主要因其客观资产规模与投资年限无法支撑 C5 的激进评级。',
      trendInterpEn: 'The customer reported the highest <span class="text-red-500 font-semibold">C5</span> level on the questionnaire, but the dynamic composite risk level has been flat around <span class="text-primary-600 font-semibold">C3.2</span> for the past 12 months, a deviation of <span class="text-orange-500 font-semibold">-2 levels</span>. This is mainly because the objective asset scale and investment history cannot support the aggressive C5 rating.',
      radarInterp: '各项能力维度非常平稳，风险认知(<span class="text-blue-600 font-medium">C3.8</span>)良好，但客观承受力(<span class="text-blue-600 font-medium">C3.0</span>)偏低，呈典型"认知高于实际承受力"的特征。',
      radarInterpEn: 'All capability dimensions are very stable. Risk cognition (<span class="text-blue-600 font-medium">C3.8</span>) is good, but objective tolerance (<span class="text-blue-600 font-medium">C3.0</span>) is low, showing the typical "cognition higher than actual tolerance" pattern.',
      suggestions: [
        { title:'建议下调问卷风险等级至C3', detail:'客观资产与投资经验均不支持C5评级' },
        { title:'建议安排风险承受力专项评估', detail:'问卷与客观指标偏差达2级，需专项复核' },
      ],
      suggestionsEn: [
        { title:'Lower the questionnaire risk level to C3', detail:'Neither objective assets nor investment experience support a C5 rating' },
        { title:'Arrange a dedicated risk tolerance assessment', detail:'The questionnaire/objective deviation is 2 levels; a dedicated review is needed' },
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
      interpEn: { trendDesc:'Objective risk tolerance has been <span class="text-gray-500 font-medium">basically stable</span> around C3.2 over the past 12 months', turningPoint:'Overall stable with no clear turning point; asset scale has remained steady', relationToQ:'Questionnaire rated C5 (Conservative) while objective is only C3.0 (Balanced), a deviation of -2 levels', suggestion:'Lowering the questionnaire risk level to C3 and arranging a special assessment is recommended' },
      corr: { risk:[3.5,3.4,3.3,3.2,3.3,3.4,3.3,3.2,3.1,3.2,3.2,3.2], hs:[3950,3820,3780,3900,4020,3980,3720,3650,3580,3620,3550,3520] },
      marketInterp: '该客户客观得分与大盘走势<span class="text-blue-600 font-medium">高度贴合</span>。其持仓结构以大盘蓝筹指数基金为主，客观得分基本随沪深300指数的起伏在 C3.0~C3.2 区间微幅波动，资产弹性较好，无超额波动风险。',
      marketInterpEn: 'The customer objective score closely <span class="text-blue-600 font-medium">tracks the market</span>. With a holding structure dominated by large-cap blue-chip index funds, the objective score moves narrowly within the C3.0-C3.2 range along with the CSI 300 index, showing good asset resilience and no excess volatility risk.',
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
      interpEn: { trendDesc:'Risk preference has been <span class="text-blue-500 font-medium">basically stable</span> around C3.5 over the past 12 months', turningPoint:'No clear turning point; product purchasing behavior is fairly balanced', relationToQ:'Questionnaire rated C5 (Conservative) while actual preference is C3.5 (Balanced), a deviation of -1.5 levels', suggestion:'Lowering the questionnaire rating to C3 is recommended; actual preference is not aggressive' },
      scatter: [[8,3.5,10],[10,3.4,12],[12,3.5,14],[14,3.6,16],[16,3.5,18],[18,3.4,15],[20,3.5,20],[22,3.6,18],[24,3.5,22],[26,3.4,20],[28,3.5,24],[30,3.6,22]],
      scatterInterp: '散点集中分布于 <span class="text-blue-600 font-medium">C3.4~C3.6 水平横轴</span>，且气泡尺寸均匀（10~24 次）。无论市场波动率在 8% 到 30% 之间如何变化，客户的偏好评分与购买行为均无剧烈波动，表现出强抗干扰能力与明确的自我定力。',
      scatterInterpEn: 'The scatter points concentrate along a <span class="text-blue-600 font-medium">horizontal axis between C3.4 and C3.6</span>, with even bubble sizes (10-24 trades). No matter how market volatility changes between 8% and 30%, the customer preference score and purchase behavior barely fluctuate, showing strong resilience and clear self-discipline.',
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
      interpEn: { trendDesc:'Risk cognition has been <span class="text-blue-500 font-medium">basically stable</span> around C3.7 over the past 12 months', turningPoint:'No clear turning point; investment knowledge test scores are moderate-to-above', relationToQ:'Questionnaire rated C5 (Conservative) and cognition scored C3.8 (Balanced), a deviation of -1.2 levels', suggestion:'Cognition level is moderate; arranging special investment knowledge training is recommended' },
      dualAxis: { knowledge:[60,62,64,66,68,70,68,72,74,72,75,76], behavior:[6,8,7,10,12,11,14,15,12,14,15,14] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">投资知识得分</span>稳步升至 76 分，但<span class="text-amber-600 font-medium">产品行为频次</span>长期维持在 12-15 次/月的较低水平。呈现"重知识积累、轻频繁操作"的稳健审慎型特征。',
      dualAxisInterpEn: 'The customer <span class="text-blue-600 font-medium">investment knowledge score</span> rose steadily to 76, while the <span class="text-amber-600 font-medium">product behavior frequency</span> stayed at a low 12-15 trades/month. This shows a prudent, stable profile that favors knowledge accumulation over frequent trading.',
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
      reasonsEn: [
        { title:'Actual risk preference is aggressive, far exceeding the questionnaire and deviating the dynamic level by 2', detail:'• Specific behavior: the questionnaire was filled as C3 Moderate, but actual trading frequency and risk preference indicators have fully reached the aggressive C5 level.\n• Behavior explanation: the surge in subjective preference and actual behavior drove the dynamic level 2 levels above the questionnaire.' },
        { title:'Derivatives and high-leverage holdings are highly concentrated, with excessive risk exposure', detail:'• Specific behavior: derivatives and leveraged ETFs account for 52% of holdings, with 38 trades in the last 30 days.\n• Behavior explanation: high-leverage holdings sharply raised overall risk exposure, and high-frequency trading triggered a high-attention abnormal-behavior alert.' },
      ],
      trendInterp: '客户静态问卷为 <span class="text-blue-600 font-semibold">C3</span>，但近一年动态风险等级直线上升至 <span class="text-primary-600 font-semibold">C5.0</span>，呈现极强的正向偏离（<span class="text-orange-500 font-semibold">+2级</span>）。反映其近期发生了剧烈的激进投资行为转型。',
      trendInterpEn: 'The customer static questionnaire is <span class="text-blue-600 font-semibold">C3</span>, but the dynamic risk level over the past year rose straight to <span class="text-primary-600 font-semibold">C5.0</span>, showing an extremely strong positive deviation (<span class="text-orange-500 font-semibold">+2 levels</span>). This reflects a dramatic shift to aggressive investing in the recent period.',
      radarInterp: '风险偏好飙升至极限值 <span class="text-green-600 font-medium">C5.0</span>，客观承受力(<span class="text-green-600 font-medium">C4.8</span>)大幅强于上月，但伴随高杠杆衍生品操作，导致异常行为控制维度风险敞口快速放大。',
      radarInterpEn: 'Risk preference soared to the limit value of <span class="text-green-600 font-medium">C5.0</span>, and objective tolerance (<span class="text-green-600 font-medium">C4.8</span>) is far stronger than last month, but heavy leveraged derivative operations have rapidly expanded the risk exposure in the abnormal-behavior dimension.',
      suggestions: [
        { title:'强烈建议重新问卷评估', detail:'偏差达2级，当前问卷已无法反映真实风险偏好' },
        { title:'建议限制杠杆产品买入', detail:'高杠杆产品占比过高，需进行适当性提示' },
        { title:'触发合规审查', detail:'问卷与动态偏差达2级，需合规部门专项审查' },
      ],
      suggestionsEn: [
        { title:'Strongly recommend questionnaire reassessment', detail:'The deviation is 2 levels; the current questionnaire can no longer reflect the true risk preference' },
        { title:'Restrict purchases of leveraged products', detail:'The high proportion of high-leverage products requires suitability warnings' },
        { title:'Trigger compliance review', detail:'A questionnaire/dynamic deviation of 2 levels requires a dedicated review by the compliance department' },
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
      interpEn: { trendDesc:'Objective risk tolerance shows a <span class="text-green-500 font-medium">rapidly rising</span> trend over the past 12 months, from C3.2 to C4.8', turningPoint:'Acceleration began in 2025-10, related to a substantial increase in investable assets', relationToQ:'Questionnaire rated C3 (Moderate) while objective is C4.8 (Aggressive) — seriously inconsistent', suggestion:'A questionnaire reassessment is recommended; current objective tolerance far exceeds the questionnaire rating' },
      corr: { risk:[3.2,3.4,3.5,3.7,3.9,4.1,4.3,4.5,4.6,4.7,4.8,4.8], hs:[3600,3650,3700,3780,3850,3920,4000,4080,4150,4200,4280,4350] },
      marketInterp: '该客户客观得分与大盘走势呈<span class="text-purple-600 font-medium">强顺周期扩张性</span>。大盘微幅反弹期间，客户通过高杠杆交易获得了超额资本增值，可投资资产大幅提升，驱动客观得分由 C3.5 快速上升至 C4.8。需注意大盘一旦回调可能引发的杠杆资产加速穿仓风险。',
      marketInterpEn: 'The customer objective score shows <span class="text-purple-600 font-medium">strong pro-cyclical expansion</span> relative to the market. During the mild market rebound, leveraged trading generated excess capital gains, sharply lifting investable assets and driving the objective score from C3.5 to C4.8. Note the risk of accelerated forced liquidation of leveraged assets should the market correct.',
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
      interpEn: { trendDesc:'Risk preference shows a <span class="text-red-500 font-medium">rapidly rising</span> trend over the past 12 months, from C4.0 to C5.0', turningPoint:'Acceleration began in 2025-12, with a sharp increase in derivatives and leveraged products', relationToQ:'Questionnaire rated C3 (Moderate) while actual preference is C5.0 (Aggressive) — seriously inconsistent', suggestion:'A questionnaire reassessment is strongly recommended; actual preference has reached the highest level' },
      scatter: [[15,4.0,20],[18,4.2,25],[20,4.3,28],[22,4.4,32],[24,4.5,35],[26,4.6,38],[28,4.7,42],[30,4.8,45],[32,4.9,48],[34,5.0,50],[36,5.0,52],[38,5.0,55]],
      scatterInterp: '散点图向右上角<span class="text-red-500 font-medium">强烈倾斜与扩张</span>。随着市场波动率提升至 38%，风险偏好封顶至 C5.0，购买频次飙升至 55 次（最大气泡）。反映客户具有极高的风险偏好和极强的抄底/加杠杆交易欲望，需重点防范高波动下的穿仓风险。',
      scatterInterpEn: 'The scatter plot <span class="text-red-500 font-medium">tilts and expands strongly</span> toward the upper right. As market volatility climbed to 38%, risk preference topped out at C5.0 and purchase frequency surged to 55 trades (the largest bubble). This reflects an extremely high risk appetite and a strong desire for bottom-fishing/leveraged trading; the forced-liquidation risk under high volatility must be strictly guarded.',
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
      interpEn: { trendDesc:'Risk cognition shows an <span class="text-blue-500 font-medium">upward</span> trend over the past 12 months, from C3.5 to C4.2', turningPoint:'Continuous improvement began in 2026-01, with the customer actively attending multiple investor-education activities', relationToQ:'Questionnaire rated C3 (Moderate) with cognition scored C4.2 (upper Moderate), a deviation of +1.2 levels', suggestion:'Cognition level is fairly high; re-evaluating the questionnaire to match actual cognition is recommended' },
      dualAxis: { knowledge:[72,74,76,78,80,82,84,86,88,90,92,94], behavior:[12,14,16,18,20,22,24,26,22,24,26,28] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>突破 90 分达到 94 分，<span class="text-amber-600 font-medium">产品行为频次</span>也随之飙升至 28 次/月。知识储备的爆发式增长显著激发了复杂产品的交易行为，建议关注其高频交易的风控限制。',
      dualAxisInterpEn: 'The customer <span class="text-blue-600 font-medium">knowledge score</span> broke 90 and reached 94, and the <span class="text-amber-600 font-medium">product behavior frequency</span> correspondingly surged to 28 trades/month. The explosive growth in knowledge has notably stimulated trading in complex products; attention should be paid to risk-control limits on high-frequency trading.',
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
      reasonsEn: [
        { title:'Metrics operating smoothly, no risk downgrade reasons currently', detail:'• Specific behavior: over the past 12 months, asset scale, holding structure and trading behavior have been highly consistent with the questionnaire.\n• Behavior explanation: the dynamic composite level (C3) fully matches the questionnaire level (C3); no risk-control downgrade rule was triggered.' },
      ],
      trendInterp: '问卷测评结果（<span class="text-blue-600 font-semibold">C3</span>）与近12个月动态综合风险走势（<span class="text-primary-600 font-semibold">C3.1</span>）高度重合，偏差为 <span class="text-green-600 font-semibold">0级</span>，表现出极高的画像匹配度与行为稳定性。',
      trendInterpEn: 'The questionnaire result (<span class="text-blue-600 font-semibold">C3</span>) highly coincides with the 12-month dynamic composite risk trend (<span class="text-primary-600 font-semibold">C3.1</span>), with a deviation of <span class="text-green-600 font-semibold">0 levels</span>, reflecting extremely high profile matching and behavioral stability.',
      radarInterp: '四维能力分布均衡且与上月基本持平，客观承受力(<span class="text-blue-600 font-medium">C3.2</span>)、风险偏好(<span class="text-blue-600 font-medium">C3.0</span>)均在中等稳健区间，无异常风险暴露。',
      radarInterpEn: 'The four capability dimensions are balanced and essentially flat vs last month; objective tolerance (<span class="text-blue-600 font-medium">C3.2</span>) and risk preference (<span class="text-blue-600 font-medium">C3.0</span>) are both in the moderate-stable range, with no abnormal risk exposure.',
      suggestions: [
        { title:'建议维持当前风险评级', detail:'问卷与动态一致，无需调整' },
        { title:'建议定期回访跟进', detail:'建议每季度进行一次适当性回访' },
      ],
      suggestionsEn: [
        { title:'Maintain the current risk rating', detail:'Questionnaire and dynamic levels are consistent; no adjustment needed' },
        { title:'Schedule regular follow-up visits', detail:'A suitability follow-up once per quarter is recommended' },
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
      interpEn: { trendDesc:'Objective risk tolerance has been <span class="text-blue-500 font-medium">basically stable</span> around C3.1 over the past 12 months', turningPoint:'No clear turning point; asset scale remains stable', relationToQ:'Questionnaire rated C3 (Moderate) and objective C3.2 (Moderate) — basically consistent', suggestion:'No adjustment needed; maintaining the current rating with regular follow-ups is recommended' },
      corr: { risk:[3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1], hs:[3900,3850,3880,3920,3950,3900,3850,3880,3920,3880,3850,3860] },
      marketInterp: '该客户客观风险得分与沪深300指数走势呈现<span class="text-blue-600 font-medium">低相关性</span>。由于客户资产主要集中于货币基金与低风险固收类理财（流动性资金占50%），受大盘权益市场波动冲击极小，客观风险承受能力始终稳定在 C3.1 左右，具备较强的抗市场系统性风险能力。',
      marketInterpEn: 'The customer objective risk score shows <span class="text-blue-600 font-medium">low correlation</span> with the CSI 300 index. Since assets are concentrated in money-market funds and low-risk fixed-income products (liquid funds at 50%), the impact of equity market swings is minimal, and objective risk tolerance stays stable around C3.1, showing strong resistance to systemic market risk.',
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
      interpEn: { trendDesc:'Risk preference has been <span class="text-blue-500 font-medium">basically stable</span> around C3.0 over the past 12 months', turningPoint:'No clear turning point; product purchasing behavior is balanced', relationToQ:'Questionnaire rated C3 (Moderate) and actual preference C3.0 (Moderate) — fully consistent', suggestion:'No adjustment needed; maintaining the current rating with continued observation is recommended' },
      scatter: [[8,3.0,10],[10,3.1,12],[12,3.0,14],[14,3.1,13],[16,3.0,15],[18,3.1,14],[20,3.0,16],[22,3.0,15],[24,3.1,17],[26,3.0,16],[28,3.0,18],[30,3.1,17]],
      scatterInterp: '散点图分布显示，该客户在市场波动率从 8% 上升至 30% 期间，其风险偏好稳定在 <span class="text-blue-600 font-medium">C3.0 左右</span>，购买频次（气泡大小）保持在 10~18 次平稳区间。表明客户对市场波动不敏感，不存在追涨杀跌行为，具备极高理性的稳健投资习惯。',
      scatterInterpEn: 'The scatter distribution shows that as market volatility rose from 8% to 30%, the customer risk preference stayed stable around <span class="text-blue-600 font-medium">C3.0</span>, with purchase frequency (bubble size) in the steady 10-18 range. This indicates the customer is insensitive to market swings, avoids chase-rise-sell-fall behavior, and maintains a highly rational, steady investment style.',
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
      interpEn: { trendDesc:'Risk cognition has been <span class="text-blue-500 font-medium">basically stable</span> around C3.5 over the past 12 months', turningPoint:'No clear turning point; investment knowledge test scores remain stable', relationToQ:'Questionnaire rated C3 (Moderate) and cognition scored C3.5 (Moderate) — basically consistent', suggestion:'No adjustment needed; regularly attending investor-education activities to maintain the cognition level is recommended' },
      dualAxis: { knowledge:[68,70,72,70,74,72,70,72,74,72,73,74], behavior:[8,10,12,10,14,12,14,16,12,14,14,16] },
      dualAxisInterp: '客户的<span class="text-blue-600 font-medium">投资知识得分</span>稳定在 70-74 分区间，<span class="text-amber-600 font-medium">产品行为频次</span>保持在 10-16 次/月的温和水平。知识储备与实际投资行为高度匹配，未出现"盲目交易"或"知行不一"现象。',
      dualAxisInterpEn: 'The customer <span class="text-blue-600 font-medium">investment knowledge score</span> stays stable in the 70-74 range, with the <span class="text-amber-600 font-medium">product behavior frequency</span> at a moderate 10-16 trades/month. Knowledge and actual investment behavior are highly consistent, with no blind trading or inconsistency between knowledge and behavior.',
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
      reasonsEn: [
        { title:'Slight reduction in investable assets, objective tolerance marginally lowered', detail:'• Specific behavior: investable assets fell from 2.8M to 2.2M in the past 2 months, narrowing the capital buffer.\n• Behavior explanation: objective risk tolerance was marginally adjusted from C3.3 to C3.0, driving the dynamic level down 1 level.' },
        { title:'Proactively reduced high-risk positions, composite level returns to C3', detail:'• Specific behavior: the high-risk holding ratio was voluntarily reduced from 35% to 22%, and trading preference has converged.\n• Behavior explanation: the customer voluntarily lowered their actual risk preference, adjusting the composite dynamic level from C4 to C3.' },
      ],
      trendInterp: '客户问卷等级为 <span class="text-yellow-600 font-semibold">C4</span>，近12个月动态风险等级由 C4.0 缓步下行至 <span class="text-primary-600 font-semibold">C3.3</span>，存在 <span class="text-orange-500 font-semibold">-1级</span> 的微幅回落，整体属于受资产波动影响的正常调整。',
      trendInterpEn: 'The customer questionnaire level is <span class="text-yellow-600 font-semibold">C4</span>; the dynamic risk level eased from C4.0 to <span class="text-primary-600 font-semibold">C3.3</span> over 12 months, a mild decline of <span class="text-orange-500 font-semibold">-1 level</span>, overall a normal adjustment driven by asset fluctuation.',
      radarInterp: '客观承受力(<span class="text-red-500 font-medium">C3.0</span>)和风险偏好(<span class="text-red-500 font-medium">C3.5</span>)较上月均有轻微收缩，反映客户在资产变动后自主采取了相对保守的避险策略。',
      radarInterpEn: 'Objective tolerance (<span class="text-red-500 font-medium">C3.0</span>) and risk preference (<span class="text-red-500 font-medium">C3.5</span>) both contracted slightly vs last month, reflecting the customer self-driven shift to a relatively conservative hedging strategy after the asset change.',
      suggestions: [
        { title:'建议关注资产变动原因', detail:'资产下降原因需进一步了解' },
        { title:'建议维持当前问卷评级', detail:'偏差仅1级，暂不需强制重新测评' },
      ],
      suggestionsEn: [
        { title:'Investigate the cause of asset changes', detail:'The cause of the asset decline needs further investigation' },
        { title:'Maintain the current questionnaire rating', detail:'The deviation is only 1 level; a forced reassessment is not needed for now' },
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
      interpEn: { trendDesc:'Objective risk tolerance shows a <span class="text-red-500 font-medium">slight decline</span> over the past 12 months, from C3.5 to C3.0', turningPoint:'A gradual decline began in 2026-01, related to the reduction in investable assets', relationToQ:'Questionnaire rated C4 (Moderate) and objective C3.0 (Moderate), a deviation of -1 level', suggestion:'Monitoring the cause of the asset change is recommended; a forced reassessment is not needed for now' },
      corr: { risk:[3.5,3.4,3.3,3.4,3.3,3.2,3.3,3.2,3.1,3.2,3.1,3.0], hs:[4000,3950,3880,3920,3850,3800,3750,3720,3680,3700,3650,3600] },
      marketInterp: '该客户客观得分与大盘存在<span class="text-orange-500 font-medium">中度正相关性</span>。随着近期大盘指数从 4,100 点回落至 3,900 点，客户持有的权益类资产市值缩水近 60 万，导致客观风险承受得分从 C3.3 微降至 C3.0。市场波动是导致其客观得分下调的主要外部因素。',
      marketInterpEn: 'The customer objective score shows <span class="text-orange-500 font-medium">moderate positive correlation</span> with the market. As the market index fell from about 4,100 to 3,900, the equity assets in the portfolio lost nearly 0.6M in value, lowering the objective risk tolerance score from C3.3 to C3.0. Market volatility is the main external factor behind the downgrade.',
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
      interpEn: { trendDesc:'Risk preference shows a <span class="text-blue-500 font-medium">slight decline</span> over the past 12 months, from C3.8 to C3.5', turningPoint:'A gradual decline began in 2026-02, with fewer high-risk product purchases', relationToQ:'Questionnaire rated C4 (Moderate) and actual preference C3.5 (Moderate), a deviation of -0.5 levels', suggestion:'The deviation is small; maintaining the current rating with continued observation is recommended' },
      scatter: [[8,3.8,10],[10,3.7,12],[12,3.6,14],[14,3.7,13],[16,3.6,15],[18,3.5,14],[20,3.6,16],[22,3.5,15],[24,3.5,14],[26,3.5,16],[28,3.5,14],[30,3.5,15]],
      scatterInterp: '散点图呈现<span class="text-orange-500 font-medium">弱负相关性</span>。随着市场波动率从 8% 攀升至 30%，客户的风险偏好从 C3.8 逐步回落至 C3.5，且气泡大小有所收缩。说明行情波动加大时，客户风险偏好有所收敛，偏向避险并小幅减少产品交易频率。',
      scatterInterpEn: 'The scatter plot shows <span class="text-orange-500 font-medium">weak negative correlation</span>. As market volatility climbed from 8% to 30%, the customer risk preference eased from C3.8 to C3.5, with bubble sizes shrinking. This indicates that when the market becomes more volatile, the customer risk preference converges toward risk avoidance and product trading frequency declines slightly.',
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
      interpEn: { trendDesc:'Risk cognition has been <span class="text-blue-500 font-medium">basically stable</span> around C3.2 over the past 12 months', turningPoint:'No clear turning point; investment knowledge test scores are moderate', relationToQ:'Questionnaire rated C4 (Moderate) and cognition scored C3.2 (Moderate), a deviation of -0.8 levels', suggestion:'The deviation is small; maintaining the current rating and encouraging attendance at investor-education activities are recommended' },
      dualAxis: { knowledge:[62,64,63,66,68,67,65,68,70,68,72,70], behavior:[6,8,7,10,12,11,10,12,14,12,14,12] },
      dualAxisInterp: '客户<span class="text-blue-600 font-medium">知识得分</span>由 62 分缓慢提升至 70 分，同时<span class="text-amber-600 font-medium">产品行为频次</span>从 6 次稳步增至 12 次/月。知识积累有效驱动了产品交易活跃度的提升，行为拓展节奏平稳。',
      dualAxisInterpEn: 'The customer <span class="text-blue-600 font-medium">knowledge score</span> rose slowly from 62 to 70, while the <span class="text-amber-600 font-medium">product behavior frequency</span> increased steadily from 6 to 12 trades/month. Knowledge accumulation has effectively driven higher product trading activity, with a steady pace of behavioral expansion.',
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
 * 5. 辅助函数：确保列存在（兼容已存在的旧表结构）
 * ================================================================ */
async function ensureColumn(table, column, definition) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  )
  if (!Number(row.cnt)) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

/* ================================================================
 * 6. 主流程
 * ================================================================ */
async function main() {
  console.log('--- 开始初始化数据库 ---')
  try {
    // 6a. 执行建表 SQL
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'sql', 'schema.sql'),
      'utf-8'
    )
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    for (const stmt of statements) {
      await pool.query(stmt)
    }
    console.log('✓ 表结构已创建/更新')

    // 6b. 兼容旧库：补齐新增的多语言列
    await ensureColumn('customers', 'name_en', "VARCHAR(80) DEFAULT ''")
    await ensureColumn('customer_risk_data', 'overview_trend_interp_en', 'VARCHAR(1000) DEFAULT \'\'')
    await ensureColumn('customer_risk_data', 'overview_radar_interp_en', 'VARCHAR(1000) DEFAULT \'\'')
    await ensureColumn('customer_risk_data', 'overview_reasons_en', 'JSON NOT NULL DEFAULT (JSON_OBJECT())')
    await ensureColumn('customer_risk_data', 'overview_suggestions_en', 'JSON NOT NULL DEFAULT (JSON_OBJECT())')
    await ensureColumn('customer_risk_data', 'objective_market_interp_en', 'VARCHAR(1000) DEFAULT \'\'')
    await ensureColumn('customer_risk_data', 'preference_scatter_interp_en', 'VARCHAR(1000) DEFAULT \'\'')
    await ensureColumn('customer_risk_data', 'cognition_dual_axis_interp_en', 'VARCHAR(1000) DEFAULT \'\'')
    await ensureColumn('customer_risk_data', 'objective_interp_en', 'JSON NOT NULL DEFAULT (JSON_OBJECT())')
    await ensureColumn('customer_risk_data', 'preference_interp_en', 'JSON NOT NULL DEFAULT (JSON_OBJECT())')
    await ensureColumn('customer_risk_data', 'cognition_interp_en', 'JSON NOT NULL DEFAULT (JSON_OBJECT())')
    console.log('✓ 新增多语言列已就绪')

    // 6c. 插入 customers 表
    for (const c of CUSTOMERS) {
      await pool.query(
        `INSERT INTO customers (id, name, name_en, questionnaire_level, predict_level, assess_time, level_diff)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), name_en=VALUES(name_en),
           questionnaire_level=VALUES(questionnaire_level),
           predict_level=VALUES(predict_level), assess_time=VALUES(assess_time),
           level_diff=VALUES(level_diff)`,
        [c.id, c.name, c.nameEn, c.ql, c.pl, c.assess, c.diff]
      )
    }
    console.log(`✓ 已插入 ${CUSTOMERS.length} 条客户记录`)

    // 6d. 插入 customer_risk_data 表
    for (const c of CUSTOMERS) {
      const data = BUILDERS[c.id]()
      const o = data.overview
      const obj = data.objective
      const pref = data.preference
      const cog = data.cognition

      const cols = [
        'customer_id',
        'overview_kpi', 'overview_trend', 'overview_radar', 'overview_modules',
        'overview_reasons', 'overview_reasons_en', 'overview_suggestions', 'overview_suggestions_en',
        'overview_trend_interp', 'overview_radar_interp',
        'overview_trend_interp_en', 'overview_radar_interp_en',
        'objective_kpi', 'objective_trend', 'objective_months', 'objective_interp', 'objective_interp_en',
        'objective_corr', 'objective_market_interp', 'objective_market_interp_en', 'objective_metric',
        'preference_kpi', 'preference_trend', 'preference_interp', 'preference_interp_en',
        'preference_scatter', 'preference_scatter_interp', 'preference_scatter_interp_en', 'preference_metric',
        'cognition_kpi', 'cognition_trend', 'cognition_interp', 'cognition_interp_en',
        'cognition_dual_axis', 'cognition_dual_axis_interp', 'cognition_dual_axis_interp_en', 'cognition_metric',
      ]
      const vals = [
        c.id,
        JSON.stringify(o.kpi), JSON.stringify(o.trend), JSON.stringify(o.radar),
        JSON.stringify(o.modules), JSON.stringify(o.reasons), JSON.stringify(o.reasonsEn),
        JSON.stringify(o.suggestions), JSON.stringify(o.suggestionsEn),
        o.trendInterp, o.radarInterp, o.trendInterpEn, o.radarInterpEn,
        JSON.stringify(obj.kpi), JSON.stringify(obj.trend), JSON.stringify(obj.months),
        JSON.stringify(obj.interp), JSON.stringify(obj.interpEn), JSON.stringify(obj.corr), obj.marketInterp,
        obj.marketInterpEn, JSON.stringify(obj.metric),
        JSON.stringify(pref.kpi), JSON.stringify(pref.trend),
        JSON.stringify(pref.interp), JSON.stringify(pref.interpEn),
        JSON.stringify(pref.scatter), pref.scatterInterp, pref.scatterInterpEn, JSON.stringify(pref.metric),
        JSON.stringify(cog.kpi), JSON.stringify(cog.trend),
        JSON.stringify(cog.interp), JSON.stringify(cog.interpEn),
        JSON.stringify(cog.dualAxis), cog.dualAxisInterp, cog.dualAxisInterpEn, JSON.stringify(cog.metric),
      ]
      const placeholders = cols.map(() => '?').join(',')
      const onDup = cols.filter(c => c !== 'customer_id').map(c => `${c}=VALUES(${c})`).join(',')
      await pool.query(
        `INSERT INTO customer_risk_data (${cols.join(',')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${onDup}`,
        vals
      )
    }
    console.log(`✓ 已插入 ${CUSTOMERS.length} 条风险数据记录`)

    // 6e. 插入仪表盘统计
    await pool.query('TRUNCATE TABLE dashboard_stats')
    const stats = [
      { label:'管理客户总数', value:'12,847', bg:'bg-blue-50', ic:'text-blue-500', change:'↑ 较上月 +3.2%', cc:'text-green-500', icon:'User', order:1 },
      { label:'已完成评估', value:'11,203', bg:'bg-green-50', ic:'text-green-500', change:'↑ 评估完成率 87.2%', cc:'text-green-500', icon:'CircleCheck', order:2 },
      { label:'风险预警数', value:'236', bg:'bg-red-50', ic:'text-red-500', change:'↑ 较上月 +12', cc:'text-red-500', icon:'Warning', order:3 },
      { label:'待处理工单', value:'48', bg:'bg-orange-50', ic:'text-orange-500', change:'↓ 较上月 -5', cc:'text-green-500', icon:'DataAnalysis', order:4 },
    ]
    for (const s of stats) {
      await pool.query(
        `INSERT INTO dashboard_stats (label, value, bg_class, icon_class, change_text, change_class, icon_name, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.label, s.value, s.bg, s.ic, s.change, s.cc, s.icon, s.order]
      )
    }
    console.log(`✓ 已插入 ${stats.length} 条仪表盘统计`)

    console.log('--- 数据库初始化完成 ---')
  } finally {
    await pool.end()
  }
}

main().catch(err => {
  console.error('初始化失败:', err)
  process.exit(1)
})
