import express from 'express';
import { 
  getCandidates, 
  createCandidate, 
  updateCandidate, 
  deleteCandidate 
} from '../controllers/candidateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCandidates)
  .post(createCandidate);

router.route('/:id')
  .put(updateCandidate)
  .delete(deleteCandidate);

export default router;