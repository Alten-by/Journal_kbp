import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getMySubmissions, reviewSubmission } from '../controllers/labs';

const router = Router();

router.get('/my', requireAuth, requireRole('student'), getMySubmissions);
router.put('/:id/review', requireAuth, requireRole('teacher'), reviewSubmission);

export default router;
