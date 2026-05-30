import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getGroupStudents } from '../controllers/groups';

const router = Router();

router.get('/:id/students', requireAuth, requireRole('teacher'), getGroupStudents);

export default router;
