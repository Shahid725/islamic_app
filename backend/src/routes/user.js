const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, updateSettings, updateLocation, updatePassword,
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { validate, updateProfileSchema, updateSettingsSchema, updateLocationSchema } = require('../middlewares/validate');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/settings', validate(updateSettingsSchema), updateSettings);
router.put('/location', validate(updateLocationSchema), updateLocation);
router.put('/password', updatePassword);

module.exports = router;
