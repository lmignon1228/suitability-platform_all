import i18n from '../i18n'

const PENDING_PATTERN = /^(\d+) 条待处理$/
const ASSESS_PATTERN = /^(\d{4}-\d{2}-\d{2}) 测评$/

export function translateBackendText(s) {
  if (s == null || s === '') return s
  if (i18n.global.locale.value === 'zh') return s
  const dict = i18n.global.messages.value.en?.data || {}
  if (Object.prototype.hasOwnProperty.call(dict, s)) return dict[s]
  const m = PENDING_PATTERN.exec(s)
  if (m && dict.pendingSuffix) return `${m[1]} ${dict.pendingSuffix}`
  const a = ASSESS_PATTERN.exec(s)
  if (a && dict.dataLabel) return `${a[1]} ${dict.dataLabel}`
  return s
}

export function translateBackendList(items, key) {
  if (!Array.isArray(items)) return items || []
  return items.map(it => ({ ...it, [key]: translateBackendText(it[key] || '') }))
}

const UNIT_NUM_RE = /^(\d+(?:\.\d+)?)(万|亿|年|分)$/
const RANGE_SEPARATOR = ' - '

function trimZero(str) {
  return str.replace(/\.?0+$/, '')
}

export function formatBackendMetric(s) {
  if (s == null || s === '') return s
  if (i18n.global.locale.value !== 'en') return s
  return String(s).split(RANGE_SEPARATOR).map((seg) => {
    const part = seg.trim()
    const u = UNIT_NUM_RE.exec(part)
    if (u) {
      const num = parseFloat(u[1])
      const unit = u[2]
      if (unit === '万' || unit === '亿') {
        const millions = (num * (unit === '万' ? 1e4 : 1e8)) / 1e6
        return `${trimZero(millions.toFixed(2))}M`
      }
      if (unit === '年') return `${num} ${num === 1 ? 'Year' : 'Years'}`
      if (unit === '分') return `${num} pts`
    }
    return translateBackendText(part)
  }).join(RANGE_SEPARATOR)
}

export function translateBackendUnit(unit, value) {
  if (unit == null || unit === '') return unit
  if (i18n.global.locale.value !== 'en') return unit
  const n = Math.abs(parseFloat(String(value ?? '').replace(/[^\d.-]/g, '')))
  const msg = i18n.global.messages.value.en?.suitability?.overview || {}
  return Number.isFinite(n) && n === 1
    ? msg.levelUnitSingular || unit
    : msg.levelUnit || unit
}