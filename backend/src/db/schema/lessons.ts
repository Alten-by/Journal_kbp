import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { schedule } from './schedule';

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scheduleId: integer('schedule_id').notNull().references(() => schedule.id),
  date: text('date').notNull(), // "2026-05-30"
});
