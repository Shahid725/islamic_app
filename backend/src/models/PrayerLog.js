const mongoose = require('mongoose');

const prayerStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      // with_jamaat | on_time | qaza | umar_qaza | missed | pending
      enum: ['pending', 'with_jamaat', 'on_time', 'qaza', 'umar_qaza', 'missed'],
      default: 'pending',
    },
    performedAt: { type: String, default: null }, // HH:mm string
    note: { type: String, default: '' },
  },
  { _id: false }
);

const prayerLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    prayers: {
      fajr: { type: prayerStatusSchema, default: () => ({}) },
      dhuhr: { type: prayerStatusSchema, default: () => ({}) },
      asr: { type: prayerStatusSchema, default: () => ({}) },
      maghrib: { type: prayerStatusSchema, default: () => ({}) },
      isha: { type: prayerStatusSchema, default: () => ({}) },
    },
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index: one log per user per day
prayerLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Auto-calculate completion percentage before save
// with_jamaat=100%, on_time=100%, qaza=50%, umar_qaza=25%, missed=0%
prayerLogSchema.pre('save', function () {
  const prayers = this.prayers;
  const names = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const SCORE = { with_jamaat: 1, on_time: 1, qaza: 0.5, umar_qaza: 0.25, missed: 0, pending: 0 };
  const totalScore = names.reduce((sum, p) => {
    const s = prayers?.[p]?.status || 'pending';
    return sum + (SCORE[s] ?? 0);
  }, 0);
  this.completionPercentage = Math.round((totalScore / 5) * 100);
});

module.exports = mongoose.model('PrayerLog', prayerLogSchema);
