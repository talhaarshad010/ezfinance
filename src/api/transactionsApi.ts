import { apiRequest } from './client';
import type {
  ApiTransaction,
  ApiTransactionPage,
  CreateTransactionRequest,
  SplitPartRequest,
  TransactionFieldsRequest,
} from './types';

export const transactionsApi = {
  /** One page, newest first. */
  list: (cursor?: string | null, limit = 500) =>
    apiRequest<ApiTransactionPage>(
      `/api/transactions?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      { auth: true },
    ),

  /** Every transaction of the signed-in user, page by page. */
  listAll: async () => {
    const all: ApiTransaction[] = [];
    let cursor: string | null = null;
    do {
      const page: ApiTransactionPage = await transactionsApi.list(cursor);
      all.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return all;
  },

  create: (request: CreateTransactionRequest) =>
    apiRequest<ApiTransaction>('/api/transactions', { method: 'POST', body: request, auth: true }),

  update: (id: string, request: TransactionFieldsRequest) =>
    apiRequest<ApiTransaction>(`/api/transactions/${id}`, { method: 'PUT', body: request, auth: true }),

  remove: (id: string) => apiRequest<void>(`/api/transactions/${id}`, { method: 'DELETE', auth: true }),

  restore: (id: string) =>
    apiRequest<ApiTransaction>(`/api/transactions/${id}/restore`, { method: 'POST', auth: true }),

  split: (id: string, parts: SplitPartRequest[]) =>
    apiRequest<ApiTransaction[]>(`/api/transactions/${id}/split`, { method: 'POST', body: { parts }, auth: true }),
};
