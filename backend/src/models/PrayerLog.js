const mongoose = require('mongoose');

const prayerStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'performed', 'missed', 'late'],
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
prayerLogSchema.pre('save', function (next) {
  const prayers = this.prayers;
  const names = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const performed = names.filter(
    (p) => prayers[p] && (prayers[p].status === 'performed' || prayers[p].status === 'late')
  ).length;
  this.completionPercentage = Math.round((performed / 5) * 100);
  next();
});

module.exports = mongoose.model('PrayerLog', prayerLogSchema);
