const express = require('express')
const pool = require('../db')
const router = express.Router()

router.get('/stats', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT label, value, bg_class AS bgClass, icon_class AS iconClass, change_text AS `change`, change_class AS changeClass, icon_name AS iconName FROM dashboard_stats ORDER BY sort_order'
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/abnormal-users', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, questionnaire_level AS questionnaireLevel,
              predict_level AS predictLevel,
              assess_time AS assessTime,
              level_diff AS diff
       FROM customers
       WHERE ABS(level_diff) >= 1
       ORDER BY level_diff`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
