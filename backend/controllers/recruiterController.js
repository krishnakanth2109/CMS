import User from '../models/User.js';

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

// @desc    Update recruiter
// @route   PUT /api/recruiters/:id
// @access  Private/Admin
export const updateRecruiter = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // FIX: Only check for ID existence if the ID is actually being CHANGED
      if (req.body.recruiterId && req.body.recruiterId !== user.recruiterId) {
        const idExists = await User.findOne({ recruiterId: req.body.recruiterId });
        if (idExists) {
          return res.status(400).json({ message: 'Recruiter ID already exists' });
        }
      }

      // FIX: Only check for email existence if email is being CHANGED
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
      
      // Only update password if sent
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