const express = require('express');
const router = express.Router();
const { getDayLog, updatePrayer, getMonthlyStats, getYearlyStats } = require('../controllers/prayerController');
const { protect } = require('../middlewares/auth');
const { validate, updatePrayerSchema } = require('../middlewares/validate');

router.use(protect);

router.get('/stats/monthly', getMonthlyStats);
router.get('/stats/yearly', getYearlyStats);
router.get('/:date', getDayLog);
router.put('/:date/:prayer', validate(updatePrayerSchema), updatePrayer);

module.exports = router;
