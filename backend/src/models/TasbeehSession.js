const mongoose = require('mongoose');

const tasbeehSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dhikr: { type: String, required: true, trim: true },
    arabicText: { type: String, default: '' },
    count: { type: Number, default: 0 },
    target: { type: Number, default: 33 },
    date: { type: String, required: true }, // YYYY-MM-DD
    duration: { type: Number, default: 0 }, // seconds
  },
  { timestamps: true }
);

module.exports = mongoose.model('TasbeehSession', tasbeehSessionSchema);
