import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface StandalonePageProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

export const StandalonePage: React.FC<StandalonePageProps> = ({
  title,
  onBack,
  rightAction,
  footer,
  children,
  id,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      id={id || 'standalone-page'}
      className="w-full max-w-[500px] h-full min-h-full flex flex-col bg-[#f5f5f7] shadow-xl border-x border-black/5 relative overflow-hidden"
    >
      {/* Standalone Header */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-black/5 px-3 py-3 flex items-center justify-between min-h-[52px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1 text-[#0071e3] hover:bg-blue-50/50 rounded-full transition-colors flex items-center gap-0.5 active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
            <span className="text-xs font-medium">Back</span>
          </button>
        </div>

        {title && (
          <h1 className="text-xs font-semibold text-[#1d1d1f] tracking-tight truncate max-w-[220px] text-center">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-1 min-w-[50px] justify-end">
          {rightAction || null}
        </div>
      </header>

      {/* Main standalone content */}
      <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
        {children}
      </div>

      {/* Bottom Footer (natural like BottomNav in AppShell) */}
      {footer || null}
    </div>
  );
};
