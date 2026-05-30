import { Request, Response } from 'express';
import { db } from '../db/client';
import {
  studentGroups, teacherSubjectGroup, subjects, users,
  lessons, schedule, grades, attendance, labWorks, labSubmissions
} from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET /api/student/subjects
export function getMySubjects(req: Request, res: Response) {
  const { userId } = req.user!;
  const sg = db.select().from(studentGroups).where(eq(studentGroups.studentId, userId)).get();
  if (!sg) { res.json([]); return; }

  const result = db.select({
    subjectId: subjects.id,
    subjectName: subjects.name,
    teacherName: users.name,
  })
    .from(teacherSubjectGroup)
    .innerJoin(subjects, eq(teacherSubjectGroup.subjectId, subjects.id))
    .innerJoin(users, eq(teacherSubjectGroup.teacherId, users.id))
    .where(eq(teacherSubjectGroup.groupId, sg.groupId))
    .all();

  res.json(result);
}

// GET /api/student/subjects/:id
export function getMySubjectDetail(req: Request, res: Response) {
  const { userId } = req.user!;
  const subjectId = Number(req.params.id);

  const sg = db.select().from(studentGroups).where(eq(studentGroups.studentId, userId)).get();
  if (!sg) { res.json({}); return; }

  // Grades from lessons
  const tsg = db.select().from(teacherSubjectGroup)
    .where(and(eq(teacherSubjectGroup.subjectId, subjectId), eq(teacherSubjectGroup.groupId, sg.groupId))).get();

  let lessonGrades: { date: string; value: number; attendance: string | null }[] = [];
  if (tsg) {
    const slots = db.select().from(schedule).where(eq(schedule.tsgId, tsg.id)).all();
    const slotIds = slots.map(s => s.id);
    const lessonRows = slotIds.length
      ? db.select().from(lessons).where(inArray(lessons.scheduleId, slotIds)).all()
      : [];
    const lessonIds = lessonRows.map(l => l.id);

    const gradeRows = lessonIds.length
      ? db.select().from(grades).where(and(inArray(grades.lessonId, lessonIds), eq(grades.studentId, userId))).all()
      : [];
    const attRows = lessonIds.length
      ? db.select().from(attendance).where(and(inArray(attendance.lessonId, lessonIds), eq(attendance.studentId, userId))).all()
      : [];

    const lessonMap = new Map(lessonRows.map(l => [l.id, l.date]));
    const attMap = new Map(attRows.map(a => [a.lessonId, a.status]));

    lessonGrades = gradeRows.map(g => ({
      date: lessonMap.get(g.lessonId) ?? '',
      value: g.value,
      attendance: attMap.get(g.lessonId) ?? null,
    }));
  }

  // Lab submissions grouped by type
  const labs = db.select().from(labWorks).where(eq(labWorks.subjectId, subjectId)).all();
  const labIds = labs.map(l => l.id);
  const submissions = labIds.length
    ? db.select().from(labSubmissions)
        .where(and(inArray(labSubmissions.labWorkId, labIds), eq(labSubmissions.studentId, userId)))
        .all()
    : [];
  const subMap = new Map(submissions.map(s => [s.labWorkId, s]));

  const byType: Record<string, unknown[]> = { lab: [], practical: [], test: [], theory: [] };
  for (const lab of labs) {
    const sub = subMap.get(lab.id);
    byType[lab.type].push({
      id: lab.id,
      title: lab.title,
      deadline: lab.deadline,
      isTeam: lab.isTeam,
      grade: sub?.grade ?? null,
      comment: sub?.comment ?? null,
      submittedAt: sub?.submittedAt ?? null,
    });
  }

  res.json({ lessonGrades, labs: byType });
}
