import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the input matches EITHER the 'email' field OR the 'username' field
    const user = await User.findOne({
      $or: [
        { email: username },
        { username: username }
      ]
    });

    if (user && (await user.matchPassword(password))) {
      // Check if user is active
      if (user.active === false) {
        return res.status(401).json({ message: 'Account is deactivated. Contact admin.' });
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { username, password, name, role, email } = req.body;

  try {
    const userExists = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (userExists) {
      return res.status(400).json({ message: 'User or Email already exists' });
    }

    const user = await User.create({
      username,
      email, 
      password,
      name,
      role: role || 'recruiter',
      active: true
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // User is already fetched by the 'protect' middleware and attached to req.user
    if (req.user) {
      res.json({
        _id: req.user._id,
        username: req.user.username,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server Error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    // Re-fetch to ensure we have the full document including password field
    // We use req.user._id which comes from the auth middleware
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // Only update password if sent and not empty
      if (req.body.password && req.body.password.trim() !== '') {
        user.password = req.body.password;
      }

      // This save() triggers the pre-save hook in User.js to hash the password
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update Profile Error:', error);
    
    // Handle duplicate key error (e.g., changing email to one that exists)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or Username already in use' });
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Server Error' });
  }
};