const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Not authorized. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please refresh.', 401);
    }
    return sendError(res, 'Not authorized. Invalid token.', 401);
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Admin access required.', 403);
  }
  next();
};

const premiumOnly = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Not authorized.', 401);
  }
  if (!req.user.isPremium()) {
    return sendError(res, 'Premium subscription required.', 403);
  }
  next();
};

// Attach premium status without blocking
const attachPremium = (req, res, next) => {
  if (req.user) {
    req.isPremium = req.user.isPremium();
  } else {
    req.isPremium = false;
  }
  next();
};

module.exports = { protect, adminOnly, premiumOnly, attachPremium };
