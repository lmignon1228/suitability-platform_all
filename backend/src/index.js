const express = require('express')
const cors = require('cors')
const dashboardRouter = require('./routes/dashboard')
const customersRouter = require('./routes/customers')
const { langMiddleware } = require('./lang')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(langMiddleware)

app.use('/api/dashboard', dashboardRouter)
app.use('/api/customers', customersRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
