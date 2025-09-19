import React from 'react';
import './ConfirmModal.css';

type Props = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Delete', cancelLabel = 'Cancel' }: Props) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-message">{message}</div>
        <div className="modal-buttons">
          <button className="modal-confirm" onClick={onConfirm}>{confirmLabel}</button>
          <button className="modal-cancel" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
