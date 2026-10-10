import { apiRequest } from './client';
import type { ApiAccount, CreateAccountRequest } from './types';

export const accountsApi = {
  list: () => apiRequest<ApiAccount[]>('/api/accounts', { auth: true }),

  create: (request: CreateAccountRequest) =>
    apiRequest<ApiAccount>('/api/accounts', { method: 'POST', body: request, auth: true }),

  /** Sets what the account holds now; its transactions stay as they are. */
  updateBalance: (id: string, balance: number) =>
    apiRequest<ApiAccount>(`/api/accounts/${id}/balance`, { method: 'PUT', body: { balance }, auth: true }),

  remove: (id: string) => apiRequest<void>(`/api/accounts/${id}`, { method: 'DELETE', auth: true }),
};
