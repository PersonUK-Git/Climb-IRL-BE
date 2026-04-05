const express = require('express');
const router = express.Router();
const { register, sendOtp, verifyOtp } = require('../controllers/authController');

router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
