const express = require('express');
const router = express.Router();
const { getPrayerTimes, getMonthlyPrayerTimes } = require('../controllers/prayerTimesController');
const { getQibla } = require('../controllers/prayerTimesController');

router.get('/', getPrayerTimes);
router.get('/monthly', getMonthlyPrayerTimes);

module.exports = router;
