import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMySchedule } from '../controllers/schedule';

const router = Router();

router.get('/me', requireAuth, getMySchedule);

export default router;
