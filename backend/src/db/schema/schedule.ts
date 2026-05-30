import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { teacherSubjectGroup } from './subjects';

export const schedule = sqliteTable('schedule', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tsgId: integer('tsg_id').notNull().references(() => teacherSubjectGroup.id),
  dayOfWeek: integer('day_of_week').notNull(), // 1=Mon ... 6=Sat
  startTime: text('start_time').notNull(), // "09:00"
  endTime: text('end_time').notNull(),     // "10:30"
  room: text('room'),
});
