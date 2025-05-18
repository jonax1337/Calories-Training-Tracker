const express = require('express');
const router = express.Router();
const dailyLogController = require('../controllers/dailyLogController');

// GET / - Get all daily logs for a user
router.get('/', dailyLogController.getDailyLogs);

// GET /:date - Get daily log by date for a user
router.get('/:date', dailyLogController.getDailyLogByDate);

// POST / - Create or update daily log
router.post('/', dailyLogController.saveDailyLog);

module.exports = router;
