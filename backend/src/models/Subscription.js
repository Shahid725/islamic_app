const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['monthly', 'annual', 'lifetime'], required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'active', 'expired', 'cancelled', 'refunded'],
      default: 'created',
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true }, // in paise (INR smallest unit)
    currency: { type: String, default: 'INR' },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    renewedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
