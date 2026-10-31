import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  updateSettings: (data) => api.put('/user/settings', data),
  updateLocation: (data) => api.put('/user/location', data),
  updatePassword: (data) => api.put('/user/password', data),
};

export const prayerTimesApi = {
  getTimes: (params) => api.get('/prayer-times', { params }),
  getMonthly: (params) => api.get('/prayer-times/monthly', { params }),
};

export const qiblaApi = {
  getQibla: (params) => api.get('/qibla', { params }),
};

export const prayersApi = {
  getDayLog: (date) => api.get(`/prayers/${date}`),
  updatePrayer: (date, prayer, data) => api.put(`/prayers/${date}/${prayer}`, data),
  getMonthlyStats: (params) => api.get('/prayers/stats/monthly', { params }),
  getYearlyStats: (params) => api.get('/prayers/stats/yearly', { params }),
};

export const quranApi = {
  getSurahs: () => api.get('/quran/surahs'),
  getSurah: (number, edition) => api.get(`/quran/surah/${number}`, { params: { edition } }),
  getAyah: (surah, ayah, edition) => api.get(`/quran/ayah/${surah}/${ayah}`, { params: { edition } }),
  getJuz: (number, edition) => api.get(`/quran/juz/${number}`, { params: { edition } }),
  search: (params) => api.get('/quran/search', { params }),
  getEditions: () => api.get('/quran/editions'),
  getProgress: () => api.get('/quran/progress'),
  updateProgress: (data) => api.put('/quran/progress', data),
  addBookmark: (data) => api.post('/quran/bookmarks', data),
  getBookmarks: () => api.get('/quran/bookmarks'),
  removeBookmark: (id) => api.delete(`/quran/bookmarks/${id}`),
};

export const hadithApi = {
  getCollections: () => api.get('/hadith/collections'),
  getDaily: () => api.get('/hadith/daily'),
  getCollection: (collection, params) => api.get(`/hadith/${collection}`, { params }),
  getHadith: (collection, number) => api.get(`/hadith/${collection}/${number}`),
};

export const tasbeehApi = {
  save: (data) => api.post('/tasbeeh', data),
  getHistory: (params) => api.get('/tasbeeh/history', { params }),
  getStats: () => api.get('/tasbeeh/stats'),
};

export const ramadanApi = {
  getLog: (year) => api.get(`/ramadan/${year}`),
  updateFast: (year, date, data) => api.put(`/ramadan/${year}/fast/${date}`, data),
  updateTaraweeh: (year, date, data) => api.put(`/ramadan/${year}/taraweeh/${date}`, data),
};
