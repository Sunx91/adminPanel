const express = require('express');
const { sequelize } = require('../models');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();

    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

module.exports = router;