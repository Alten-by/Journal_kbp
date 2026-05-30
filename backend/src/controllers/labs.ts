import { Request, Response } from 'express';
import { db } from '../db/client';
import { labWorks, labSubmissions, labTeams, users, studentGroups, teacherSubjectGroup, schedule, lessons, grades } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET /api/labs/:subjectId
export function getLabsBySubject(req: Request, res: Response) {
  const subjectId = Number(req.params.subjectId);
  const labs = db.select().from(labWorks).where(eq(labWorks.subjectId, subjectId)).all();
  res.json(labs);
}

// GET /api/labs/:id/detail
export function getLabDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const lab = db.select().from(labWorks).where(eq(labWorks.id, id)).get();
  if (!lab) { res.status(404).json({ error: 'Not found' }); return; }

  const teamMembers = db.select({ id: users.id, name: users.name })
    .from(labTeams)
    .innerJoin(users, eq(labTeams.studentId, users.id))
    .where(eq(labTeams.labWorkId, id))
    .all();

  res.json({ ...lab, teamMembers });
}

// POST /api/labs
export function createLab(req: Request, res: Response) {
  const { subjectId, title, description, type, startDate, deadline, isTeam } = req.body;
  if (!subjectId || !title || !type) { res.status(400).json({ error: 'subjectId, title, type required' }); return; }

  const taskFilePath = (req.file?.filename)
    ? `/uploads/${req.file.filename}`
    : null;

  const [lab] = db.insert(labWorks).values({
    subjectId: Number(subjectId),
    title,
    description: description ?? null,
    type,
    startDate: startDate ?? null,
    deadline: deadline ?? null,
    isTeam: isTeam === 'true' || isTeam === true,
    taskFilePath,
    createdAt: new Date().toISOString(),
  }).returning().all();

  res.status(201).json(lab);
}

// PUT /api/labs/:id
export function updateLab(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { title, description, startDate, deadline, isTeam, teamStudentIds } = req.body;

  const taskFilePath = req.file?.filename ? `/uploads/${req.file.filename}` : undefined;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (deadline !== undefined) updateData.deadline = deadline;
  if (isTeam !== undefined) updateData.isTeam = isTeam === 'true' || isTeam === true;
  if (taskFilePath) updateData.taskFilePath = taskFilePath;

  db.update(labWorks).set(updateData).where(eq(labWorks.id, id)).run();

  if (Array.isArray(teamStudentIds)) {
    db.delete(labTeams).where(eq(labTeams.labWorkId, id)).run();
    if (teamStudentIds.length > 0) {
      db.insert(labTeams).values(teamStudentIds.map((sid: number) => ({ labWorkId: id, studentId: sid }))).run();
    }
  }

  res.json({ ok: true });
}

// POST /api/labs/:id/submit
export function submitLab(req: Request, res: Response) {
  const labWorkId = Number(req.params.id);
  const studentId = req.user!.userId;

  const filePath = req.file?.filename ? `/uploads/${req.file.filename}` : null;
  const submittedAt = new Date().toISOString();

  const existing = db.select().from(labSubmissions)
    .where(and(eq(labSubmissions.labWorkId, labWorkId), eq(labSubmissions.studentId, studentId))).get();

  if (existing) {
    db.update(labSubmissions).set({ filePath, submittedAt }).where(eq(labSubmissions.id, existing.id)).run();
    res.json({ ok: true, updated: true });
  } else {
    const [sub] = db.insert(labSubmissions).values({ labWorkId, studentId, filePath, submittedAt }).returning().all();
    res.status(201).json(sub);
  }
}

// GET /api/labs/:id/submissions
export function getSubmissions(req: Request, res: Response) {
  const labWorkId = Number(req.params.id);
  const subs = db.select({
    id: labSubmissions.id,
    studentId: labSubmissions.studentId,
    studentName: users.name,
    filePath: labSubmissions.filePath,
    comment: labSubmissions.comment,
    grade: labSubmissions.grade,
    submittedAt: labSubmissions.submittedAt,
    checkedAt: labSubmissions.checkedAt,
  })
    .from(labSubmissions)
    .innerJoin(users, eq(labSubmissions.studentId, users.id))
    .where(eq(labSubmissions.labWorkId, labWorkId))
    .all();

  res.json(subs);
}

// PUT /api/submissions/:id/review
export function reviewSubmission(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { grade, comment } = req.body;
  if (grade == null) { res.status(400).json({ error: 'grade required' }); return; }
  const gradeNum = Number(grade);
  const checkedAt = new Date().toISOString();
  db.update(labSubmissions).set({ grade: gradeNum, comment: comment ?? null, checkedAt }).where(eq(labSubmissions.id, id)).run();

  // Записать оценку в журнал на дату начала работы (startDate)
  const sub = db.select().from(labSubmissions).where(eq(labSubmissions.id, id)).get();
  if (sub) {
    const lab = db.select().from(labWorks).where(eq(labWorks.id, sub.labWorkId)).get();
    if (lab?.startDate) {
      const sg = db.select().from(studentGroups).where(eq(studentGroups.studentId, sub.studentId)).get();
      if (sg) {
        const tsg = db.select().from(teacherSubjectGroup)
          .where(and(eq(teacherSubjectGroup.subjectId, lab.subjectId), eq(teacherSubjectGroup.groupId, sg.groupId)))
          .get();
        if (tsg) {
          const slotIds = db.select().from(schedule).where(eq(schedule.tsgId, tsg.id)).all().map(s => s.id);
          if (slotIds.length) {
            const lesson = db.select().from(lessons)
              .where(and(inArray(lessons.scheduleId, slotIds), eq(lessons.date, lab.startDate!)))
              .get();
            if (lesson) {
              const existing = db.select().from(grades)
                .where(and(eq(grades.studentId, sub.studentId), eq(grades.lessonId, lesson.id))).get();
              if (existing) {
                db.update(grades).set({ value: gradeNum }).where(eq(grades.id, existing.id)).run();
              } else {
                db.insert(grades).values({ studentId: sub.studentId, lessonId: lesson.id, value: gradeNum }).run();
              }
            }
          }
        }
      }
    }
  }

  res.json({ ok: true });
}

// GET /api/submissions/my
export function getMySubmissions(req: Request, res: Response) {
  const studentId = req.user!.userId;
  const subs = db.select({
    id: labSubmissions.id,
    labWorkId: labSubmissions.labWorkId,
    labTitle: labWorks.title,
    labType: labWorks.type,
    filePath: labSubmissions.filePath,
    comment: labSubmissions.comment,
    grade: labSubmissions.grade,
    submittedAt: labSubmissions.submittedAt,
    checkedAt: labSubmissions.checkedAt,
  })
    .from(labSubmissions)
    .innerJoin(labWorks, eq(labSubmissions.labWorkId, labWorks.id))
    .where(eq(labSubmissions.studentId, studentId))
    .all();

  res.json(subs);
}
