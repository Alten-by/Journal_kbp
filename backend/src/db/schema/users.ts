import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['student', 'teacher'] }).notNull(),
  isExpelled: integer('is_expelled', { mode: 'boolean' }).notNull().default(false),
  isNew: integer('is_new', { mode: 'boolean' }).notNull().default(false),
});
