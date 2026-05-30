import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, sqlite } from './client';
import { users, groups, studentGroups, subjects, teacherSubjectGroup, schedule, lessons } from './schema';

sqlite.exec(`
  DELETE FROM lab_teams; DELETE FROM lab_submissions; DELETE FROM lab_works;
  DELETE FROM grades; DELETE FROM attendance; DELETE FROM lessons;
  DELETE FROM schedule; DELETE FROM teacher_subject_group;
  DELETE FROM student_groups; DELETE FROM subjects; DELETE FROM groups; DELETE FROM users;
`);

const hash = (p: string) => bcrypt.hashSync(p, 10);

// Users
const [teacher1] = db.insert(users).values({ name: 'Иван Петров', email: 'teacher1@test.com', passwordHash: hash('password'), role: 'teacher' }).returning().all();
const [teacher2] = db.insert(users).values({ name: 'Мария Сидорова', email: 'teacher2@test.com', passwordHash: hash('password'), role: 'teacher' }).returning().all();

const [s1] = db.insert(users).values({ name: 'Алексей Иванов', email: 'student1@test.com', passwordHash: hash('password'), role: 'student' }).returning().all();
const [s2] = db.insert(users).values({ name: 'Дарья Козлова', email: 'student2@test.com', passwordHash: hash('password'), role: 'student' }).returning().all();
const [s3] = db.insert(users).values({ name: 'Михаил Новиков', email: 'student3@test.com', passwordHash: hash('password'), role: 'student' }).returning().all();
const [s4] = db.insert(users).values({ name: 'Анна Морозова', email: 'student4@test.com', passwordHash: hash('password'), role: 'student', isNew: true }).returning().all();
const [s5] = db.insert(users).values({ name: 'Сергей Волков', email: 'student5@test.com', passwordHash: hash('password'), role: 'student', isExpelled: true }).returning().all();

// Groups
const [group1] = db.insert(groups).values({ name: 'КБ-11' }).returning().all();
const [group2] = db.insert(groups).values({ name: 'КБ-12' }).returning().all();

// Students → groups
db.insert(studentGroups).values([
  { studentId: s1.id, groupId: group1.id },
  { studentId: s2.id, groupId: group1.id },
  { studentId: s3.id, groupId: group1.id },
  { studentId: s4.id, groupId: group1.id },
  { studentId: s5.id, groupId: group1.id },
]).run();

// Subjects
const [math] = db.insert(subjects).values({ name: 'Математика' }).returning().all();
const [prog] = db.insert(subjects).values({ name: 'Программирование' }).returning().all();

// Teacher → subject → group
const [tsg1] = db.insert(teacherSubjectGroup).values({ teacherId: teacher1.id, subjectId: math.id, groupId: group1.id }).returning().all();
const [tsg2] = db.insert(teacherSubjectGroup).values({ teacherId: teacher2.id, subjectId: prog.id, groupId: group1.id }).returning().all();

// Schedule (recurring slots)
const [sch1] = db.insert(schedule).values({ tsgId: tsg1.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: '101' }).returning().all();
const [sch2] = db.insert(schedule).values({ tsgId: tsg2.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:30', room: '202' }).returning().all();

// Concrete lessons
db.insert(lessons).values([
  { scheduleId: sch1.id, date: '2026-05-12' },
  { scheduleId: sch1.id, date: '2026-05-19' },
  { scheduleId: sch1.id, date: '2026-05-26' },
  { scheduleId: sch2.id, date: '2026-05-14' },
  { scheduleId: sch2.id, date: '2026-05-21' },
  { scheduleId: sch2.id, date: '2026-05-28' },
]).run();

console.log('Seed complete.');
console.log('teacher1@test.com / password  →  teacher');
console.log('teacher2@test.com / password  →  teacher');
console.log('student1@test.com / password  →  student (group КБ-11)');
console.log('student2@test.com / password  →  student');
console.log('student3@test.com / password  →  student');
console.log('student4@test.com / password  →  student (isNew)');
console.log('student5@test.com / password  →  student (isExpelled)');
sqlite.close();
