import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const studentGroups = sqliteTable('student_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  groupId: integer('group_id').notNull().references(() => groups.id),
});
