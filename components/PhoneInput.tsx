'use client';

import React, { useId } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  error?: boolean;
  // If true, calls onChange with only the 10 numeric digits. If false (default), calls with '+91 ' prefix.
  rawOnly?: boolean;
}

/**
 * Extracts clean 10-digit Indian subscriber number from any phone string
 * (handling "+91", "91", spaces, hyphens, leading 0, etc.)
 */
export function extractSubscriberNumber(phoneStr: string): string {
  if (!phoneStr) return '';
  
  let str = phoneStr.trim();
  
  // 1. If starts with international prefix like "+91", "+ 91", "0091", strip it immediately
  if (str.startsWith('+91')) {
    str = str.slice(3).trim();
  } else if (str.startsWith('+ 91')) {
    str = str.slice(4).trim();
  } else if (str.startsWith('0091')) {
    str = str.slice(4).trim();
  }
  
  // 2. Remove all non-digits
  let digits = str.replace(/\D/g, '');
  
  // 3. If someone entered a leading 0 (trunk prefix, e.g. 09876543210), strip the leading 0
  if (digits.length > 10 && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  
  // 4. If someone typed or pasted 12 digits starting with 91 (e.g. 919876543210 without +), strip the 91
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  
  return digits.slice(0, 10);
}

/**
 * Formats 10 digits into "98765 43210" for readability
 */
export function formatSubscriberNumber(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 10);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return clean;
}

/**
 * Crisp SVG Indian Tricolor Flag (Saffron, White, Green + Ashoka Chakra)
 * Renders identically and vibrantly on all OS and devices.
 */
export function IndiaFlagIcon({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="160" fill="#FF9933" />
      <rect y="160" width="640" height="160" fill="#FFFFFF" />
      <rect y="320" width="640" height="160" fill="#138808" />
      <circle cx="320" cy="240" r="60" stroke="#000080" strokeWidth="8" fill="none" />
      <circle cx="320" cy="240" r="14" fill="#000080" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="320"
          y1="240"
          x2={320 + 56 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={240 + 56 * Math.sin((i * 15 * Math.PI) / 180)}
          stroke="#000080"
          strokeWidth="3.5"
        />
      ))}
    </svg>
  );
}

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '98765 43210',
  required = false,
  disabled = false,
  autoFocus = false,
  className = '',
  error = false,
  rawOnly = false,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  // Extract the subscriber portion (max 10 digits)
  const subscriberDigits = extractSubscriberNumber(value);
  const displayValue = formatSubscriberNumber(subscriberDigits);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = extractSubscriberNumber(rawVal);
    
    if (rawOnly) {
      onChange(cleanDigits);
    } else {
      onChange(cleanDigits ? `+91 ${cleanDigits}` : '');
    }
  };

  return (
    <div
      className={`relative flex items-center w-full rounded-xl border bg-gray-50/50 transition-all duration-150 focus-within:bg-white focus-within:ring-2 ${
        error
          ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-100 bg-red-50/20'
          : 'border-gray-200 focus-within:border-qubink-teal focus-within:ring-qubink-teal/10'
      } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''} ${className}`}
    >
      {/* Prefix Badge: Phone Icon + Indian Flag + +91 */}
      <div className="flex items-center gap-2 pl-3.5 pr-2 py-2.5 sm:py-3 select-none shrink-0 pointer-events-none">
        <Phone className="w-4 h-4 text-qubink-muted shrink-0" />
        <div className="flex items-center gap-1.5 font-bold text-xs text-qubink-navy">
          <span className="overflow-hidden rounded-[2px] border border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] inline-flex shrink-0">
            <IndiaFlagIcon className="w-4 h-3 block" />
          </span>
          <span className="text-qubink-navy font-bold text-xs tracking-tight">+91</span>
        </div>
        <div className="h-4 w-px bg-gray-200 ml-1 shrink-0" />
      </div>

      {/* Actual 10-Digit Mobile Number Input */}
      <input
        id={inputId}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={16} // Allows pasted numbers with +91, 0, or spaces to be cleanly parsed
        className="w-full bg-transparent pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-qubink-navy placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
      />
    </div>
  );
}

export default PhoneInput;
