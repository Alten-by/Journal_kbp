import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { subjects } from './subjects';
import { users } from './users';

export const labWorks = sqliteTable('lab_works', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', { enum: ['lab', 'practical', 'test', 'theory'] }).notNull(),
  startDate: text('start_date'), // "2026-05-30" — дата выдачи/начала работы
  deadline: text('deadline'),   // "2026-06-15"
  isTeam: integer('is_team', { mode: 'boolean' }).notNull().default(false),
  taskFilePath: text('task_file_path'),
  createdAt: text('created_at'),
});

export const labSubmissions = sqliteTable('lab_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  labWorkId: integer('lab_work_id').notNull().references(() => labWorks.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  filePath: text('file_path'),
  comment: text('comment'),
  grade: integer('grade'),
  submittedAt: text('submitted_at'),
  checkedAt: text('checked_at'),
});

export const labTeams = sqliteTable('lab_teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  labWorkId: integer('lab_work_id').notNull().references(() => labWorks.id),
  studentId: integer('student_id').notNull().references(() => users.id),
});
