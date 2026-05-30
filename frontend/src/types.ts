export type Role = 'student' | 'teacher';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type LabType = 'lab' | 'practical' | 'test' | 'theory';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ScheduleSlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subjectId: number;
  subjectName: string;
  groupId: number;
  groupName: string;
  teacherName?: string;
}

export interface JournalCell {
  lessonId: number;
  date: string;
  attendance: AttendanceStatus | null;
  grade: number | null;
}

export interface JournalStudent {
  id: number;
  name: string;
  isExpelled: boolean;
  isNew: boolean;
  cells: JournalCell[];
}

export interface JournalResponse {
  lessons: { id: number; scheduleId: number; date: string }[];
  students: JournalStudent[];
}

export interface LabWork {
  id: number;
  subjectId: number;
  title: string;
  description: string | null;
  type: LabType;
  deadline: string | null;
  isTeam: boolean;
  taskFilePath: string | null;
}

export interface LabSubmission {
  id: number;
  studentId: number;
  studentName: string;
  filePath: string | null;
  comment: string | null;
  grade: number | null;
  submittedAt: string | null;
  checkedAt: string | null;
}
