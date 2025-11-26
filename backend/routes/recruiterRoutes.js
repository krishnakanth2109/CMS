import express from 'express';
import { 
  getRecruiters, 
  createRecruiter, 
  updateRecruiter, 
  deleteRecruiter,
  toggleRecruiterStatus 
} from '../controllers/recruiterController.js';

// CORRECTED IMPORT: Import middleware from the middleware file
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected and require Admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getRecruiters)
  .post(createRecruiter);

router.route('/:id')
  .put(updateRecruiter)
  .delete(deleteRecruiter);

router.patch('/:id/status', toggleRecruiterStatus);

export default router;