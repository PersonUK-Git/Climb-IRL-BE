const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user.
 * @param {string} id - The user ID.
 * @returns {string} - The JWT token.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Generate a 6-digit OTP code.
 * @returns {string}
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Handle user registration creation.
 * @param {Object} User - Mongoose User model
 * @param {Object} userData - Registration data (name, username, email, gender, dateOfBirth)
 * @returns {Promise<Object>} - The newly created User object
 */
const registerUser = async (User, userData) => {
  const { email, username } = userData;
  
  // Extra safety check in service
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new Error(existingUser.email === email ? 'Email already exists' : 'Username already taken');
  }

  const user = await User.create({
    ...userData,
    totalXP: 0,
    level: 1,
    title: 'Newcomer'
  });

  return user;
};

module.exports = {
  generateToken,
  generateOTP,
  registerUser,
};
