import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

export interface SelectBottomDrawerOption {
  value: string;
  label: string;
}

export interface SelectBottomDrawerProps {
  label: string;
  value: string;
  options: SelectBottomDrawerOption[];
  onChange: (value: string) => void;
}

export const SelectBottomDrawer: React.FC<SelectBottomDrawerProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition-colors active:scale-[0.99]"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-[#86868b]">{label}</span>
          <span className="mt-0.5 block truncate text-sm font-medium text-[#1d1d1f]">
            {selectedOption?.label || 'Select'}
          </span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-[#86868b]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" role="presentation">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="relative w-full max-w-[500px] overflow-hidden rounded-t-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-4">
              <h2 className="text-base font-semibold text-[#1d1d1f]">{label}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full bg-[#f5f5f7] p-2 text-[#1d1d1f] active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-colors active:bg-[#f5f5f7]"
                  >
                    <span className={selected ? 'font-semibold text-[#1d1d1f]' : 'text-[#1d1d1f]'}>
                      {option.label}
                    </span>
                    {selected && <Check size={19} className="shrink-0 text-[#0071e3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
