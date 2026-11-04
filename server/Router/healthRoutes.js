const express = require('express');
const { getPool } = require('../Config/db');

const router = express.Router();

router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

router.get('/', async (req, res) => {
  const started = Date.now();
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.status(200).json({
      status: 'ok',
      database: 'up',
      uptime: process.uptime(),
      responseMs: Date.now() - started
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'down',
      uptime: process.uptime()
    });
  }
});

module.exports = router;
