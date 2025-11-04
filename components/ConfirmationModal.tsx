import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = variant === 'danger'
    ? 'bg-brand-magenta text-white hover:opacity-80'
    : 'bg-brand-cyan text-brand-dark hover:bg-white';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-brand-gray p-8 rounded-xl shadow-2xl shadow-black/30 border border-brand-light-gray/20 w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="text-gray-300 mb-6">{message}</div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-brand-dark border border-gray-600 hover:border-brand-light-gray text-white font-bold py-2 px-6 rounded-lg transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`font-bold py-2 px-6 rounded-lg transition-all ${confirmButtonClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
