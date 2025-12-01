
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// @desc    Get Current User Profile
// @route   GET /api/recruiters/profile
// @access  Private (Recruiter/Admin)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Current User Profile (Handles Image Upload)
// @route   PUT /api/recruiters/profile
// @access  Private (Recruiter/Admin)
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.location = req.body.location || user.location;
      user.specialization = req.body.specialization || user.specialization;
      user.experience = req.body.experience || user.experience;
      user.bio = req.body.bio || user.bio;
      
      if (req.body.socials) {
        user.socials = req.body.socials;
      }

      // Handle Profile Picture Upload
      if (req.body.profilePicture && req.body.profilePicture.startsWith('data:image')) {
        try {
          const result = await cloudinary.uploader.upload(req.body.profilePicture, {
            folder: 'recruiters',
            public_id: `recruiter_${user._id}`,
            overwrite: true,
            resource_type: "image"
          });
          user.profilePicture = result.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary Upload Error:", uploadError);
          // Proceed without updating image if upload fails, or throw error
        }
      }

      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        // ...other fields if needed by frontend immediately
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all recruiters
// @route   GET /api/recruiters
// @access  Private/Admin
export const getRecruiters = async (req, res) => {
  try {
    // Fetch everyone who is NOT an admin
    const recruiters = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json(recruiters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new recruiter
// @route   POST /api/recruiters
// @access  Private/Admin
export const createRecruiter = async (req, res) => {
  const { name, email, password, recruiterId, phone, role, username, profilePicture } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const idExists = await User.findOne({ recruiterId });
    if (idExists) {
      return res.status(400).json({ message: 'Recruiter ID already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      recruiterId,
      phone,
      role: role || 'recruiter',
      username,
      profilePicture,
      active: true
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        recruiterId: user.recruiterId,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update recruiter (Admin function)
// @route   PUT /api/recruiters/:id
// @access  Private/Admin
export const updateRecruiter = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (req.body.recruiterId && req.body.recruiterId !== user.recruiterId) {
        const idExists = await User.findOne({ recruiterId: req.body.recruiterId });
        if (idExists) {
          return res.status(400).json({ message: 'Recruiter ID already exists' });
        }
      }

      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.role = req.body.role || user.role;
      user.username = req.body.username || user.username;
      user.recruiterId = req.body.recruiterId || user.recruiterId;
      user.profilePicture = req.body.profilePicture || user.profilePicture;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        recruiterId: updatedUser.recruiterId
      });
    } else {
      res.status(404).json({ message: 'Recruiter not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete recruiter
// @route   DELETE /api/recruiters/:id
// @access  Private/Admin
export const deleteRecruiter = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'Recruiter removed' });
    } else {
      res.status(404).json({ message: 'Recruiter not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Active Status
// @route   PATCH /api/recruiters/:id/status
// @access  Private/Admin
export const toggleRecruiterStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.active = !user.active;
      await user.save();
      res.json({ message: `Recruiter set to ${user.active ? 'Active' : 'Inactive'}`, active: user.active });
    } else {
      res.status(404).json({ message: 'Recruiter not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};