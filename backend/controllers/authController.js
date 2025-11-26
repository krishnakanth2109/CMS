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
    // FIX: Check if the input matches EITHER the 'email' field OR the 'username' field
    const user = await User.findOne({
      $or: [
        { email: username },      // Check if input matches an email
        { username: username }    // Check if input matches a username
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
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};