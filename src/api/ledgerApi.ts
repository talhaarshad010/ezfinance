import { apiRequest } from './client';
import type {
  ApiBill,
  ApiLoan,
  ApiTransaction,
  ApiTransfer,
  BillFieldsRequest,
  CreateTransferRequest,
  LoanFieldsRequest,
} from './types';

/** Repeated bills, loans and transfers of the signed-in user. */
export const billsApi = {
  list: () => apiRequest<ApiBill[]>('/api/bills', { auth: true }),
  create: (id: string, fields: BillFieldsRequest) =>
    apiRequest<ApiBill>('/api/bills', { method: 'POST', body: { id, ...fields }, auth: true }),
  update: (id: string, fields: BillFieldsRequest) =>
    apiRequest<ApiBill>(`/api/bills/${id}`, { method: 'PUT', body: fields, auth: true }),
  remove: (id: string) => apiRequest<void>(`/api/bills/${id}`, { method: 'DELETE', auth: true }),
  /** Logs the bill as an expense (with this transaction id) in its account. */
  pay: (id: string, transactionId: string, date: string) =>
    apiRequest<{ bill: ApiBill; transaction: ApiTransaction }>(`/api/bills/${id}/pay`, {
      method: 'POST',
      body: { transactionId, date },
      auth: true,
    }),
};

export const loansApi = {
  list: () => apiRequest<ApiLoan[]>('/api/loans', { auth: true }),
  create: (id: string, fields: LoanFieldsRequest) =>
    apiRequest<ApiLoan>('/api/loans', { method: 'POST', body: { id, ...fields }, auth: true }),
  update: (id: string, fields: LoanFieldsRequest) =>
    apiRequest<ApiLoan>(`/api/loans/${id}`, { method: 'PUT', body: fields, auth: true }),
  remove: (id: string) => apiRequest<void>(`/api/loans/${id}`, { method: 'DELETE', auth: true }),
};

export const transfersApi = {
  list: () => apiRequest<ApiTransfer[]>('/api/transfers', { auth: true }),
  create: (request: CreateTransferRequest) =>
    apiRequest<ApiTransfer>('/api/transfers', { method: 'POST', body: request, auth: true }),
  remove: (id: string) => apiRequest<void>(`/api/transfers/${id}`, { method: 'DELETE', auth: true }),
  restore: (id: string) => apiRequest<ApiTransfer>(`/api/transfers/${id}/restore`, { method: 'POST', auth: true }),
};
