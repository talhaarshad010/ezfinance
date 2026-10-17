import * as Keychain from 'react-native-keychain';

/**
 * Persistent store for the user's Personal CA Memory Bank overrides and custom context facts.
 * Stored securely on-device per user ID so edits in the Memory Bank modal (Employer, Risk Score,
 * Dependents, Sec 62 Used, or custom "+ Add Context" entries) survive app restarts.
 */

export interface CustomMemoryMap {
  /** Overrides for built-in keys (e.g. 'Salary', 'Employer', 'Tax Profile', 'Risk Score', 'City', 'Dependents', 'Sec 62 Used') and user-added keys. */
  facts: Record<string, string>;
  /** Custom keys added via "+ Add Context" (in order of creation). */
  customKeys: string[];
}

const SERVICE_PREFIX = 'com.ezfinance.caMemory.';

const EMPTY_MEMORY: CustomMemoryMap = {
  facts: {},
  customKeys: [],
};

export async function loadCustomMemory(userId: string): Promise<CustomMemoryMap> {
  try {
    const service = `${SERVICE_PREFIX}${userId || 'guest'}`;
    const entry = await Keychain.getGenericPassword({ service });
    if (!entry || !entry.password) return EMPTY_MEMORY;
    const parsed = JSON.parse(entry.password) as Partial<CustomMemoryMap>;
    return {
      facts: parsed.facts && typeof parsed.facts === 'object' ? parsed.facts : {},
      customKeys: Array.isArray(parsed.customKeys) ? parsed.customKeys : [],
    };
  } catch {
    return EMPTY_MEMORY;
  }
}

export async function saveCustomMemory(userId: string, data: CustomMemoryMap): Promise<void> {
  try {
    const service = `${SERVICE_PREFIX}${userId || 'guest'}`;
    await Keychain.setGenericPassword('ca_memory', JSON.stringify(data), { service });
  } catch {
    // Ignore keychain write failures
  }
}

const INTRO_SERVICE_PREFIX = 'com.ezfinance.caIntro.';

/** Whether this user has already seen the Personal CA welcome (shown once, on the first visit). */
export async function loadCaIntroSeen(userId: string): Promise<boolean> {
  try {
    const entry = await Keychain.getGenericPassword({ service: `${INTRO_SERVICE_PREFIX}${userId || 'guest'}` });
    return !!entry && entry.password === 'seen';
  } catch {
    // Can't tell: don't block the chat with the welcome.
    return true;
  }
}

export async function markCaIntroSeen(userId: string): Promise<void> {
  try {
    await Keychain.setGenericPassword('ca_intro', 'seen', { service: `${INTRO_SERVICE_PREFIX}${userId || 'guest'}` });
  } catch {
    // Ignore keychain write failures: the welcome would just show again next time.
  }
}

const CHAT_SERVICE_PREFIX = 'com.ezfinance.caChat.';
/** Only the most recent messages are kept on the device. */
const MAX_SAVED_MESSAGES = 60;

/** The user's Personal CA conversation, as saved on this device (oldest first). Empty if none. */
export async function loadCaChat<T>(userId: string): Promise<T[]> {
  try {
    const entry = await Keychain.getGenericPassword({ service: `${CHAT_SERVICE_PREFIX}${userId || 'guest'}` });
    if (!entry || !entry.password) return [];
    const parsed = JSON.parse(entry.password);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function saveCaChat<T>(userId: string, messages: T[]): Promise<void> {
  try {
    await Keychain.setGenericPassword('ca_chat', JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)), {
      service: `${CHAT_SERVICE_PREFIX}${userId || 'guest'}`,
    });
  } catch {
    // Ignore keychain write failures: the chat just won't be there next time.
  }
}
