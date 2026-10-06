import React from 'react';

interface FirebaseSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Pure UI Mode: Pass-through provider (Firebase database operations removed)
 */
export const FirebaseSyncProvider: React.FC<FirebaseSyncProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default FirebaseSyncProvider;
