const Adhan = require('adhan');
const { sendSuccess, sendError } = require('../utils/response');

const CALCULATION_METHODS = {
  MWL: 'MuslimWorldLeague',
  ISNA: 'NorthAmerica',
  Egypt: 'Egyptian',
  Karachi: 'Karachi',
  UmmAlQura: 'UmmAlQura',
  Tehran: 'Tehran',
  Kemenag: 'Singapore',
};

const getCalculationParams = (method, madhab) => {
  const methodName = CALCULATION_METHODS[method] || 'Karachi';
  const params =
    Adhan.CalculationMethod[methodName] !== undefined
      ? Adhan.CalculationMethod[methodName]()
      : Adhan.CalculationMethod.Karachi();

  if (madhab === 'Hanafi') {
    params.madhab = Adhan.Madhab.Hanafi;
  } else {
    params.madhab = Adhan.Madhab.Shafi;
  }
  return params;
};

const formatTime = (date) => {
  if (!date) return null;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatTime24 = (date) => {
  if (!date) return null;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// @route  GET /api/prayer-times?lat=&lng=&method=&madhab=
const getPrayerTimes = (req, res) => {
  try {
    const { lat, lng, method = 'Karachi', madhab = 'Hanafi', date } = req.query;

    if (!lat || !lng) return sendError(res, 'lat and lng are required.', 400);

    const coords = new Adhan.Coordinates(parseFloat(lat), parseFloat(lng));
    const params = getCalculationParams(method, madhab);

    const targetDate = date ? new Date(date) : new Date();
    const prayerDate = new Adhan.DateComponents(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate()
    );

    const times = new Adhan.PrayerTimes(coords, prayerDate, params);
    const sunnah = new Adhan.SunnahTimes(times);

    const nextPrayer = times.nextPrayer();
    const currentPrayer = times.currentPrayer();

    return sendSuccess(res, {
      date: targetDate.toISOString().split('T')[0],
      prayers: {
        fajr: { name: 'Fajr', time: formatTime(times.fajr), time24: formatTime24(times.fajr) },
        sunrise: { name: 'Sunrise', time: formatTime(times.sunrise), time24: formatTime24(times.sunrise) },
        dhuhr: { name: 'Dhuhr', time: formatTime(times.dhuhr), time24: formatTime24(times.dhuhr) },
        asr: { name: 'Asr', time: formatTime(times.asr), time24: formatTime24(times.asr) },
        maghrib: { name: 'Maghrib', time: formatTime(times.maghrib), time24: formatTime24(times.maghrib) },
        isha: { name: 'Isha', time: formatTime(times.isha), time24: formatTime24(times.isha) },
      },
      sunnah: {
        middleOfTheNight: formatTime(sunnah.middleOfTheNight),
        lastThirdOfTheNight: formatTime(sunnah.lastThirdOfTheNight),
      },
      currentPrayer,
      nextPrayer,
      method,
      madhab,
    });
  } catch (error) {
    console.error('Prayer time error:', error);
    return sendError(res, 'Failed to calculate prayer times.', 500);
  }
};

// @route  GET /api/prayer-times/monthly?lat=&lng=&month=&year=&method=&madhab=
const getMonthlyPrayerTimes = (req, res) => {
  try {
    const { lat, lng, month, year, method = 'Karachi', madhab = 'Hanafi' } = req.query;
    if (!lat || !lng || !month || !year) {
      return sendError(res, 'lat, lng, month, and year are required.', 400);
    }

    const coords = new Adhan.Coordinates(parseFloat(lat), parseFloat(lng));
    const params = getCalculationParams(method, madhab);
    const m = parseInt(month);
    const y = parseInt(year);
    const daysInMonth = new Date(y, m, 0).getDate();
    const result = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const prayerDate = new Adhan.DateComponents(y, m, d);
      const times = new Adhan.PrayerTimes(coords, prayerDate, params);
      result.push({
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        fajr: formatTime24(times.fajr),
        sunrise: formatTime24(times.sunrise),
        dhuhr: formatTime24(times.dhuhr),
        asr: formatTime24(times.asr),
        maghrib: formatTime24(times.maghrib),
        isha: formatTime24(times.isha),
      });
    }

    return sendSuccess(res, result);
  } catch (error) {
    console.error('Monthly prayer times error:', error);
    return sendError(res, 'Failed to calculate monthly prayer times.', 500);
  }
};

// @route  GET /api/qibla?lat=&lng=
const getQibla = (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return sendError(res, 'lat and lng required.', 400);

    const coords = new Adhan.Coordinates(parseFloat(lat), parseFloat(lng));
    const qibla = Adhan.Qibla(coords);

    return sendSuccess(res, {
      bearing: Math.round(qibla * 10) / 10,
      direction: `${Math.round(qibla)}°`,
      kaaba: { lat: 21.3891, lng: 39.8579 },
    });
  } catch {
    return sendError(res, 'Failed to calculate Qibla.', 500);
  }
};

module.exports = { getPrayerTimes, getMonthlyPrayerTimes, getQibla };
