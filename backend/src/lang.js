/* lang.js — 后端多语言识别与响应数据清洗工具
 * 语言识别优先级: ?lang=xx query 参数 > Accept-Language 请求头
 */
function detectLang(req) {
  const q = req.query && req.query.lang
  if (typeof q === 'string' && q.trim()) {
    const v = q.trim().toLowerCase()
    if (v.startsWith('en')) return 'en'
    if (v.startsWith('zh')) return 'zh'
    return 'zh'
  }

  const header = String(req.headers['accept-language'] || '')
  const first = header.split(',')[0] || ''
  if (/en/i.test(first)) return 'en'
  if (/zh/i.test(first)) return 'zh'
  return 'zh'
}

function langMiddleware(req, _res, next) {
  req.lang = detectLang(req)
  next()
}

/* 语言化文本: lang=en 且存在英文时优先使用英文，否则回退到中文默认值 */
function text(lang, zh, en) {
  if (lang === 'en' && en) return en
  return zh === undefined || zh === null ? '' : zh
}

/* 数据清洗: 用 _en 英文字段覆盖同结构下的中文字段，保持返回 JSON 结构不变 */
function localizeRow(lang, row, pairs) {
  if (!row) return row
  const out = { ...row }
  for (const [base, en] of pairs) {
    if (base in out) out[base] = text(lang, row[base], row[en])
  }
  return out
}

module.exports = { detectLang, langMiddleware, text, localizeRow }