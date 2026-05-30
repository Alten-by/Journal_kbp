import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { lessons } from './lessons';

export const grades = sqliteTable('grades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  value: integer('value').notNull(), // 1-10
});
