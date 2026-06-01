import bcrypt from 'bcryptjs';
import { db, sqlite } from './client';
import { users, groups, studentGroups, subjects, teacherSubjectGroup, schedule, lessons } from './schema';

export function initDb() {
  // Миграция — идемпотентна (CREATE TABLE IF NOT EXISTS)
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

  // Добавить колонки если их ещё нет
  try { sqlite.exec(`ALTER TABLE lab_works ADD COLUMN start_date TEXT`); } catch { }
  try { sqlite.exec(`ALTER TABLE attendance ADD COLUMN late_minutes INTEGER`); } catch { }

  // Seed только если БД пустая
  const count = (sqlite.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (count > 0) {
    console.log('DB already seeded, skipping.');
    return;
  }

  console.log('Seeding database...');
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  const [teacher1] = db.insert(users).values({ name: 'Иван Петров', email: 'teacher1@test.com', passwordHash: hash('password'), role: 'teacher' }).returning().all();
  const [teacher2] = db.insert(users).values({ name: 'Мария Сидорова', email: 'teacher2@test.com', passwordHash: hash('password'), role: 'teacher' }).returning().all();
  const [s1] = db.insert(users).values({ name: 'Алексей Иванов', email: 'student1@test.com', passwordHash: hash('password'), role: 'student' }).returning().all();
  const [s2] = db.insert(users).values({ name: 'Дарья Козлова', email: 'student2@test.com', passwordHash: hash('password'), role: 'student' }).returning().all();
  const [s3] = db.insert(users).values({ name: 'Михаил Новиков', email: 'student3@test.com', passwordHash: hash('password'), role: 'student' }).returning().all();
  const [s4] = db.insert(users).values({ name: 'Анна Морозова', email: 'student4@test.com', passwordHash: hash('password'), role: 'student', isNew: true }).returning().all();
  const [s5] = db.insert(users).values({ name: 'Сергей Волков', email: 'student5@test.com', passwordHash: hash('password'), role: 'student', isExpelled: true }).returning().all();

  const [group1] = db.insert(groups).values({ name: 'КБ-11' }).returning().all();
  db.insert(groups).values({ name: 'КБ-12' }).run();

  db.insert(studentGroups).values([
    { studentId: s1.id, groupId: group1.id },
    { studentId: s2.id, groupId: group1.id },
    { studentId: s3.id, groupId: group1.id },
    { studentId: s4.id, groupId: group1.id },
    { studentId: s5.id, groupId: group1.id },
  ]).run();

  const [math] = db.insert(subjects).values({ name: 'Математика' }).returning().all();
  const [prog] = db.insert(subjects).values({ name: 'Программирование' }).returning().all();

  const [tsg1] = db.insert(teacherSubjectGroup).values({ teacherId: teacher1.id, subjectId: math.id, groupId: group1.id }).returning().all();
  const [tsg2] = db.insert(teacherSubjectGroup).values({ teacherId: teacher2.id, subjectId: prog.id, groupId: group1.id }).returning().all();

  const [sch1] = db.insert(schedule).values({ tsgId: tsg1.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: '101' }).returning().all();
  const [sch2] = db.insert(schedule).values({ tsgId: tsg2.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:30', room: '202' }).returning().all();

  db.insert(lessons).values([
    { scheduleId: sch1.id, date: '2026-05-12' },
    { scheduleId: sch1.id, date: '2026-05-19' },
    { scheduleId: sch1.id, date: '2026-05-26' },
    { scheduleId: sch2.id, date: '2026-05-14' },
    { scheduleId: sch2.id, date: '2026-05-21' },
    { scheduleId: sch2.id, date: '2026-05-28' },
  ]).run();

  console.log('Seed complete.');
}
