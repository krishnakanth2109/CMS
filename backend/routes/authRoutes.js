import express from 'express';
import { 
  loginUser, 
  registerUser, 
  getUserProfile, 
  updateUserProfile 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// Protected Routes (Requires valid JWT)
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;