/**
 * Mock Session Service (Pure UI Mode - No Backend/Database)
 */

export interface UserSession {
  id: string;
  deviceName: string;
  platform: string;
  osVersion: string;
  lastActive: number;
  isCurrent: boolean;
}

const MOCK_SESSIONS: UserSession[] = [
  {
    id: 'session_ios_curr',
    deviceName: 'iPhone 15 Pro Max',
    platform: 'iOS',
    osVersion: 'iOS 17.5',
    lastActive: Date.now(),
    isCurrent: true,
  },
  {
    id: 'session_mac_02',
    deviceName: 'MacBook Pro 16" (M3)',
    platform: 'macOS',
    osVersion: 'macOS 14.4',
    lastActive: Date.now() - 3600000 * 4,
    isCurrent: false,
  },
];

let activeSessions = [...MOCK_SESSIONS];

export async function registerSession(): Promise<string | null> {
  return 'session_ios_curr';
}

export function listenForSessionTermination(
  _uid: string,
  _sessionId: string,
  _onTerminated: () => void,
) {
  return () => {};
}

export async function getActiveSessions(_uid: string): Promise<UserSession[]> {
  return [...activeSessions];
}

export async function terminateSession(_uid: string, sessionId: string): Promise<void> {
  activeSessions = activeSessions.filter(s => s.id !== sessionId);
  return Promise.resolve();
}

export async function updateSessionActivity(): Promise<void> {
  return Promise.resolve();
}
