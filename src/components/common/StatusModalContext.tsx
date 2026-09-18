// src/components/common/StatusModalContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { StatusModal, StatusModalOptions } from './StatusModal';

interface StatusModalContextType {
  showStatusModal: (options: StatusModalOptions) => void;
  hideStatusModal: () => void;
}

const StatusModalContext = createContext<StatusModalContextType | undefined>(undefined);

// Global ref for non-hook / utility calls
let globalShowModal: ((options: StatusModalOptions) => void) | null = null;
let globalHideModal: (() => void) | null = null;

export const AppAlert = {
  show: (options: StatusModalOptions) => {
    if (globalShowModal) {
      globalShowModal(options);
    } else {
      console.warn('StatusModalProvider not mounted yet');
    }
  },
  success: (title: string, message: string, onConfirm?: () => void, buttonText?: string) => {
    AppAlert.show({
      type: 'success',
      title,
      message,
      onConfirm,
      buttonText,
    });
  },
  error: (title: string, message: string, onConfirm?: () => void, buttonText?: string) => {
    AppAlert.show({
      type: 'error',
      title,
      message,
      onConfirm,
      buttonText,
    });
  },
  warning: (title: string, message: string, onConfirm?: () => void, buttonText?: string) => {
    AppAlert.show({
      type: 'warning',
      title,
      message,
      onConfirm,
      buttonText,
    });
  },
  info: (title: string, message: string, onConfirm?: () => void, buttonText?: string) => {
    AppAlert.show({
      type: 'info',
      title,
      message,
      onConfirm,
      buttonText,
    });
  },
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
  ) => {
    AppAlert.show({
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      isDestructive,
    });
  },
  hide: () => {
    if (globalHideModal) {
      globalHideModal();
    }
  },
};

export const StatusModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [modalOptions, setModalOptions] = useState<StatusModalOptions | null>(null);

  const showStatusModal = useCallback((options: StatusModalOptions) => {
    setModalOptions(options);
    setVisible(true);
  }, []);

  const hideStatusModal = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    globalShowModal = showStatusModal;
    globalHideModal = hideStatusModal;
    return () => {
      globalShowModal = null;
      globalHideModal = null;
    };
  }, [showStatusModal, hideStatusModal]);

  return (
    <StatusModalContext.Provider value={{ showStatusModal, hideStatusModal }}>
      {children}
      <StatusModal
        visible={visible}
        options={modalOptions}
        onClose={hideStatusModal}
      />
    </StatusModalContext.Provider>
  );
};

export const useStatusModal = (): StatusModalContextType => {
  const context = useContext(StatusModalContext);
  if (!context) {
    throw new Error('useStatusModal must be used within a StatusModalProvider');
  }
  return context;
};
