const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/response');
const TasbeehSession = require('../models/TasbeehSession');

// @route POST /api/tasbeeh
router.post('/', protect, async (req, res) => {
  try {
    const { dhikr, arabicText, count, target, duration } = req.body;
    if (!dhikr || count === undefined) return sendError(res, 'dhikr and count required.', 400);

    const today = new Date().toISOString().split('T')[0];
    const session = await TasbeehSession.create({
      userId: req.user._id,
      dhikr,
      arabicText: arabicText || '',
      count,
      target: target || 33,
      date: today,
      duration: duration || 0,
    });
    return sendSuccess(res, session, 'Tasbeeh saved.', 201);
  } catch {
    return sendError(res, 'Failed to save Tasbeeh.', 500);
  }
});

// @route GET /api/tasbeeh/history
router.get('/history', protect, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const sessions = await TasbeehSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    return sendSuccess(res, sessions);
  } catch {
    return sendError(res, 'Failed to fetch history.', 500);
  }
});

// @route GET /api/tasbeeh/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const sessions = await TasbeehSession.find({ userId: req.user._id });
    const total = sessions.reduce((sum, s) => sum + s.count, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    const todayCount = todaySessions.reduce((sum, s) => sum + s.count, 0);

    const dhikrCounts = {};
    sessions.forEach((s) => {
      dhikrCounts[s.dhikr] = (dhikrCounts[s.dhikr] || 0) + s.count;
    });

    return sendSuccess(res, { total, todayCount, dhikrCounts, sessionCount: sessions.length });
  } catch {
    return sendError(res, 'Failed to fetch stats.', 500);
  }
});

module.exports = router;
