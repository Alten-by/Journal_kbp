import 'dotenv/config';
import { sqlite } from './client';

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','teacher')),
    is_expelled INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS student_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES users(id),
    group_id INTEGER NOT NULL REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS teacher_subject_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    group_id INTEGER NOT NULL REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tsg_id INTEGER NOT NULL REFERENCES teacher_subject_group(id),
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    room TEXT
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL REFERENCES schedule(id),
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES users(id),
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    status TEXT NOT NULL DEFAULT 'present' CHECK(status IN ('present','absent','late'))
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES users(id),
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    value INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lab_works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('lab','practical','test','theory')),
    deadline TEXT,
    is_team INTEGER NOT NULL DEFAULT 0,
    created_at TEXT,
    task_file_path TEXT
  );

  CREATE TABLE IF NOT EXISTS lab_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_work_id INTEGER NOT NULL REFERENCES lab_works(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    file_path TEXT,
    comment TEXT,
    grade INTEGER,
    submitted_at TEXT,
    checked_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lab_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_work_id INTEGER NOT NULL REFERENCES lab_works(id),
    student_id INTEGER NOT NULL REFERENCES users(id)
  );
`);

// Добавить колонку если её ещё нет (для существующих БД)
try { sqlite.exec(`ALTER TABLE lab_works ADD COLUMN created_at TEXT`); } catch { /* already exists */ }

console.log('Migration complete.');
sqlite.close();
