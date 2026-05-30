import { api } from './client';
import type { LabType, AttendanceStatus } from '../types';

export interface StudentSubject {
  subjectId: number;
  subjectName: string;
  teacherName: string;
}

export interface LabEntry {
  id: number;
  title: string;
  deadline: string | null;
  isTeam: boolean;
  grade: number | null;
  comment: string | null;
  submittedAt: string | null;
}

export interface StudentSubjectDetail {
  lessonGrades: { date: string; value: number; attendance: AttendanceStatus }[];
  labs: Record<LabType, LabEntry[]>;
}

export interface GroupStudent {
  id: number;
  name: string;
}

export const studentApi = {
  getSubjects: () =>
    api.get<StudentSubject[]>('/api/student/subjects').then((r) => r.data),

  getSubject: (id: number) =>
    api.get<StudentSubjectDetail>(`/api/student/subjects/${id}`).then((r) => r.data),

  getGroupStudents: (groupId: number) =>
    api.get<GroupStudent[]>(`/api/groups/${groupId}/students`).then((r) => r.data),
};
