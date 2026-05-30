import { api } from './client';
import type { LabWork, LabSubmission } from '../types';

export interface LabDetail extends LabWork {
  teamMembers: { id: number; name: string }[];
}

export interface MySubmission {
  id: number;
  labWorkId: number;
  labTitle: string;
  labType: string;
  filePath: string | null;
  comment: string | null;
  grade: number | null;
  submittedAt: string | null;
  checkedAt: string | null;
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const labsApi = {
  getLabs: (subjectId: number) =>
    api.get<LabWork[]>(`/api/labs/${subjectId}`).then((r) => r.data),

  getLabDetail: (id: number) =>
    api.get<LabDetail>(`/api/labs/${id}/detail`).then((r) => r.data),

  createLab: (formData: FormData) =>
    api.post<LabWork>('/api/labs', formData, multipart).then((r) => r.data),

  updateLab: (id: number, formData: FormData) =>
    api.put<LabWork>(`/api/labs/${id}`, formData, multipart).then((r) => r.data),

  submitLab: (id: number, formData: FormData) =>
    api.post(`/api/labs/${id}/submit`, formData, multipart).then((r) => r.data),

  getSubmissions: (id: number) =>
    api.get<LabSubmission[]>(`/api/labs/${id}/submissions`).then((r) => r.data),

  reviewSubmission: (id: number, grade: number, comment: string) =>
    api.put(`/api/submissions/${id}/review`, { grade, comment }).then((r) => r.data),

  getMySubmissions: () =>
    api.get<MySubmission[]>('/api/submissions/my').then((r) => r.data),
};
