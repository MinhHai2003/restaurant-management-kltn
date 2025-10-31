const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

// Statistics routes
router.get('/', statisticsController.getStatistics);

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Statistics API is working!' });
});

module.exports = router;
