import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getJournal, addLesson, setAttendance, setGrade, getMyJournal } from '../controllers/journal';

const router = Router();

router.get('/my', requireAuth, requireRole('student'), getMyJournal);
router.get('/:subjectId/:groupId', requireAuth, getJournal);
router.post('/lessons', requireAuth, requireRole('teacher'), addLesson);
router.put('/attendance', requireAuth, requireRole('teacher'), setAttendance);
router.put('/grades', requireAuth, requireRole('teacher'), setGrade);

export default router;
