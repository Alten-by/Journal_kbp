import { Request, Response } from 'express';
import { db } from '../db/client';
import { schedule, lessons, teacherSubjectGroup, studentGroups, subjects, groups, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export function getMySchedule(req: Request, res: Response) {
  const { userId, role } = req.user!;

  if (role === 'teacher') {
    const tsgs = db.select().from(teacherSubjectGroup).where(eq(teacherSubjectGroup.teacherId, userId)).all();
    const tsgIds = tsgs.map(t => t.id);
    if (tsgIds.length === 0) { res.json([]); return; }

    const slots = db.select({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
      subjectId: subjects.id,
      subjectName: subjects.name,
      groupId: groups.id,
      groupName: groups.name,
    })
      .from(schedule)
      .innerJoin(teacherSubjectGroup, eq(schedule.tsgId, teacherSubjectGroup.id))
      .innerJoin(subjects, eq(teacherSubjectGroup.subjectId, subjects.id))
      .innerJoin(groups, eq(teacherSubjectGroup.groupId, groups.id))
      .where(eq(teacherSubjectGroup.teacherId, userId))
      .all();

    res.json(slots);
    return;
  }

  // student
  const sg = db.select().from(studentGroups).where(eq(studentGroups.studentId, userId)).get();
  if (!sg) { res.json([]); return; }

  const slots = db.select({
    id: schedule.id,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room,
    subjectId: subjects.id,
    subjectName: subjects.name,
    groupId: groups.id,
    groupName: groups.name,
    teacherName: users.name,
  })
    .from(schedule)
    .innerJoin(teacherSubjectGroup, eq(schedule.tsgId, teacherSubjectGroup.id))
    .innerJoin(subjects, eq(teacherSubjectGroup.subjectId, subjects.id))
    .innerJoin(groups, eq(teacherSubjectGroup.groupId, groups.id))
    .innerJoin(users, eq(teacherSubjectGroup.teacherId, users.id))
    .where(eq(teacherSubjectGroup.groupId, sg.groupId))
    .all();

  res.json(slots);
}
