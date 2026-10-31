const mongoose = require('mongoose');

const quranProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastSurah: { type: Number, default: 1 },
    lastAyah: { type: Number, default: 1 },
    totalAyahsRead: { type: Number, default: 0 },
    khatamCount: { type: Number, default: 0 },
    dailyGoal: { type: Number, default: 10 }, // ayahs per day
    dailyLog: [
      {
        date: { type: String }, // YYYY-MM-DD
        count: { type: Number, default: 0 },
      },
    ],
    bookmarks: [
      {
        surahNumber: { type: Number },
        ayahNumber: { type: Number },
        surahName: { type: String },
        note: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuranProgress', quranProgressSchema);
