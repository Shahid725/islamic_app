const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// @route   GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      subscription: user.subscription,
      settings: user.settings,
      location: user.location,
      isPremium: user.isPremium(),
      createdAt: user.createdAt,
    });
  } catch {
    return sendError(res, 'Failed to fetch profile.', 500);
  }
};

// @route   PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return sendSuccess(res, { name: user.name, avatar: user.avatar }, 'Profile updated.');
  } catch {
    return sendError(res, 'Failed to update profile.', 500);
  }
};

// @route   PUT /api/user/settings
const updateSettings = async (req, res) => {
  try {
    const allowedKeys = [
      'calcMethod', 'madhab', 'theme', 'language',
      'quranFontSize', 'translationLanguage', 'azanEnabled', 'notifications',
    ];

    const updates = {};
    allowedKeys.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[`settings.${key}`] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );
    return sendSuccess(res, user.settings, 'Settings updated.');
  } catch {
    return sendError(res, 'Failed to update settings.', 500);
  }
};

// @route   PUT /api/user/location
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, city, state, country, timezone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location: { lat, lng, city: city || '', state: state || '', country: country || '', timezone: timezone || '' } },
      { new: true }
    );
    return sendSuccess(res, user.location, 'Location updated.');
  } catch {
    return sendError(res, 'Failed to update location.', 500);
  }
};

// @route   PUT /api/user/password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return sendError(res, 'Current and new password (min 6 chars) required.', 400);
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 'Current password incorrect.', 400);

    user.passwordHash = newPassword;
    await user.save();
    return sendSuccess(res, {}, 'Password updated.');
  } catch {
    return sendError(res, 'Failed to update password.', 500);
  }
};

module.exports = { getProfile, updateProfile, updateSettings, updateLocation, updatePassword };
