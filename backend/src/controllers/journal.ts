import { Request, Response } from 'express';
import { db } from '../db/client';
import {
  lessons, schedule, teacherSubjectGroup, studentGroups,
  attendance, grades, users, groups
} from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET /api/journal/:subjectId/:groupId
export function getJournal(req: Request, res: Response) {
  const subjectId = Number(req.params.subjectId);
  const groupId = Number(req.params.groupId);

  const tsg = db.select().from(teacherSubjectGroup)
    .where(and(eq(teacherSubjectGroup.subjectId, subjectId), eq(teacherSubjectGroup.groupId, groupId)))
    .get();
  if (!tsg) { res.status(404).json({ error: 'Subject/group not found' }); return; }

  const scheduleSlots = db.select().from(schedule).where(eq(schedule.tsgId, tsg.id)).all();
  const scheduleIds = scheduleSlots.map(s => s.id);

  const lessonRows = scheduleIds.length
    ? db.select().from(lessons).where(inArray(lessons.scheduleId, scheduleIds)).all()
    : [];
  lessonRows.sort((a, b) => a.date.localeCompare(b.date));

  const studentRows = db.select({ id: users.id, name: users.name, isExpelled: users.isExpelled, isNew: users.isNew })
    .from(users)
    .innerJoin(studentGroups, eq(studentGroups.studentId, users.id))
    .where(eq(studentGroups.groupId, groupId))
    .all();

  const lessonIds = lessonRows.map(l => l.id);

  const attendanceRows = lessonIds.length
    ? db.select().from(attendance).where(inArray(attendance.lessonId, lessonIds)).all()
    : [];
  const gradeRows = lessonIds.length
    ? db.select().from(grades).where(inArray(grades.lessonId, lessonIds)).all()
    : [];

  const attMap = new Map<string, { status: string; lateMinutes: number | null }>();
  for (const a of attendanceRows) attMap.set(`${a.studentId}_${a.lessonId}`, { status: a.status, lateMinutes: a.lateMinutes ?? null });

  const gradeMap = new Map<string, number>();
  for (const g of gradeRows) gradeMap.set(`${g.studentId}_${g.lessonId}`, g.value);

  const studentData = studentRows.map(student => ({
    id: student.id,
    name: student.name,
    isExpelled: student.isExpelled,
    isNew: student.isNew,
    cells: lessonRows.map(lesson => ({
      lessonId: lesson.id,
      date: lesson.date,
      attendance: attMap.get(`${student.id}_${lesson.id}`)?.status ?? null,
      lateMinutes: attMap.get(`${student.id}_${lesson.id}`)?.lateMinutes ?? null,
      grade: gradeMap.get(`${student.id}_${lesson.id}`) ?? null,
    })),
  }));

  res.json({ lessons: lessonRows, students: studentData });
}

// POST /api/lessons
export function addLesson(req: Request, res: Response) {
  const { scheduleId, date } = req.body;
  if (!scheduleId || !date) { res.status(400).json({ error: 'scheduleId and date required' }); return; }

  const [lesson] = db.insert(lessons).values({ scheduleId, date }).returning().all();

  // Автоопределение опозданий: если урок сегодня и текущее время уже прошло start_time —
  // всем студентам группы ставим 'late' (преподаватель может скорректировать вручную)
  const today = new Date().toISOString().slice(0, 10);
  if (date === today) {
    const slot = db.select().from(schedule).where(eq(schedule.id, scheduleId)).get();
    if (slot) {
      const now = new Date();
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      if (nowMinutes > startMinutes) {
        const lateMinutes = nowMinutes - startMinutes;
        const tsg = db.select().from(teacherSubjectGroup)
          .where(eq(teacherSubjectGroup.id, slot.tsgId)).get();
        if (tsg) {
          const groupStudents = db.select().from(studentGroups)
            .where(eq(studentGroups.groupId, tsg.groupId)).all();
          for (const sg of groupStudents) {
            db.insert(attendance).values({
              studentId: sg.studentId,
              lessonId: lesson.id,
              status: 'late',
              lateMinutes,
            }).run();
          }
        }
      }
    }
  }

  res.status(201).json(lesson);
}

// PUT /api/attendance
export function setAttendance(req: Request, res: Response) {
  const { studentId, lessonId, status, lateMinutes } = req.body;
  if (!studentId || !lessonId || !status) { res.status(400).json({ error: 'studentId, lessonId, status required' }); return; }
  if (!['present', 'absent', 'late'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }

  const mins = status === 'late' && lateMinutes != null ? Number(lateMinutes) : null;

  const existing = db.select().from(attendance)
    .where(and(eq(attendance.studentId, studentId), eq(attendance.lessonId, lessonId))).get();

  if (existing) {
    db.update(attendance).set({ status, lateMinutes: mins }).where(eq(attendance.id, existing.id)).run();
  } else {
    db.insert(attendance).values({ studentId, lessonId, status, lateMinutes: mins }).run();
  }
  res.json({ ok: true });
}

// PUT /api/grades
export function setGrade(req: Request, res: Response) {
  const { studentId, lessonId, value } = req.body;
  if (!studentId || !lessonId || value == null) { res.status(400).json({ error: 'studentId, lessonId, value required' }); return; }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 10) { res.status(400).json({ error: 'Grade must be integer 1-10' }); return; }

  const existing = db.select().from(grades)
    .where(and(eq(grades.studentId, studentId), eq(grades.lessonId, lessonId))).get();

  if (existing) {
    db.update(grades).set({ value: num }).where(eq(grades.id, existing.id)).run();
  } else {
    db.insert(grades).values({ studentId, lessonId, value: num }).run();
  }
  res.json({ ok: true });
}

// DELETE /api/attendance
export function clearAttendance(req: Request, res: Response) {
  const { studentId, lessonId } = req.body;
  if (!studentId || !lessonId) { res.status(400).json({ error: 'studentId and lessonId required' }); return; }
  db.delete(attendance)
    .where(and(eq(attendance.studentId, studentId), eq(attendance.lessonId, lessonId)))
    .run();
  res.json({ ok: true });
}

// DELETE /api/grades
export function clearGrade(req: Request, res: Response) {
  const { studentId, lessonId } = req.body;
  if (!studentId || !lessonId) { res.status(400).json({ error: 'studentId and lessonId required' }); return; }
  db.delete(grades)
    .where(and(eq(grades.studentId, studentId), eq(grades.lessonId, lessonId)))
    .run();
  res.json({ ok: true });
}

// GET /api/journal/my — для студента: его оценки и посещаемость
export function getMyJournal(req: Request, res: Response) {
  const { userId } = req.user!;

  const sg = db.select().from(studentGroups).where(eq(studentGroups.studentId, userId)).get();
  if (!sg) { res.json([]); return; }

  const tsgs = db.select().from(teacherSubjectGroup)
    .where(eq(teacherSubjectGroup.groupId, sg.groupId)).all();

  const result = tsgs.map(tsg => {
    const scheduleSlots = db.select().from(schedule).where(eq(schedule.tsgId, tsg.id)).all();
    const scheduleIds = scheduleSlots.map(s => s.id);
    const lessonRows = scheduleIds.length
      ? db.select().from(lessons).where(inArray(lessons.scheduleId, scheduleIds)).all()
      : [];
    lessonRows.sort((a, b) => a.date.localeCompare(b.date));
    const lessonIds = lessonRows.map(l => l.id);

    const attRows = lessonIds.length
      ? db.select().from(attendance).where(and(inArray(attendance.lessonId, lessonIds), eq(attendance.studentId, userId))).all()
      : [];
    const gradeRows = lessonIds.length
      ? db.select().from(grades).where(and(inArray(grades.lessonId, lessonIds), eq(grades.studentId, userId))).all()
      : [];

    const attMap = new Map(attRows.map(a => [a.lessonId, { status: a.status, lateMinutes: a.lateMinutes ?? null }]));
    const gradeMap = new Map(gradeRows.map(g => [g.lessonId, g.value]));

    return {
      subjectId: tsg.subjectId,
      cells: lessonRows.map(l => ({
        lessonId: l.id,
        date: l.date,
        attendance: attMap.get(l.id)?.status ?? null,
        lateMinutes: attMap.get(l.id)?.lateMinutes ?? null,
        grade: gradeMap.get(l.id) ?? null,
      })),
    };
  });

  res.json(result);
}
