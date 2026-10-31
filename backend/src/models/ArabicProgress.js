const mongoose = require('mongoose');

const arabicProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wordId: { type: Number, required: true },
    status: { type: String, enum: ['new', 'learning', 'reviewing', 'mastered'], default: 'new' },
    reviewCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    nextReview: { type: Date, default: null }, // SRS next review date
    interval: { type: Number, default: 1 }, // SRS interval in days
    ease: { type: Number, default: 2.5 }, // SRS ease factor
    lastReviewed: { type: Date, default: null },
  },
  { timestamps: true }
);

arabicProgressSchema.index({ userId: 1, wordId: 1 }, { unique: true });

module.exports = mongoose.model('ArabicProgress', arabicProgressSchema);
