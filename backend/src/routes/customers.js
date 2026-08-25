const express = require('express')
const pool = require('../db')
const router = express.Router()

router.get('/:id/risk-data', async (req, res) => {
  try {
    const { id } = req.params

    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    )
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const riskResult = await pool.query(
      'SELECT * FROM customer_risk_data WHERE customer_id = $1',
      [id]
    )

    const customer = customerResult.rows[0]
    const risk = riskResult.rows[0] || {}

    const overview = {
      kpi:          risk.overview_kpi          || [],
      trend:        risk.overview_trend        || {},
      radar:        risk.overview_radar        || {},
      modules:      risk.overview_modules      || [],
      reasons:      risk.overview_reasons      || [],
      suggestions:  risk.overview_suggestions  || [],
      trendInterp:  risk.overview_trend_interp  || '',
      radarInterp:  risk.overview_radar_interp  || '',
    }

    const objective = {
      kpi:           risk.objective_kpi           || [],
      trend:         risk.objective_trend         || {},
      months:        risk.objective_months        || [],
      interp:        risk.objective_interp        || {},
      corr:          risk.objective_corr          || {},
      marketInterp:  risk.objective_market_interp  || '',
      metric:        risk.objective_metric        || [],
    }

    const preference = {
      kpi:              risk.preference_kpi              || [],
      trend:            risk.preference_trend            || {},
      interp:           risk.preference_interp           || {},
      scatter:          risk.preference_scatter          || [],
      scatterInterp:    risk.preference_scatter_interp    || '',
      metric:           risk.preference_metric           || [],
    }

    const cognition = {
      kpi:              risk.cognition_kpi              || [],
      trend:            risk.cognition_trend            || {},
      interp:           risk.cognition_interp           || {},
      dualAxis:         risk.cognition_dual_axis        || {},
      dualAxisInterp:   risk.cognition_dual_axis_interp || '',
      metric:           risk.cognition_metric           || [],
    }

    res.json({ customer, overview, objective, preference, cognition })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
