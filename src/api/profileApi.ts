import { apiRequest } from './client';
import type { ApiProfile, UpdateProfileRequest } from './types';

export const profileApi = {
  get: () => apiRequest<ApiProfile>('/api/profile', { auth: true }),

  tourCompleted: () => apiRequest<ApiProfile>('/api/profile/tour-completed', { method: 'POST', auth: true }),

  update: (request: UpdateProfileRequest) =>
    apiRequest<ApiProfile>('/api/profile', { method: 'PUT', body: request, auth: true }),

  /** Uploads a photo file (JPEG/PNG/WebP, max 2 MB) and returns the profile with its new avatarUrl. */
  uploadAvatar: (file: { uri: string; type: string; name: string }) => {
    const form = new FormData();
    form.append('file', file as any); // React Native's FormData takes { uri, type, name } for files
    return apiRequest<ApiProfile>('/api/profile/avatar', { method: 'POST', form, auth: true });
  },

  deleteAvatar: () => apiRequest<void>('/api/profile/avatar', { method: 'DELETE', auth: true }),
};
