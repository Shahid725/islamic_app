const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// Helper: generate access + refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'Email already registered.', 409);
    }

    const user = await User.create({ name, email, passwordHash: password });
    const { accessToken, refreshToken } = generateTokens(user._id);

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscription: user.subscription,
          settings: user.settings,
          location: user.location,
        },
      },
      'Registration successful',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 'Registration failed.', 500);
  }
};

// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive) {
      return sendError(res, 'Invalid credentials.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials.', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        settings: user.settings,
        location: user.location,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed.', 500);
  }
};

// @route   POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 'Refresh token required.', 400);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'User not found.', 401);

    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
    return sendSuccess(res, { accessToken, refreshToken: newRefresh });
  } catch {
    return sendError(res, 'Invalid or expired refresh token.', 401);
  }
};

// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found.', 404);

    return sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      settings: user.settings,
      location: user.location,
      isPremium: user.isPremium(),
      createdAt: user.createdAt,
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch user.', 500);
  }
};

module.exports = { register, login, refreshToken, getMe };
