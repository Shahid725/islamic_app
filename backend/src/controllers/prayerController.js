const PrayerLog = require('../models/PrayerLog');
const { sendSuccess, sendError } = require('../utils/response');

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// @route  GET /api/prayers/:date   (date = YYYY-MM-DD)
const getDayLog = async (req, res) => {
  try {
    const { date } = req.params;
    let log = await PrayerLog.findOne({ userId: req.user._id, date });

    if (!log) {
      // Return empty log structure
      const prayers = {};
      PRAYERS.forEach((p) => { prayers[p] = { status: 'pending', performedAt: null, note: '' }; });
      return sendSuccess(res, { date, prayers, completionPercentage: 0, exists: false });
    }

    return sendSuccess(res, { ...log.toObject(), exists: true });
  } catch {
    return sendError(res, 'Failed to fetch prayer log.', 500);
  }
};

// @route  PUT /api/prayers/:date/:prayer
const updatePrayer = async (req, res) => {
  try {
    const { date, prayer } = req.params;
    const { status, performedAt, note } = req.body;

    if (!PRAYERS.includes(prayer)) {
      return sendError(res, 'Invalid prayer name.', 400);
    }

    const update = {
      [`prayers.${prayer}.status`]: status,
      [`prayers.${prayer}.performedAt`]: performedAt || null,
      [`prayers.${prayer}.note`]: note || '',
    };

    let log = await PrayerLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { $set: update },
      { new: true, upsert: true }
    );

    // Recalculate completion (trigger pre-save hook by saving)
    await log.save();
    log = await PrayerLog.findOne({ userId: req.user._id, date });

    return sendSuccess(res, log, 'Prayer updated.');
  } catch (error) {
    console.error('Update prayer error:', error);
    return sendError(res, 'Failed to update prayer.', 500);
  }
};

// @route  GET /api/prayers/stats/monthly?month=&year=
const getMonthlyStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, 'month and year required.', 400);

    const m = String(month).padStart(2, '0');
    const y = String(year);
    const startDate = `${y}-${m}-01`;
    const endDate = `${y}-${m}-31`;

    const logs = await PrayerLog.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const stats = {
      month: parseInt(month),
      year: parseInt(year),
      daysLogged: logs.length,
      totalPossible: logs.length * 5,
      performed: 0,
      missed: 0,
      completionPercentage: 0,
      dailyLogs: logs.map((l) => ({
        date: l.date,
        prayers: l.prayers,
        completionPercentage: l.completionPercentage,
      })),
      prayerBreakdown: {},
    };

    PRAYERS.forEach((p) => {
      let performed = 0, missed = 0;
      logs.forEach((l) => {
        const s = l.prayers[p]?.status;
        if (s === 'performed' || s === 'late') performed++;
        else if (s === 'missed') missed++;
      });
      stats.prayerBreakdown[p] = { performed, missed, pending: logs.length - performed - missed };
      stats.performed += performed;
      stats.missed += missed;
    });

    if (stats.totalPossible > 0) {
      stats.completionPercentage = Math.round((stats.performed / stats.totalPossible) * 100);
    }

    return sendSuccess(res, stats);
  } catch {
    return sendError(res, 'Failed to fetch monthly stats.', 500);
  }
};

// @route  GET /api/prayers/stats/yearly?year=
const getYearlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return sendError(res, 'year required.', 400);

    const logs = await PrayerLog.find({
      userId: req.user._id,
      date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    });

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      performed: 0,
      total: 0,
      percentage: 0,
    }));

    let totalPerformed = 0, totalPossible = 0;
    logs.forEach((l) => {
      const month = parseInt(l.date.split('-')[1]) - 1;
      PRAYERS.forEach((p) => {
        const s = l.prayers[p]?.status;
        if (s === 'performed' || s === 'late') {
          monthlyBreakdown[month].performed++;
          totalPerformed++;
        }
        if (s !== 'pending') totalPossible++;
        monthlyBreakdown[month].total++;
      });
    });

    monthlyBreakdown.forEach((m) => {
      if (m.total > 0) m.percentage = Math.round((m.performed / m.total) * 100);
    });

    return sendSuccess(res, {
      year: parseInt(year),
      totalPerformed,
      totalPossible,
      overallPercentage: totalPossible > 0 ? Math.round((totalPerformed / totalPossible) * 100) : 0,
      monthlyBreakdown,
      streaks: computeStreak(logs),
    });
  } catch {
    return sendError(res, 'Failed to fetch yearly stats.', 500);
  }
};

function computeStreak(logs) {
  if (!logs.length) return { current: 0, longest: 0 };
  const sortedDates = logs
    .filter((l) => l.completionPercentage === 100)
    .map((l) => l.date)
    .sort();

  let current = 0, longest = 0, streak = 0;
  let prevDate = null;
  for (const d of sortedDates) {
    if (!prevDate) { streak = 1; }
    else {
      const diff = (new Date(d) - new Date(prevDate)) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    longest = Math.max(longest, streak);
    prevDate = d;
  }
  // Check if today is in the streak
  const today = new Date().toISOString().split('T')[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  const daysDiff = (new Date(today) - new Date(lastDate)) / 86400000;
  current = daysDiff <= 1 ? streak : 0;

  return { current, longest };
}

module.exports = { getDayLog, updatePrayer, getMonthlyStats, getYearlyStats };
