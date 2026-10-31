const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { protect } = require('../middlewares/auth');
const { attachPremium } = require('../middlewares/auth');
const QuranProgress = require('../models/QuranProgress');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const cache = new NodeCache({ stdTTL: 86400 }); // 24h cache for static Quran data

const QURAN_API = 'https://api.alquran.cloud/v1';

// ── Surah List ──
router.get('/surahs', async (req, res) => {
  try {
    const cacheKey = 'surahs_list';
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const response = await axios.get(`${QURAN_API}/surah`);
    const surahs = response.data.data.map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));

    cache.set(cacheKey, surahs);
    return sendSuccess(res, surahs);
  } catch {
    return sendError(res, 'Failed to fetch Surah list.', 500);
  }
});

// ── Full Surah with Translation ──
router.get('/surah/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const { edition = 'en.asad' } = req.query;
    const cacheKey = `surah_${number}_${edition}`;
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const [arabicRes, transRes] = await Promise.all([
      axios.get(`${QURAN_API}/surah/${number}`),
      axios.get(`${QURAN_API}/surah/${number}/${edition}`),
    ]);

    const arabic = arabicRes.data.data;
    const translation = transRes.data.data;

    const combined = {
      number: arabic.number,
      name: arabic.name,
      englishName: arabic.englishName,
      englishNameTranslation: arabic.englishNameTranslation,
      revelationType: arabic.revelationType,
      numberOfAyahs: arabic.numberOfAyahs,
      edition: translation.edition,
      ayahs: arabic.ayahs.map((a, i) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        manzil: a.manzil,
        page: a.page,
        ruku: a.ruku,
        hizbQuarter: a.hizbQuarter,
        sajda: a.sajda,
        text: a.text,
        translation: translation.ayahs[i]?.text || '',
      })),
    };

    cache.set(cacheKey, combined);
    return sendSuccess(res, combined);
  } catch (err) {
    console.error('Surah error:', err.message);
    return sendError(res, 'Failed to fetch Surah.', 500);
  }
});

// ── Ayah ──
router.get('/ayah/:surah/:ayah', async (req, res) => {
  try {
    const { surah, ayah } = req.params;
    const { edition = 'en.asad' } = req.query;
    const cacheKey = `ayah_${surah}_${ayah}_${edition}`;
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const [arabicRes, transRes] = await Promise.all([
      axios.get(`${QURAN_API}/ayah/${surah}:${ayah}`),
      axios.get(`${QURAN_API}/ayah/${surah}:${ayah}/${edition}`),
    ]);

    const result = {
      ...arabicRes.data.data,
      translation: transRes.data.data.text,
      editionName: transRes.data.data.edition?.name,
    };
    cache.set(cacheKey, result);
    return sendSuccess(res, result);
  } catch {
    return sendError(res, 'Failed to fetch Ayah.', 500);
  }
});

// ── Juz ──
router.get('/juz/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const { edition = 'quran-uthmani' } = req.query;
    const cacheKey = `juz_${number}_${edition}`;
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const response = await axios.get(`${QURAN_API}/juz/${number}/${edition}`);
    cache.set(cacheKey, response.data.data);
    return sendSuccess(res, response.data.data);
  } catch {
    return sendError(res, 'Failed to fetch Juz.', 500);
  }
});

// ── Search ──
router.get('/search', async (req, res) => {
  try {
    const { q, surah = 'all', language = 'en' } = req.query;
    if (!q || q.trim().length < 2) return sendError(res, 'Query must be at least 2 characters.', 400);

    const editionMap = { en: 'en.asad', ur: 'ur.maududi', hi: 'hi.farooq', ar: 'ar.muyassar' };
    const edition = editionMap[language] || 'en.asad';
    const response = await axios.get(
      `${QURAN_API}/search/${encodeURIComponent(q)}/${surah}/${edition}`
    );
    return sendSuccess(res, response.data.data);
  } catch {
    return sendError(res, 'Search failed.', 500);
  }
});

// ── Available Editions (translations) ──
router.get('/editions', async (req, res) => {
  try {
    const cacheKey = 'editions';
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const response = await axios.get(`${QURAN_API}/edition?format=text&type=translation`);
    const editions = response.data.data.map((e) => ({
      identifier: e.identifier,
      language: e.language,
      name: e.name,
      englishName: e.englishName,
      type: e.type,
    }));
    cache.set(cacheKey, editions);
    return sendSuccess(res, editions);
  } catch {
    return sendError(res, 'Failed to fetch editions.', 500);
  }
});

// ── Progress (protected) ──
router.get('/progress', protect, async (req, res) => {
  try {
    let progress = await QuranProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await QuranProgress.create({ userId: req.user._id });
    }
    return sendSuccess(res, progress);
  } catch {
    return sendError(res, 'Failed to fetch progress.', 500);
  }
});

router.put('/progress', protect, async (req, res) => {
  try {
    const { lastSurah, lastAyah, totalAyahsRead, dailyGoal } = req.body;
    const today = new Date().toISOString().split('T')[0];

    let progress = await QuranProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await QuranProgress.create({ userId: req.user._id });
    }

    if (lastSurah) progress.lastSurah = lastSurah;
    if (lastAyah) progress.lastAyah = lastAyah;
    if (totalAyahsRead !== undefined) progress.totalAyahsRead = totalAyahsRead;
    if (dailyGoal) progress.dailyGoal = dailyGoal;

    // Update daily log
    if (totalAyahsRead !== undefined) {
      const dayLog = progress.dailyLog.find((d) => d.date === today);
      if (dayLog) {
        dayLog.count = totalAyahsRead;
      } else {
        progress.dailyLog.push({ date: today, count: totalAyahsRead });
      }
    }

    await progress.save();
    return sendSuccess(res, progress, 'Progress updated.');
  } catch {
    return sendError(res, 'Failed to update progress.', 500);
  }
});

// ── Bookmarks ──
router.post('/bookmarks', protect, async (req, res) => {
  try {
    const { surahNumber, ayahNumber, surahName, note } = req.body;
    let progress = await QuranProgress.findOne({ userId: req.user._id });
    if (!progress) progress = await QuranProgress.create({ userId: req.user._id });

    const exists = progress.bookmarks.find(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
    if (exists) return sendError(res, 'Bookmark already exists.', 409);

    progress.bookmarks.push({ surahNumber, ayahNumber, surahName, note: note || '' });
    await progress.save();
    return sendSuccess(res, progress.bookmarks, 'Bookmark added.', 201);
  } catch {
    return sendError(res, 'Failed to add bookmark.', 500);
  }
});

router.get('/bookmarks', protect, async (req, res) => {
  try {
    const progress = await QuranProgress.findOne({ userId: req.user._id });
    return sendSuccess(res, progress?.bookmarks || []);
  } catch {
    return sendError(res, 'Failed to fetch bookmarks.', 500);
  }
});

router.delete('/bookmarks/:bookmarkId', protect, async (req, res) => {
  try {
    const progress = await QuranProgress.findOne({ userId: req.user._id });
    if (!progress) return sendError(res, 'No progress found.', 404);

    progress.bookmarks = progress.bookmarks.filter(
      (b) => b._id.toString() !== req.params.bookmarkId
    );
    await progress.save();
    return sendSuccess(res, {}, 'Bookmark removed.');
  } catch {
    return sendError(res, 'Failed to remove bookmark.', 500);
  }
});

module.exports = router;
