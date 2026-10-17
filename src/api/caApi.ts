import { apiRequest } from './client';
import {
  analyzeAndAnswerLocally,
  buildActionProposalResponse,
  CrossAppFinancialSnapshot,
  extractFactsFromMessage,
  serializeMemoryForLlm,
  type CaSeg,
} from '../features/main/screens/ca/caEngine';
import {
  extractExecutableActions,
  normalizeFact,
  sanitizeAiAction,
  type CaExecutableAction,
} from '../features/main/screens/ca/caActions';
import { detectLanguage } from '../features/main/screens/ca/caLanguage';

export interface CaChatHistoryItem {
  role: 'user' | 'ai';
  text: string;
}

export interface CaChatResponse {
  segments: CaSeg[];
  extractedFacts: { key: string; value: string }[];
  /** Proposed changes. Nothing is saved until the user confirms them on the CA screen. */
  executableActions: CaExecutableAction[];
  /** "ai": the model answered · "calculated": the app's own calculation (model unreachable or failed). */
  source: 'ai' | 'calculated';
}

interface ServerResponse {
  segments: CaSeg[];
  extractedFacts?: { key: string; value: string }[];
  executableAction?: unknown;
  source?: 'ai' | 'calculated';
}

function mergeFacts(local: { key: string; value: string }[], fromAi: { key: string; value: string }[] | undefined) {
  const merged = [...local];
  for (const raw of fromAi ?? []) {
    const fact = raw?.key && raw?.value ? normalizeFact(raw.key, raw.value) : null;
    if (fact && !merged.some(m => m.key.toLowerCase() === fact.key.toLowerCase())) merged.push(fact);
  }
  return merged;
}

export const caApi = {
  /**
   * Sends the question, the user's live Memory Bank snapshot and the app's own calculation to the
   * Personal CA endpoint (`/api/ca/chat`). Commands found by the app's rules take priority over the
   * model's (their amounts are read exactly); the model's are checked before they are shown.
   */
  async ask(
    question: string,
    snapshot: CrossAppFinancialSnapshot,
    history: CaChatHistoryItem[],
    isSignedIn: boolean,
  ): Promise<CaChatResponse> {
    const goalNames = snapshot.goals.map(g => g.name);
    const localSegments = analyzeAndAnswerLocally(question, snapshot);
    const localFacts = extractFactsFromMessage(question);
    const localActions = extractExecutableActions(question, goalNames);
    const calculated: CaChatResponse = {
      segments: localSegments,
      extractedFacts: localFacts,
      executableActions: localActions,
      source: 'calculated',
    };
    if (!isSignedIn) {
      return calculated;
    }

    try {
      const response = await apiRequest<ServerResponse>('/api/ca/chat', {
        method: 'POST',
        auth: true,
        timeoutMs: 30_000,
        body: {
          question,
          memoryContext: serializeMemoryForLlm(snapshot),
          deterministicBaseline: localSegments.map(s => s.t).join(''),
          history: history.slice(-6),
        },
      });
      if (!response || !Array.isArray(response.segments) || response.segments.length === 0) {
        return calculated;
      }

      const aiAction = sanitizeAiAction(response.executableAction, goalNames);
      const actions = localActions.length > 0 ? localActions : aiAction ? [aiAction] : [];
      return {
        // With an action, the reply is a neutral proposal: the model's text tends to say "Done!".
        segments: actions.length > 0 ? buildActionProposalResponse(actions, detectLanguage(question)) : response.segments,
        extractedFacts: mergeFacts(localFacts, response.extractedFacts),
        executableActions: actions,
        source: response.source === 'calculated' ? 'calculated' : 'ai',
      };
    } catch {
      // Server unreachable: the app's own calculation, clearly labelled as such.
      return calculated;
    }
  },
};
