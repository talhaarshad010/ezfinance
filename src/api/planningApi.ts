import { apiRequest } from './client';
import type { ApiBudget, ApiEnvelope, ApiGoal, EnvelopeFieldsRequest, GoalFieldsRequest } from './types';

/** Savings goals of the signed-in user. */
export const goalsApi = {
  list: () => apiRequest<ApiGoal[]>('/api/goals', { auth: true }),
  create: (id: string, fields: GoalFieldsRequest) =>
    apiRequest<ApiGoal>('/api/goals', { method: 'POST', body: { id, ...fields }, auth: true }),
  update: (id: string, fields: GoalFieldsRequest) =>
    apiRequest<ApiGoal>(`/api/goals/${id}`, { method: 'PUT', body: fields, auth: true }),
  /** Archives the goal. */
  remove: (id: string) => apiRequest<void>(`/api/goals/${id}`, { method: 'DELETE', auth: true }),
  /** Puts money towards the goal (negative takes some out); returns the goal with its new total. */
  contribute: (id: string, contributionId: string, amount: number, date: string) =>
    apiRequest<ApiGoal>(`/api/goals/${id}/contributions`, {
      method: 'POST',
      body: { id: contributionId, amount, date },
      auth: true,
    }),
};

/** Monthly budget and envelopes of the signed-in user. */
export const budgetApi = {
  get: () => apiRequest<ApiBudget>('/api/budget', { auth: true }),
  setLimit: (monthlyLimit: number) =>
    apiRequest<ApiBudget>('/api/budget', { method: 'PUT', body: { monthlyLimit }, auth: true }),
  createEnvelope: (id: string, fields: EnvelopeFieldsRequest) =>
    apiRequest<ApiEnvelope>('/api/budget/envelopes', { method: 'POST', body: { id, ...fields }, auth: true }),
  updateEnvelope: (id: string, fields: EnvelopeFieldsRequest) =>
    apiRequest<ApiEnvelope>(`/api/budget/envelopes/${id}`, { method: 'PUT', body: fields, auth: true }),
  removeEnvelope: (id: string) => apiRequest<void>(`/api/budget/envelopes/${id}`, { method: 'DELETE', auth: true }),
};
