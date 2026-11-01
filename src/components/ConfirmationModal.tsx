import React, { useEffect } from 'react';
import { showConfirm } from '../utils/sweetalert';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยันดำเนินการ',
  cancelText = 'ยกเลิก',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (isOpen) {
      showConfirm(title, message, confirmText, cancelText, isDestructive).then((confirmed) => {
        if (confirmed) {
          onConfirm();
        } else {
          onCancel();
        }
      });
    }
  }, [isOpen, title, message, confirmText, cancelText, isDestructive, onConfirm, onCancel]);

  return null;
};
