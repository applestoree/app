import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Check, ChevronDown, Search, X, XCircle } from 'lucide-react';
import { ListItem } from 'konsta/react';

export interface SelectOptionItem {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeClass?: string;
  icon?: React.ReactNode;
}

export type SelectOptionValue = string | SelectOptionItem;

export function normalizeOption(opt: SelectOptionValue): SelectOptionItem {
  if (typeof opt === 'string') {
    return { value: opt, label: opt };
  }
  return opt;
}

export interface OpenSelectSheetConfig {
  title?: string;
  subtitle?: string;
  value: string;
  options: SelectOptionValue[];
  onChange: (value: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

interface AdminSelectBottomSheetContextType {
  openSelectSheet: (config: OpenSelectSheetConfig) => void;
  closeSelectSheet: () => void;
  isOpen: boolean;
}

const AdminSelectBottomSheetContext = createContext<AdminSelectBottomSheetContextType | null>(null);

export function useAdminSelectBottomSheet(): AdminSelectBottomSheetContextType {
  const ctx = useContext(AdminSelectBottomSheetContext);
  if (!ctx) {
    throw new Error('useAdminSelectBottomSheet must be used within an AdminSelectBottomSheetProvider');
  }
  return ctx;
}

export function AdminSelectBottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [activeConfig, setActiveConfig] = useState<OpenSelectSheetConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const openSelectSheet = (config: OpenSelectSheetConfig) => {
    setActiveConfig(config);
    setSearch('');
    setIsOpen(true);
  };

  const closeSelectSheet = () => {
    setIsOpen(false);
    setTimeout(() => {
      setActiveConfig(null);
      setSearch('');
    }, 250);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSelectSheet();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const normalizedOptions = useMemo(() => {
    if (!activeConfig) return [];
    return activeConfig.options.map(normalizeOption);
  }, [activeConfig]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  const handleSelect = (val: string) => {
    if (activeConfig) {
      activeConfig.onChange(val);
    }
    closeSelectSheet();
  };

  const shouldShowSearch =
    activeConfig?.searchable ?? (normalizedOptions.length > 5);

  return (
    <AdminSelectBottomSheetContext.Provider
      value={{ openSelectSheet, closeSelectSheet, isOpen }}
    >
      {children}

      {/* Global BottomSheet Portal Layer */}
      {activeConfig && (
        <div
          className={`fixed inset-0 z-[100] transition-opacity duration-250 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            onClick={closeSelectSheet}
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Sheet Modal */}
          <div
            className={`absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-transform duration-300 ease-out ${
              isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            {/* Grab handle */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-gray-300/80" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base font-semibold text-[#1d1d1f] truncate">
                  {activeConfig.title || 'Pilih Opsi'}
                </h3>
                {activeConfig.subtitle && (
                  <p className="text-[11px] text-[#86868b] truncate mt-0.5">
                    {activeConfig.subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeSelectSheet}
                className="text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] px-3 py-1.5 rounded-full bg-blue-50/60 active:scale-95 transition-all shrink-0"
              >
                Selesai
              </button>
            </div>

            {/* Optional Search */}
            {shouldShowSearch && (
              <div className="px-4 py-2.5 border-b border-gray-100 bg-[#fafafa] shrink-0">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={activeConfig.searchPlaceholder || 'Cari opsi...'}
                    className="w-full text-xs bg-white rounded-xl pl-8 pr-8 py-2 border border-gray-200 focus:border-[#0071e3] focus:outline-none transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto overscroll-contain py-1 divide-y divide-gray-50 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {activeConfig.allowEmpty && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:bg-gray-100 ${
                    !activeConfig.value
                      ? 'bg-blue-50/60 text-[#0071e3] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm italic">
                      {activeConfig.emptyLabel || '— None / Not set —'}
                    </span>
                  </div>
                  {!activeConfig.value && (
                    <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Tidak ada opsi yang cocok dengan &quot;{search}&quot;
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === activeConfig.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:bg-gray-100 ${
                        isSelected
                          ? 'bg-blue-50/60 text-[#0071e3]'
                          : 'text-[#1d1d1f] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {option.icon && (
                          <div className="shrink-0 text-gray-500">{option.icon}</div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm tracking-tight truncate ${
                                isSelected ? 'font-semibold text-[#0071e3]' : 'font-medium'
                              }`}
                            >
                              {option.label}
                            </span>
                            {option.badge && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                                  option.badgeClass || 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>

                          {option.description && (
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-300/80 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AdminSelectBottomSheetContext.Provider>
  );
}

export interface AdminSelectFieldProps {
  label?: string;
  title?: string;
  subtitle?: string;
  value: string;
  options: SelectOptionValue[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'form' | 'compact' | 'list-input' | 'pill';
  className?: string;
  buttonClassName?: string;
  id?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  searchable?: boolean;
  icon?: React.ReactNode;
}

export const AdminSelectField: React.FC<AdminSelectFieldProps> = ({
  label,
  title,
  subtitle,
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  variant = 'form',
  className = '',
  buttonClassName = '',
  id,
  allowEmpty = false,
  emptyLabel,
  searchable,
  icon,
}) => {
  const { openSelectSheet } = useAdminSelectBottomSheet();

  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const activeOption = normalizedOptions.find((opt) => opt.value === value);

  const handleClick = () => {
    if (disabled) return;
    openSelectSheet({
      title: title || label || 'Pilih Opsi',
      subtitle,
      value,
      options,
      onChange,
      allowEmpty,
      emptyLabel,
      searchable,
    });
  };

  // 1. Variant: list-input for Konsta List
  if (variant === 'list-input') {
    return (
      <ListItem
        id={id}
        link
        title={label}
        onClick={handleClick}
        disabled={disabled}
        className={className}
        after={
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#0071e3]">
            {activeOption?.label || placeholder}
            <ChevronDown size={14} className="text-gray-400" />
          </span>
        }
      />
    );
  }

  // 2. Variant: compact (e.g. for user list cards, inline tables)
  if (variant === 'compact') {
    return (
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleClick}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200/80 active:bg-gray-200 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 transition-colors disabled:opacity-50 cursor-pointer ${className}`}
      >
        {icon || activeOption?.icon}
        <span className="truncate max-w-[120px]">
          {activeOption?.label || placeholder}
        </span>
        <ChevronDown size={12} className="shrink-0 text-gray-400 ml-0.5" />
      </button>
    );
  }

  // 3. Variant: pill
  if (variant === 'pill') {
    return (
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
          activeOption
            ? 'bg-blue-50 border-blue-200 text-[#0071e3]'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        } ${className}`}
      >
        {icon || activeOption?.icon}
        <span className="truncate">{activeOption?.label || placeholder}</span>
        <ChevronDown size={13} className="shrink-0 text-gray-400" />
      </button>
    );
  }

  // 4. Variant: form (standard full-width input replacement)
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleClick}
        className={`w-full flex items-center justify-between text-xs font-medium border border-gray-200 rounded-xl px-3 py-2.5 bg-white transition-all text-left group hover:border-gray-300 focus:outline-none focus:border-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 pr-2">
          {icon || activeOption?.icon}
          <span
            className={`truncate ${
              activeOption ? 'text-[#1d1d1f] font-medium' : 'text-gray-400'
            }`}
          >
            {activeOption?.label || placeholder}
          </span>
          {activeOption?.badge && (
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                activeOption.badgeClass || 'bg-blue-50 text-blue-600'
              }`}
            >
              {activeOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors ml-1"
        />
      </button>
    </div>
  );
};
