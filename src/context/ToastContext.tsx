import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

/** Optional inline action, e.g. Undo after a delete. Toasts with an action stay up longer (5s). */
export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  title?: string;
  message: string;
  type: ToastType;
  visible: boolean;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    title?: string,
    duration?: number,
    action?: ToastAction,
  ) => void;
  hideToast: () => void;
  toast: ToastState;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    title: '',
    message: '',
    type: 'info',
    visible: false,
  });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 3000, action?: ToastAction) => {
      setToast({ title, message, type, visible: true, action });

      // Auto hide; a newer toast restarts the timer so it isn't hidden early by an older one.
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        () => setToast(prev => ({ ...prev, visible: false })),
        action ? Math.max(duration, 5000) : duration,
      );
    },
    [],
  );

  const hideToast = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
