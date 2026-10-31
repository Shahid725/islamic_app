const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    subscription: {
      plan: { type: String, enum: ['free', 'monthly', 'annual', 'lifetime'], default: 'free' },
      status: { type: String, enum: ['active', 'expired', 'cancelled', 'none'], default: 'none' },
      expiresAt: { type: Date, default: null },
      razorpaySubscriptionId: { type: String, default: null },
      startedAt: { type: Date, default: null },
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      timezone: { type: String, default: '' },
    },
    settings: {
      calcMethod: { type: String, default: 'Karachi' },
      madhab: { type: String, enum: ['Hanafi', 'Shafi'], default: 'Hanafi' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      language: { type: String, enum: ['en', 'ur', 'hi', 'ar'], default: 'en' },
      notifications: {
        enabled: { type: Boolean, default: true },
        prayers: {
          fajr: { type: Boolean, default: true },
          dhuhr: { type: Boolean, default: true },
          asr: { type: Boolean, default: true },
          maghrib: { type: Boolean, default: true },
          isha: { type: Boolean, default: true },
        },
        dailyHadith: { type: Boolean, default: true },
        dailyDua: { type: Boolean, default: false },
      },
      azanEnabled: { type: Boolean, default: false },
      quranFontSize: { type: Number, default: 24 },
      translationLanguage: { type: String, default: 'en' },
    },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if subscription is active
userSchema.methods.isPremium = function () {
  const { plan, status, expiresAt } = this.subscription;
  if (plan === 'free' || status === 'none') return false;
  if (plan === 'lifetime' && status === 'active') return true;
  if (status === 'active' && expiresAt && new Date() < new Date(expiresAt)) return true;
  return false;
};

module.exports = mongoose.model('User', userSchema);
