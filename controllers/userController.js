const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpires');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { name, username, avatarUrl, gender, dateOfBirth } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.username = username || user.username;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      user.gender = gender || user.gender;
      user.dateOfBirth = dateOfBirth || user.dateOfBirth;

      const updatedUser = await user.save();
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
