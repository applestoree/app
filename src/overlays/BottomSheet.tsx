import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  id?: string;
  position?: 'bottom' | 'right';
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  id = 'bottom-sheet',
  position = 'bottom',
}) => {
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[500px] h-full flex ${
          position === 'right' ? 'justify-end' : 'items-end'
        }`}
      >
        {position === 'right' ? (
          /* Right drawer layout (for Cart) */
          <div
            className="w-[88%] max-w-[420px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-250 animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-white">
              <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight">
                {title || 'Sheet'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
              {children}
            </div>
          </div>
        ) : (
          /* Bottom sheet layout */
          <div
            className="w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col transform transition-transform duration-250 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between bg-white">
              <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight">
                {title || 'Options'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col p-4">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
