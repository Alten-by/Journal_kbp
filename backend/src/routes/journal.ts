import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getJournal, addLesson, setAttendance, clearAttendance, setGrade, clearGrade, getMyJournal } from '../controllers/journal';

const router = Router();

router.get('/my', requireAuth, requireRole('student'), getMyJournal);
router.get('/:subjectId/:groupId', requireAuth, getJournal);
router.post('/lessons', requireAuth, requireRole('teacher'), addLesson);
router.put('/attendance', requireAuth, requireRole('teacher'), setAttendance);
router.delete('/attendance', requireAuth, requireRole('teacher'), clearAttendance);
router.put('/grades', requireAuth, requireRole('teacher'), setGrade);
router.delete('/grades', requireAuth, requireRole('teacher'), clearGrade);

export default router;
