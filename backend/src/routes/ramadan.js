const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/response');
const RamadanLog = require('../models/RamadanLog');
const Adhan = require('adhan');

// @route GET /api/ramadan/:year
router.get('/:year', protect, async (req, res) => {
  try {
    const { year } = req.params;
    let log = await RamadanLog.findOne({ userId: req.user._id, year: parseInt(year) });
    if (!log) {
      log = await RamadanLog.create({ userId: req.user._id, year: parseInt(year) });
    }
    return sendSuccess(res, log);
  } catch {
    return sendError(res, 'Failed to fetch Ramadan log.', 500);
  }
});

// @route PUT /api/ramadan/:year/fast/:date
router.put('/:year/fast/:date', protect, async (req, res) => {
  try {
    const { year, date } = req.params;
    const { status, note } = req.body;

    let log = await RamadanLog.findOne({ userId: req.user._id, year: parseInt(year) });
    if (!log) log = await RamadanLog.create({ userId: req.user._id, year: parseInt(year) });

    const fastIndex = log.fasts.findIndex((f) => f.date === date);
    if (fastIndex >= 0) {
      log.fasts[fastIndex].status = status;
      if (note !== undefined) log.fasts[fastIndex].note = note;
    } else {
      log.fasts.push({ date, status: status || 'fasted', note: note || '' });
    }

    await log.save();
    return sendSuccess(res, log, 'Fast updated.');
  } catch {
    return sendError(res, 'Failed to update fast.', 500);
  }
});

// @route PUT /api/ramadan/:year/taraweeh/:date
router.put('/:year/taraweeh/:date', protect, async (req, res) => {
  try {
    const { year, date } = req.params;
    const { rakats, completed } = req.body;

    let log = await RamadanLog.findOne({ userId: req.user._id, year: parseInt(year) });
    if (!log) log = await RamadanLog.create({ userId: req.user._id, year: parseInt(year) });

    const index = log.taraweeh.findIndex((t) => t.date === date);
    if (index >= 0) {
      if (rakats !== undefined) log.taraweeh[index].rakats = rakats;
      if (completed !== undefined) log.taraweeh[index].completed = completed;
    } else {
      log.taraweeh.push({ date, rakats: rakats || 0, completed: completed || false });
    }

    await log.save();
    return sendSuccess(res, log, 'Taraweeh updated.');
  } catch {
    return sendError(res, 'Failed to update Taraweeh.', 500);
  }
});

module.exports = router;
