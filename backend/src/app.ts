import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRouter from './routes/auth';
import scheduleRouter from './routes/schedule';
import journalRouter from './routes/journal';
import labsRouter from './routes/labs';
import studentRouter from './routes/student';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('./uploads')));

app.use('/api/auth', authRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/journal', journalRouter);
app.use('/api/labs', labsRouter);
app.use('/api/student', studentRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

export default app;
