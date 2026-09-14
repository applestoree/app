import React from 'react';
import { normalizePhone } from '../utils/phone.ts';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, className = '', ...props }) => {
  const normalized = normalizePhone(value);
  const localDigits = normalized.startsWith('+60') ? normalized.slice(3) : '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    onChange(digits ? `+60${digits}` : '');
  };

  return (
    <div className={`flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
      <span className="flex shrink-0 items-center border-r border-gray-200 px-3 text-xs font-semibold text-[#1d1d1f]">+60</span>
      <input
        {...props}
        value={localDigits}
        onChange={handleChange}
        type="tel"
        inputMode="numeric"
        className="min-w-0 flex-1 border-0 p-3 text-xs outline-none focus:ring-0"
      />
    </div>
  );
};
