import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

export interface UserSession {
  id: string;
  deviceName: string;
  platform: string;
  osVersion: string;
  lastActive: number;
  isCurrent: boolean;
}

let currentSessionId: string | null = null;

/** Register the current device session in Firebase */
export async function registerSession(): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) return null;

  try {
    const deviceName = await DeviceInfo.getDeviceName();
    const platform = Platform.OS;
    const osVersion = DeviceInfo.getSystemVersion();
    const uniqueId = await DeviceInfo.getUniqueId();
    
    // We use uniqueId + platform to identify the device session
    // Or we can just use a new push key if we want to allow multiple sessions per device
    currentSessionId = uniqueId;

    const sessionData = {
      deviceName,
      platform,
      osVersion,
      lastActive: database.ServerValue.TIMESTAMP,
    };

    await database().ref(`/users/${user.uid}/sessions/${currentSessionId}`).set(sessionData);
    return currentSessionId;
  } catch (error) {
    console.error('Register Session Error:', error);
    return null;
  }
}

/** Listen for this session being terminated remotely */
export function listenForSessionTermination(
  uid: string, 
  sessionId: string, 
  onTerminated: () => void
) {
  const sessionRef = database().ref(`/users/${uid}/sessions/${sessionId}`);
  
  const callback = (snapshot: any) => {
    if (!snapshot.exists()) {
      onTerminated();
    }
  };

  sessionRef.on('value', callback);
  return () => sessionRef.off('value', callback);
}

/** Get all active sessions for the user */
export async function getActiveSessions(uid: string): Promise<UserSession[]> {
  try {
    const snapshot = await database().ref(`/users/${uid}/sessions`).once('value');
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    const uniqueId = await DeviceInfo.getUniqueId();

    return Object.keys(data).map(key => ({
      id: key,
      ...data[key],
      isCurrent: key === uniqueId,
    }));
  } catch (error) {
    console.error('Get Active Sessions Error:', error);
    return [];
  }
}

/** Terminate a specific session */
export async function terminateSession(uid: string, sessionId: string): Promise<void> {
  try {
    await database().ref(`/users/${uid}/sessions/${sessionId}`).remove();
  } catch (error) {
    console.error('Terminate Session Error:', error);
    throw error;
  }
}

/** Update the last active timestamp for the current session */
export async function updateSessionActivity(): Promise<void> {
  const user = auth().currentUser;
  if (!user || !currentSessionId) return;

  try {
    await database().ref(`/users/${user.uid}/sessions/${currentSessionId}`).update({
      lastActive: database.ServerValue.TIMESTAMP,
    });
  } catch (error) {
    console.error('Update Session Activity Error:', error);
  }
}
