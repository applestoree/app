import React from 'react';

interface ConfirmationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmationOverlay: React.FC<ConfirmationOverlayProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] bg-white rounded-2xl p-5 shadow-2xl border border-black/5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-base font-semibold text-[#1d1d1f] mb-2">{title}</h4>
        <p className="text-xs text-[#86868b] leading-relaxed mb-6">{message}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] text-xs font-semibold rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-2.5 px-3 text-white text-xs font-semibold rounded-xl transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#0071e3] hover:bg-[#0077ed]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
