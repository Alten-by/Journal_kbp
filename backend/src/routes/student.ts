import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getMySubjects, getMySubjectDetail } from '../controllers/student';

const router = Router();

router.get('/subjects', requireAuth, requireRole('student'), getMySubjects);
router.get('/subjects/:id', requireAuth, requireRole('student'), getMySubjectDetail);

export default router;
