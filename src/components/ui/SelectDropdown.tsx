"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SelectDropdown({ value, onChange, options, placeholder = "Select...", className = "", disabled = false }: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full h-10 bg-white rounded-xl border flex items-center justify-between px-3 transition-all outline-none text-left ${disabled ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-70' : 'border-slate-200 shadow-sm hover:border-[#2ab6eb]'}`}
      >
        <span className={`text-[14px] font-medium truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 left-0 w-full min-w-[200px] max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[14px] font-medium transition-colors ${
                  value === opt.value ? 'bg-[#eef8fc] text-[#2ab6eb]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Check size={16} className="text-[#2ab6eb] shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
