const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { protect, premiumOnly, attachPremium } = require('../middlewares/auth');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const cache = new NodeCache({ stdTTL: 3600 });

const HADITH_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

const COLLECTIONS = {
  bukhari: { name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري' },
  muslim: { name: 'Sahih Muslim', arabic: 'صحيح مسلم' },
  abudawud: { name: 'Sunan Abu Dawood', arabic: 'سنن أبي داود' },
  tirmidhi: { name: "Jami' at-Tirmidhi", arabic: 'جامع الترمذي' },
  nasai: { name: "Sunan an-Nasa'i", arabic: 'سنن النسائي' },
  ibnmajah: { name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه' },
};

// @route GET /api/hadith/collections
router.get('/collections', (req, res) => {
  const list = Object.entries(COLLECTIONS).map(([key, val]) => ({
    id: key,
    name: val.name,
    arabic: val.arabic,
  }));
  return sendSuccess(res, list);
});

// @route GET /api/hadith/daily
router.get('/daily', async (req, res) => {
  try {
    const cacheKey = `daily_hadith_${new Date().toISOString().split('T')[0]}`;
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    // Pick a deterministic daily hadith from Bukhari
    const dayOfYear = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000);
    const hadithNum = (dayOfYear % 100) + 1;

    const response = await axios.get(`${HADITH_BASE}/editions/eng-bukhari/${hadithNum}.json`);
    const hadith = response.data.hadiths[0];
    const result = {
      collection: 'bukhari',
      collectionName: 'Sahih al-Bukhari',
      hadithNumber: hadithNum,
      text: hadith?.text || '',
      grades: hadith?.grades || [],
    };
    cache.set(cacheKey, result);
    return sendSuccess(res, result);
  } catch {
    return sendError(res, 'Failed to fetch daily Hadith.', 500);
  }
});

// @route GET /api/hadith/:collection?page=&limit=
router.get('/:collection', protect, attachPremium, async (req, res) => {
  try {
    const { collection } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!COLLECTIONS[collection]) {
      return sendError(res, 'Invalid collection.', 400);
    }

    // Free users only get first 10
    if (!req.isPremium && page > 1) {
      return sendError(res, 'Premium subscription required to access more Hadiths.', 403);
    }
    const effectiveLimit = !req.isPremium ? Math.min(limit, 10) : limit;

    const cacheKey = `hadith_${collection}_${page}_${effectiveLimit}`;
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const start = (page - 1) * effectiveLimit + 1;
    const hadiths = [];

    for (let i = start; i < start + effectiveLimit; i++) {
      try {
        const r = await axios.get(`${HADITH_BASE}/editions/eng-${collection}/${i}.json`);
        if (r.data.hadiths && r.data.hadiths.length > 0) {
          hadiths.push({
            number: i,
            collection,
            collectionName: COLLECTIONS[collection].name,
            text: r.data.hadiths[0].text,
            grades: r.data.hadiths[0].grades || [],
          });
        }
      } catch {
        break; // End of collection
      }
    }

    cache.set(cacheKey, hadiths);
    return sendSuccess(res, hadiths);
  } catch {
    return sendError(res, 'Failed to fetch Hadiths.', 500);
  }
});

// @route GET /api/hadith/:collection/:number
router.get('/:collection/:number', protect, attachPremium, async (req, res) => {
  try {
    const { collection, number } = req.params;

    if (!COLLECTIONS[collection]) return sendError(res, 'Invalid collection.', 400);
    if (!req.isPremium && parseInt(number) > 10) {
      return sendError(res, 'Premium required.', 403);
    }

    const response = await axios.get(`${HADITH_BASE}/editions/eng-${collection}/${number}.json`);
    const hadith = response.data.hadiths[0];

    return sendSuccess(res, {
      number: parseInt(number),
      collection,
      collectionName: COLLECTIONS[collection].name,
      text: hadith?.text || '',
      grades: hadith?.grades || [],
    });
  } catch {
    return sendError(res, 'Failed to fetch Hadith.', 500);
  }
});

module.exports = router;
