const mongoose = require('mongoose');

const ramadanLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    year: { type: Number, required: true },
    hijriYear: { type: Number },
    fasts: [
      {
        date: { type: String }, // YYYY-MM-DD
        status: { type: String, enum: ['fasted', 'missed', 'makeup', 'exempted'], default: 'fasted' },
        sehriTime: { type: String },
        iftarTime: { type: String },
        note: { type: String, default: '' },
      },
    ],
    taraweeh: [
      {
        date: { type: String },
        rakats: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
      },
    ],
    khatamProgress: { type: Number, default: 0 }, // percentage
    goals: {
      targetFasts: { type: Number, default: 30 },
      targetKhatam: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

ramadanLogSchema.index({ userId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('RamadanLog', ramadanLogSchema);
