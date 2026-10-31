const express = require('express');
const router = express.Router();
const { getQibla } = require('../controllers/prayerTimesController');

router.get('/', getQibla);

module.exports = router;
