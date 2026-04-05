const User = require('../models/User');
const { generateOTP, generateToken, registerUser } = require('../services/authService');
const { sendOTPEmail } = require('../services/emailService');

/**
 * Register a new user.
 */
const register = async (req, res) => {
  const { name, username, email, gender, dateOfBirth } = req.body;

  if (!name || !username || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already exists' : 'Username already taken' 
      });
    }

    const user = await registerUser(User, { 
      name, 
      username, 
      email, 
      gender, 
      dateOfBirth 
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      token: generateToken(user._id),
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Request an OTP for email login (existing users only).
 */
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send the email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (emailSent) {
      res.status(200).json({ message: 'OTP sent to email' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify OTP and issue JWT (login only).
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email });

    // Validate OTP
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Success: Clear OTP and save
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      token: generateToken(user._id),
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  register,
  sendOtp, 
  verifyOtp 
};
