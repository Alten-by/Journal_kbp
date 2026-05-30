import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { lessons } from './lessons';

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  status: text('status', { enum: ['present', 'absent', 'late'] }).notNull().default('present'),
  lateMinutes: integer('late_minutes'), // null = просто "О", число = минуты опоздания
});
