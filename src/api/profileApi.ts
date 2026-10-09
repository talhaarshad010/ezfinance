import { apiRequest } from './client';
import type { ApiProfile, UpdateProfileRequest } from './types';

export const profileApi = {
  get: () => apiRequest<ApiProfile>('/api/profile', { auth: true }),

  update: (request: UpdateProfileRequest) =>
    apiRequest<ApiProfile>('/api/profile', { method: 'PUT', body: request, auth: true }),
};
