require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

const app = express();

// ── Connect Database ──
connectDB();

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth endpoints get tighter limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts.' },
});

// ── Body Parser ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Islamic App API is running 🕌', timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use('/api/auth', authLimiter, require('./src/routes/auth'));
app.use('/api/user', require('./src/routes/user'));
app.use('/api/prayer-times', require('./src/routes/prayerTimes'));
app.use('/api/prayers', require('./src/routes/prayers'));
app.use('/api/qibla', require('./src/routes/qibla'));
app.use('/api/quran', require('./src/routes/quran'));
app.use('/api/hadith', require('./src/routes/hadith'));
app.use('/api/tasbeeh', require('./src/routes/tasbeeh'));
app.use('/api/ramadan', require('./src/routes/ramadan'));

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
