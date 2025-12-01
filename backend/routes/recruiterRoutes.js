
import express from 'express';
import { 
  getRecruiters, 
  createRecruiter, 
  updateRecruiter, 
  deleteRecruiter,
  toggleRecruiterStatus,
  getUserProfile,
  updateUserProfile
} from '../controllers/recruiterController.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Protect all routes (Login required)
router.use(protect);

// 2. Profile Routes (Accessible by Recruiter & Admin for their own profile)
// Must come BEFORE the admin authorization check
router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

// 3. Admin Authorization (All routes below this need Admin role)
router.use(authorize('admin'));

router.route('/')
  .get(getRecruiters)
  .post(createRecruiter);

router.route('/:id')
  .put(updateRecruiter)
  .delete(deleteRecruiter);

router.patch('/:id/status', toggleRecruiterStatus);

export default router;