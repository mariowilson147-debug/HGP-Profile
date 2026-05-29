"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
  date: string;
  setDate: (date: string) => void;
  label?: string;
}

export default function DatePicker({ date, setDate, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initialDate = date ? new Date(date) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateLabel = (d: string) => {
    if (!d) return "";
    const dateObj = new Date(d);
    return `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Adjust for timezone offset to prevent date shifting
    const offset = clickedDate.getTimezoneOffset();
    const localDate = new Date(clickedDate.getTime() - (offset*60*1000));
    setDate(localDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const header = weekDays.map(wd => (
      <div key={wd} className="text-center font-bold text-[13px] text-slate-800 mb-2">
        {wd}
      </div>
    ));

    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`prev-${i}`} className="text-center p-2 text-[14px] font-medium text-slate-300">
          {daysInPrevMonth - firstDay + i + 1}
        </div>
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      // Create date without timezone shift
      const cellDate = new Date(year, month, i);
      const offset = cellDate.getTimezoneOffset();
      const localCellDate = new Date(cellDate.getTime() - (offset*60*1000));
      const dateStr = localCellDate.toISOString().split('T')[0];
      const isSelected = dateStr === date;

      let bgClass = "bg-transparent";
      let textClass = "text-slate-800";
      
      if (isSelected) {
        bgClass = "bg-[#2ab6eb] rounded-full shadow-sm";
        textClass = "text-white font-bold";
      }

      days.push(
        <button
          key={`current-${i}`}
          onClick={() => handleDateClick(i)}
          className={`text-center w-8 h-8 mx-auto flex items-center justify-center text-[14px] transition-all hover:bg-[#dff3fb] hover:text-[#2ab6eb] hover:rounded-full ${bgClass} ${textClass}`}
        >
          {i}
        </button>
      );
    }

    const totalCells = days.length;
    for (let i = 1; i <= 42 - totalCells; i++) {
      days.push(
        <div key={`next-${i}`} className="text-center p-2 text-[14px] font-medium text-slate-300">
          {i}
        </div>
      );
    }

    return (
      <div className="p-4 bg-white rounded-2xl border border-[#2ab6eb] shadow-[0_10px_30px_-10px_rgba(42,182,235,0.2)] mt-3">
        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={handlePrevMonth} className="text-[#2ab6eb] hover:bg-[#dff3fb] p-1 rounded-lg transition-colors">
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <h3 className="font-bold text-slate-900 text-lg">
            {currentMonth.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <button onClick={handleNextMonth} className="text-[#2ab6eb] hover:bg-[#dff3fb] p-1 rounded-lg transition-colors">
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-y-2">
          {header}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full md:w-auto flex flex-col gap-1" ref={dropdownRef}>
      {label && <span className="text-sm font-medium text-slate-500 pl-1">{label}</span>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-44 h-12 bg-white rounded-xl border border-[#2ab6eb] shadow-sm flex items-center justify-between px-4 hover:shadow-md transition-all outline-none"
      >
        <span className="text-[17px] font-medium text-slate-800">
          {formatDateLabel(date)}
        </span>
        <Calendar className="text-slate-400" size={22} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[100%] left-0 w-[320px] z-50"
          >
            {renderCalendar()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
