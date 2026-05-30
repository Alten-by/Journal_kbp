import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'name, email, password, role are required' });
    return;
  }
  if (!['student', 'teacher'].includes(role)) {
    res.status(400).json({ error: 'role must be student or teacher' });
    return;
  }
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = db.insert(users).values({ name, email, passwordHash, role }).returning().all();
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export function me(req: Request, res: Response) {
  const userRow = db.select().from(users).where(eq(users.id, req.user!.userId)).get();
  if (!userRow) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ id: userRow.id, name: userRow.name, email: userRow.email, role: userRow.role });
}
