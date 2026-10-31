/**
 * Seed Script — Creates admin user + test users
 * Run: node src/data/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/islamic-app';

// Minimal schema just for seeding — real schema is in models/User.js
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'user' },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'none' },
    expiresAt: { type: Date, default: null },
  },
  location: {
    lat: Number,
    lng: Number,
    city: String,
    state: String,
    country: String,
    timezone: String,
  },
  settings: {
    calcMethod: { type: String, default: 'Karachi' },
    madhab: { type: String, default: 'Hanafi' },
    theme: { type: String, default: 'system' },
    language: { type: String, default: 'en' },
    quranFontSize: { type: Number, default: 24 },
    translationLanguage: { type: String, default: 'en' },
    azanEnabled: { type: Boolean, default: false },
    notifications: {
      enabled: { type: Boolean, default: true },
      prayers: {
        fajr: { type: Boolean, default: true },
        dhuhr: { type: Boolean, default: true },
        asr: { type: Boolean, default: true },
        maghrib: { type: Boolean, default: true },
        isha: { type: Boolean, default: true },
      },
    },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Use existing model if already registered (avoid OverwriteModelError)
const User = mongoose.models.User || mongoose.model('User', userSchema);

const USERS_TO_SEED = [
  {
    name: 'Admin',
    email: 'admin@islamicapp.com',
    password: 'Admin@1234',
    role: 'admin',
    subscription: { plan: 'lifetime', status: 'active', expiresAt: null },
  },
  {
    name: 'Test User',
    email: 'test@islamicapp.com',
    password: 'Test@1234',
    role: 'user',
    subscription: { plan: 'free', status: 'none', expiresAt: null },
  },
  {
    name: 'Premium User',
    email: 'premium@islamicapp.com',
    password: 'Premium@1234',
    role: 'user',
    subscription: {
      plan: 'annual',
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  },
];

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    for (const u of USERS_TO_SEED) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`⚠️  Already exists: ${u.email} — skipping`);
        continue;
      }

      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(u.password, salt);

      await User.create({
        name: u.name,
        email: u.email,
        passwordHash: hash,
        role: u.role,
        subscription: u.subscription,
        location: {
          lat: 28.6139,
          lng: 77.2090,
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          timezone: 'Asia/Kolkata',
        },
        isActive: true,
      });

      console.log(`✅ Created [${u.role}]: ${u.email}  |  password: ${u.password}`);
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Login Credentials:');
    console.log('  Admin   → admin@islamicapp.com    / Admin@1234');
    console.log('  Test    → test@islamicapp.com     / Test@1234');
    console.log('  Premium → premium@islamicapp.com  / Premium@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
