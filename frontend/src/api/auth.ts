import { api } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),

  register: (name: string, email: string, password: string, role: 'student' | 'teacher') =>
    api.post<AuthResponse>('/api/auth/register', { name, email, password, role }).then((r) => r.data),

  me: () =>
    api.get<User>('/api/auth/me').then((r) => r.data),
};
