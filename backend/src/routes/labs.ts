import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getLabsBySubject, getLabDetail, createLab, updateLab,
  submitLab, getSubmissions, reviewSubmission, getMySubmissions,
} from '../controllers/labs';

const router = Router();

router.get('/submissions/my', requireAuth, requireRole('student'), getMySubmissions);
router.get('/:subjectId', requireAuth, getLabsBySubject);
router.get('/:id/detail', requireAuth, getLabDetail);
router.post('/', requireAuth, requireRole('teacher'), upload.single('taskFile'), createLab);
router.put('/:id', requireAuth, requireRole('teacher'), upload.single('taskFile'), updateLab);
router.post('/:id/submit', requireAuth, requireRole('student'), upload.single('file'), submitLab);
router.get('/:id/submissions', requireAuth, requireRole('teacher'), getSubmissions);
router.put('/submissions/:id/review', requireAuth, requireRole('teacher'), reviewSubmission);

export default router;
