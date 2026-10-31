const Joi = require('joi');
const { sendError } = require('../utils/response');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return sendError(res, 'Validation failed', 422, errors);
    }
    req[property] = value;
    next();
  };
};

// ── Auth Schemas ──
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(72).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Prayer Schema ──
const updatePrayerSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'with_jamaat', 'on_time', 'qaza', 'umar_qaza', 'missed')
    .required(),
  performedAt: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null, '').optional(),
  note: Joi.string().max(200).allow('').optional(),
});

// ── Profile Schema ──
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(60).optional(),
  avatar: Joi.string().uri().allow(null, '').optional(),
});

const updateSettingsSchema = Joi.object({
  calcMethod: Joi.string().optional(),
  madhab: Joi.string().valid('Hanafi', 'Shafi').optional(),
  theme: Joi.string().valid('light', 'dark', 'system').optional(),
  language: Joi.string().valid('en', 'ur', 'hi', 'ar').optional(),
  quranFontSize: Joi.number().min(16).max(48).optional(),
  translationLanguage: Joi.string().optional(),
  azanEnabled: Joi.boolean().optional(),
  notifications: Joi.object().optional(),
});

const updateLocationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  city: Joi.string().allow('').optional(),
  state: Joi.string().allow('').optional(),
  country: Joi.string().allow('').optional(),
  timezone: Joi.string().allow('').optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updatePrayerSchema,
  updateProfileSchema,
  updateSettingsSchema,
  updateLocationSchema,
};
