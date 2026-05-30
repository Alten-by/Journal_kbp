import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { groups } from './groups';

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const teacherSubjectGroup = sqliteTable('teacher_subject_group', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  groupId: integer('group_id').notNull().references(() => groups.id),
});
