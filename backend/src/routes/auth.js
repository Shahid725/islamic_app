const express = require('express');
const router = express.Router();
const { register, login, refreshToken, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate, registerSchema, loginSchema } = require('../middlewares/validate');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
