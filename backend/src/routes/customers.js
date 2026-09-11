const express = require('express')
const pool = require('../db')
const { text, localizeRow } = require('../lang')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query
    let sql = 'SELECT id, name, name_en AS nameEn FROM customers'
    const params = []
    if (keyword && keyword.trim()) {
      sql += ' WHERE name LIKE ? OR name_en LIKE ? OR id LIKE ?'
      const kw = `%${keyword.trim()}%`
      params.push(kw, kw, kw)
    }
    sql += ' ORDER BY id'
    const [rows] = await pool.query(sql, params)
    res.json(rows.map(r => localizeRow(req.lang, r, [['name', 'nameEn']])))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id/risk-data', async (req, res) => {
  try {
    const { id } = req.params

    const [customerRows] = await pool.query(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    )
    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const [riskRows] = await pool.query(
      'SELECT * FROM customer_risk_data WHERE customer_id = ?',
      [id]
    )

    const customer = customerRows[0]
    const risk = riskRows[0] || {}

    const parse = (val) => {
      if (val === undefined || val === null) return typeof val
      if (typeof val === 'object') return val
      try { return JSON.parse(val) } catch { return val }
    }

    const ext = (zh, en) => text(req.lang, zh, en)

    const overview = {
      kpi:            parse(risk.overview_kpi),
      trend:          parse(risk.overview_trend),
      radar:          parse(risk.overview_radar),
      modules:        parse(risk.overview_modules),
      reasons:        req.lang === 'en' && risk.overview_reasons_en
        ? parse(risk.overview_reasons_en)
        : parse(risk.overview_reasons),
      suggestions:    req.lang === 'en' && risk.overview_suggestions_en
        ? parse(risk.overview_suggestions_en)
        : parse(risk.overview_suggestions),
      reasonsEn:      parse(risk.overview_reasons_en),
      suggestionsEn:  parse(risk.overview_suggestions_en),
      trendInterp:    ext(risk.overview_trend_interp, risk.overview_trend_interp_en),
      radarInterp:    ext(risk.overview_radar_interp, risk.overview_radar_interp_en),
      trendInterpEn:  risk.overview_trend_interp_en  || '',
      radarInterpEn:  risk.overview_radar_interp_en  || '',
    }

    const objective = {
      kpi:             parse(risk.objective_kpi),
      trend:           parse(risk.objective_trend),
      months:          parse(risk.objective_months),
      interp:          req.lang === 'en' && risk.objective_interp_en
        ? parse(risk.objective_interp_en)
        : parse(risk.objective_interp),
      interpEn:        parse(risk.objective_interp_en),
      corr:            parse(risk.objective_corr),
      marketInterp:    ext(risk.objective_market_interp, risk.objective_market_interp_en),
      marketInterpEn:  risk.objective_market_interp_en  || '',
      metric:          parse(risk.objective_metric),
    }

    const preference = {
      kpi:              parse(risk.preference_kpi),
      trend:            parse(risk.preference_trend),
      interp:           req.lang === 'en' && risk.preference_interp_en
        ? parse(risk.preference_interp_en)
        : parse(risk.preference_interp),
      interpEn:         parse(risk.preference_interp_en),
      scatter:          parse(risk.preference_scatter),
      scatterInterp:    ext(risk.preference_scatter_interp, risk.preference_scatter_interp_en),
      scatterInterpEn:  risk.preference_scatter_interp_en  || '',
      metric:           parse(risk.preference_metric),
    }

    const cognition = {
      kpi:              parse(risk.cognition_kpi),
      trend:            parse(risk.cognition_trend),
      interp:           req.lang === 'en' && risk.cognition_interp_en
        ? parse(risk.cognition_interp_en)
        : parse(risk.cognition_interp),
      interpEn:         parse(risk.cognition_interp_en),
      dualAxis:         parse(risk.cognition_dual_axis),
      dualAxisInterp:   ext(risk.cognition_dual_axis_interp, risk.cognition_dual_axis_interp_en),
      dualAxisInterpEn: risk.cognition_dual_axis_interp_en || '',
      metric:           parse(risk.cognition_metric),
    }

    res.json({
      customer: {
        ...customer,
        name:   text(req.lang, customer.name, customer.name_en),
        nameEn: customer.name_en || '',
      },
      overview, objective, preference, cognition
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
