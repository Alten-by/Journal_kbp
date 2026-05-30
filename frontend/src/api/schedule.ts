import { api } from './client';
import type { ScheduleSlot } from '../types';

export const scheduleApi = {
  getMySchedule: () =>
    api.get<ScheduleSlot[]>('/api/schedule/me').then((r) => r.data),
};
