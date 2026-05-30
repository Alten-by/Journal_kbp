import { Request, Response } from 'express';
import { db } from '../db/client';
import { users, studentGroups } from '../db/schema';
import { eq } from 'drizzle-orm';

export function getGroupStudents(req: Request, res: Response) {
  const groupId = Number(req.params.id);
  const students = db.select({ id: users.id, name: users.name })
    .from(users)
    .innerJoin(studentGroups, eq(studentGroups.studentId, users.id))
    .where(eq(studentGroups.groupId, groupId))
    .all();
  res.json(students);
}
