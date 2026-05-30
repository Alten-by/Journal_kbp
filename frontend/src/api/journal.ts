import { api } from './client';
import type { JournalResponse, AttendanceStatus } from '../types';

export interface MyJournalEntry {
  subjectId: number;
  cells: { lessonId: number; date: string; attendance: AttendanceStatus | null; lateMinutes: number | null; grade: number | null }[];
}

export const journalApi = {
  getMyJournal: () =>
    api.get<MyJournalEntry[]>('/api/journal/my').then((r) => r.data),

  getTeacherJournal: (subjectId: number, groupId: number) =>
    api.get<JournalResponse>(`/api/journal/${subjectId}/${groupId}`).then((r) => r.data),

  addLesson: (scheduleId: number, date: string) =>
    api.post<{ id: number; scheduleId: number; date: string }>(
      '/api/journal/lessons',
      { scheduleId, date },
    ).then((r) => r.data),

  setAttendance: (studentId: number, lessonId: number, status: AttendanceStatus, lateMinutes?: number | null) =>
    api.put('/api/journal/attendance', { studentId, lessonId, status, lateMinutes }).then((r) => r.data),

  clearAttendance: (studentId: number, lessonId: number) =>
    api.delete('/api/journal/attendance', { data: { studentId, lessonId } }).then((r) => r.data),

  setGrade: (studentId: number, lessonId: number, value: number) =>
    api.put('/api/journal/grades', { studentId, lessonId, value }).then((r) => r.data),

  clearGrade: (studentId: number, lessonId: number) =>
    api.delete('/api/journal/grades', { data: { studentId, lessonId } }).then((r) => r.data),
};
