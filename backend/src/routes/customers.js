const express = require('express')
const pool = require('../db')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query
    let sql = 'SELECT id, name FROM customers'
    const params = []
    if (keyword && keyword.trim()) {
      sql += ' WHERE name LIKE ? OR id LIKE ?'
      const kw = `%${keyword.trim()}%`
      params.push(kw, kw)
    }
    sql += ' ORDER BY id'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
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

    const overview = {
      kpi:          parse(risk.overview_kpi),
      trend:        parse(risk.overview_trend),
      radar:        parse(risk.overview_radar),
      modules:      parse(risk.overview_modules),
      reasons:      parse(risk.overview_reasons),
      suggestions:  parse(risk.overview_suggestions),
      trendInterp:  risk.overview_trend_interp  || '',
      radarInterp:  risk.overview_radar_interp  || '',
    }

    const objective = {
      kpi:           parse(risk.objective_kpi),
      trend:         parse(risk.objective_trend),
      months:        parse(risk.objective_months),
      interp:        parse(risk.objective_interp),
      corr:          parse(risk.objective_corr),
      marketInterp:  risk.objective_market_interp  || '',
      metric:        parse(risk.objective_metric),
    }

    const preference = {
      kpi:              parse(risk.preference_kpi),
      trend:            parse(risk.preference_trend),
      interp:           parse(risk.preference_interp),
      scatter:          parse(risk.preference_scatter),
      scatterInterp:    risk.preference_scatter_interp  || '',
      metric:           parse(risk.preference_metric),
    }

    const cognition = {
      kpi:              parse(risk.cognition_kpi),
      trend:            parse(risk.cognition_trend),
      interp:           parse(risk.cognition_interp),
      dualAxis:         parse(risk.cognition_dual_axis),
      dualAxisInterp:   risk.cognition_dual_axis_interp || '',
      metric:           parse(risk.cognition_metric),
    }

    res.json({ customer, overview, objective, preference, cognition })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
