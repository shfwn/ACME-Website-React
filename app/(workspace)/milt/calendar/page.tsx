'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTaskContext, PersonalTodoColor } from '@/lib/store/task-store';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

export default function PersonalCalendarPage() {
  const {
    currentUser,
    personalTodos,
    personalNotes,
    togglePersonalTodo,
  } = useTaskContext();

  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  // View Mode: 'MONTH' or 'WEEK' (matching Image #1 pill switch)
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Week navigation (base date for the week)
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    return new Date(d.setDate(diff));
  });

  if (!currentUser) return null;

  // Month navigation handlers
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayIso);

    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setWeekStartDate(new Date(d.setDate(diff)));
  };

  // Week navigation handlers
  const prevWeek = () => {
    const next = new Date(weekStartDate);
    next.setDate(next.getDate() - 7);
    setWeekStartDate(next);
  };

  const nextWeek = () => {
    const next = new Date(weekStartDate);
    next.setDate(next.getDate() + 7);
    setWeekStartDate(next);
  };

  // Month info
  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
  ];

  // Calculate days in month & offset
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const startingDayIndex = (firstDayOfMonth + 6) % 7; // Monday = 0
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Selected date's todos & notes
  const dayTodos = personalTodos.filter(t => t.targetDate === selectedDate);
  const dayNotes = personalNotes.filter(n => n.linkedDate === selectedDate);

  // Calculate Time Distribution for Selected Day
  let totalScheduledMinutes = 0;
  dayTodos.forEach(t => {
    if (t.startTime && t.endTime) {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) totalScheduledMinutes += diff;
    } else {
      totalScheduledMinutes += 60;
    }
  });
  const freeMinutes = Math.max(0, 10 * 60 - totalScheduledMinutes);
  const freeHoursText = (freeMinutes / 60).toFixed(1).replace('.', ':') + 'H FREE TIME';

  // Format readable dates
  const formatReadableDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  // Week days array (7 days: Monday to Sunday)
  const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    return {
      date: d,
      iso,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      fullName: d.toLocaleDateString('id-ID', { weekday: 'long' }),
    };
  });

  // Time grid hours (08:00 to 20:00)
  const timeHours = Array.from({ length: 13 }, (_, i) => {
    const h = i + 8;
    return `${h.toString().padStart(2, '0')}:00`;
  });

  // Check for time conflicts on a specific day
  const detectConflicts = (todos: typeof personalTodos) => {
    const timedTodos = todos.filter(t => t.startTime && t.endTime);
    const conflicts = new Set<string>();

    for (let i = 0; i < timedTodos.length; i++) {
      for (let j = i + 1; j < timedTodos.length; j++) {
        const a = timedTodos[i];
        const b = timedTodos[j];
        if (a.targetDate === b.targetDate) {
          if (a.startTime! < b.endTime! && a.endTime! > b.startTime!) {
            conflicts.add(a.id);
            conflicts.add(b.id);
          }
        }
      }
    }
    return conflicts;
  };

  const currentWeekTodos = personalTodos.filter(t =>
    currentWeekDays.some(w => w.iso === t.targetDate)
  );
  const weekConflicts = detectConflicts(currentWeekTodos);

  // Export week schedule to CSV
  const handleExportWeekCSV = () => {
    const headers = ['Tanggal', 'Hari', 'Jam Mulai', 'Jam Selesai', 'Judul Agenda', 'Kategori', 'Prioritas', 'Status'];
    const rows = currentWeekTodos.map(t => [
      `"${t.targetDate}"`,
      `"${getDayName(t.targetDate)}"`,
      `"${t.startTime || '-'}"`,
      `"${t.endTime || '-'}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.isCompleted ? 'SELESAI' : 'BELUM'}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.join('\n')].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `jadwal-mingguan-${currentWeekDays[0].iso}-sd-${currentWeekDays[6].iso}.csv`;
    link.click();
  };

  // Pastel theme styles matching Image #1
  const cardThemes: Record<
    PersonalTodoColor,
    { bg: string; text: string; border: string; sub: string }
  > = {
    yellow: {
      bg: 'bg-[#FFE28A]',
      text: 'text-[#614500]',
      border: 'border-[#F2CF67]',
      sub: 'text-[#7D5B05]',
    },
    pink: {
      bg: 'bg-[#F7B6C4]',
      text: 'text-[#751B30]',
      border: 'border-[#E89EAE]',
      sub: 'text-[#8E283F]',
    },
    mint: {
      bg: 'bg-[#90E5D2]',
      text: 'text-[#0B4F43]',
      border: 'border-[#72D6C0]',
      sub: 'text-[#0F6052]',
    },
    periwinkle: {
      bg: 'bg-[#C5D0FB]',
      text: 'text-[#243575]',
      border: 'border-[#A3B2F5]',
      sub: 'text-[#364993]',
    },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. Top Header Bar with Pill Switcher (WEEK | MONTH) matching Image #1 */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#6C7EC2] text-white flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {viewMode === 'MONTH'
                ? `${monthNames[currentMonth]} ${currentYear}`
                : `Jadwal Mingguan (${currentWeekDays[0].dayNum} - ${currentWeekDays[6].dayNum} ${monthNames[currentWeekDays[0].date.getMonth()]})`}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Kelola time-blocking harian dan pantau agenda mingguan secara visual.
            </p>
          </div>
        </div>

        {/* Pill switcher for WEEK / MONTH + Export button */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Pill Switcher from Image #1 */}
          <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'WEEK'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              WEEK
            </button>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'MONTH'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              MONTH
            </button>
          </div>

          {/* Export to CSV */}
          <button
            onClick={handleExportWeekCSV}
            title="Export jadwal minggu ini ke spreadsheet CSV"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export Spreadsheet</span>
          </button>

          {/* New Todo Button */}
          <Link
            href="/milt/todos"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MODE MONTH (BULANAN) - PERSIS SEPERTI DI GAMBAR       */}
      {/* ======================================================== */}
      {viewMode === 'MONTH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Clean Month Grid with Circular Segmented Rings */}
          <div className="lg:col-span-8 bg-white p-5 sm:p-7 rounded-[28px] border border-slate-200/80 shadow-xs space-y-5">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {monthNames[currentMonth]} <span className="text-slate-400 font-normal">{currentYear}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                >
                  Hari Ini
                </button>
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-1">
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
              <span>Min</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {/* Empty offset before day 1 */}
              {Array.from({ length: startingDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 opacity-40" />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                const isSelected = selectedDate === cellDateStr;
                const isToday = todayIso === cellDateStr;

                const todosOnDate = personalTodos.filter(t => t.targetDate === cellDateStr);
                const hasEvents = todosOnDate.length > 0;

                // Color categories presence for multi-segment ring
                const hasYellow = todosOnDate.some(t => (t.colorTheme || 'yellow') === 'yellow');
                const hasPink = todosOnDate.some(t => t.colorTheme === 'pink');
                const hasMint = todosOnDate.some(t => t.colorTheme === 'mint');

                return (
                  <div
                    key={cellDateStr}
                    onClick={() => setSelectedDate(cellDateStr)}
                    className={`h-16 sm:h-20 p-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center relative select-none ${
                      isSelected
                        ? 'bg-indigo-50/70 border-2 border-[#6C7EC2]'
                        : isToday
                        ? 'bg-emerald-50/40 border border-emerald-300 hover:bg-slate-50'
                        : 'hover:bg-slate-50/80 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {/* Ring Container around Date Number (Mimicking Image #1) */}
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                      {/* SVG Multi-Segment Ring if date has events and not selected */}
                      {hasEvents && !isSelected && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                          {/* Segment 1: Yellow arc */}
                          {hasYellow && (
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#FFE28A"
                              strokeWidth="2.5"
                              strokeDasharray="25 75"
                              strokeDashoffset="0"
                            />
                          )}
                          {/* Segment 2: Pink arc */}
                          {hasPink && (
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#F7B6C4"
                              strokeWidth="2.5"
                              strokeDasharray="25 75"
                              strokeDashoffset="-30"
                            />
                          )}
                          {/* Segment 3: Mint arc */}
                          {hasMint && (
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#90E5D2"
                              strokeWidth="2.5"
                              strokeDasharray="25 75"
                              strokeDashoffset="-60"
                            />
                          )}
                        </svg>
                      )}

                      {/* Day Number */}
                      <span
                        className={`text-xs sm:text-sm font-extrabold flex items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? 'w-8 h-8 sm:w-9 sm:h-9 bg-[#6C7EC2] text-white shadow-xs'
                            : isToday
                            ? 'w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {dayNum.toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Small item count badge */}
                    {hasEvents && (
                      <span className="text-[9px] font-extrabold text-slate-400 mt-0.5">
                        {todosOnDate.length} agenda
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Day Schedule Cards (Matching Image #1 Right Panel) */}
          <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-5">
            {/* Header: Day name + Circular '+' button in Periwinkle Blue */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {getDayName(selectedDate)}
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {formatReadableDate(selectedDate)}
                </span>
              </div>

              <Link
                href="/milt/todos"
                className="w-9 h-9 rounded-full bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
                title="Tambah Agenda untuk hari ini"
              >
                <Plus className="w-5 h-5" />
              </Link>
            </div>

            {/* Events Distribution Bar (Image #1 Style) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">
                  Events Distribution
                </span>
                <span className="text-[11px] font-extrabold text-[#6C7EC2]">
                  {freeHoursText}
                </span>
              </div>

              {/* Segmented Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200/60">
                <div className="h-full bg-[#FFE28A] flex-1 rounded-sm" title="Warm Yellow" />
                <div className="h-full bg-[#F7B6C4] flex-1 rounded-sm" title="Coral Pink" />
                <div className="h-full bg-[#90E5D2] flex-1 rounded-sm" title="Pastel Mint" />
              </div>
            </div>

            {/* Schedule Cards for Selected Day */}
            <div className="space-y-3 pt-1">
              {dayTodos.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada jadwal</p>
                  <p className="text-[11px] text-slate-400">Klik tombol + di atas untuk menambahkan agenda.</p>
                </div>
              ) : (
                dayTodos.map(todo => {
                  const themeKey = todo.colorTheme || 'yellow';
                  const theme = cardThemes[themeKey];

                  return (
                    <div
                      key={todo.id}
                      className={`p-4 rounded-2xl border transition-all space-y-1.5 shadow-2xs ${theme.bg} ${theme.border} ${
                        todo.isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-xs font-extrabold ${theme.text}`}>
                          {todo.title}
                        </h3>
                        <button
                          onClick={() => togglePersonalTodo(todo.id)}
                          className="cursor-pointer shrink-0"
                          title="Tandai selesai"
                        >
                          {todo.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className={`font-mono ${theme.sub}`}>
                          {todo.startTime || '--:--'} - {todo.endTime || '--:--'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/10 text-slate-800">
                          {todo.category}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Linked Daily Notes for this Date */}
            {dayNotes.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#6C7EC2]" />
                    <span>Catatan Terhubung ({dayNotes.length})</span>
                  </span>
                  <Link href="/milt/notes" className="text-[11px] text-[#6C7EC2] hover:underline">
                    Lihat &rarr;
                  </Link>
                </div>
                {dayNotes.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                    <span className="font-bold text-slate-900 block truncate">{n.title}</span>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{n.contentMarkdown.replace(/<[^>]*>?/gm, ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODE WEEK (FULL-WIDTH 7-DAY TIMETABLE)                */}
      {/* ======================================================== */}
      {viewMode === 'WEEK' && (
        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-5">
          {/* Week Controls & Conflict Alert */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextWeek}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                title="Minggu Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-extrabold text-slate-800 ml-2">
                {currentWeekDays[0].dayNum} {monthNames[currentWeekDays[0].date.getMonth()]} -{' '}
                {currentWeekDays[6].dayNum} {monthNames[currentWeekDays[6].date.getMonth()]}{' '}
                {currentWeekDays[6].date.getFullYear()}
              </span>
            </div>

            {/* Visual Conflict Notice if any */}
            {weekConflicts.size > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Terdeteksi {weekConflicts.size} agenda dengan waktu bentrok!</span>
              </div>
            )}
          </div>

          {/* 7-Day Timetable Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day Column Headers */}
              <div className="grid grid-cols-8 gap-2 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase py-2">
                  Jam
                </div>
                {currentWeekDays.map(d => {
                  const isCurrentDay = d.iso === todayIso;
                  const todosOnThisDay = personalTodos.filter(t => t.targetDate === d.iso);

                  return (
                    <div
                      key={d.iso}
                      className={`text-center py-2 px-1 rounded-2xl border transition-all ${
                        isCurrentDay
                          ? 'bg-[#6C7EC2] text-white border-[#5C6EB2] shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      <span className="text-[11px] font-bold block uppercase tracking-wide opacity-80">
                        {d.dayName}
                      </span>
                      <span className="text-sm font-black block mt-0.5">
                        {d.dayNum}
                      </span>
                      <span className="text-[10px] font-semibold opacity-70 block">
                        {todosOnThisDay.length} agenda
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Rows */}
              <div className="space-y-2 pt-3">
                {timeHours.map(hour => {
                  const hourPrefix = hour.slice(0, 2);

                  return (
                    <div key={hour} className="grid grid-cols-8 gap-2 items-stretch min-h-[52px]">
                      {/* Hour Label */}
                      <div className="text-[11px] font-mono font-bold text-slate-400 pt-1 border-t border-slate-100">
                        {hour}
                      </div>

                      {/* 7 Columns for Days */}
                      {currentWeekDays.map(d => {
                        // Find todos scheduled at this hour
                        const matchedTodos = personalTodos.filter(t => {
                          if (t.targetDate !== d.iso) return false;
                          if (!t.startTime) return false;
                          return t.startTime.startsWith(hourPrefix);
                        });

                        return (
                          <div
                            key={d.iso + hour}
                            className="p-1 rounded-xl bg-slate-50/40 border border-slate-100/80 space-y-1 relative"
                          >
                            {matchedTodos.map(todo => {
                              const themeKey = todo.colorTheme || 'yellow';
                              const theme = cardThemes[themeKey];
                              const isConflicted = weekConflicts.has(todo.id);

                              return (
                                <div
                                  key={todo.id}
                                  className={`p-2 rounded-xl text-xs font-bold border shadow-2xs space-y-1 ${theme.bg} ${theme.border} ${theme.text} ${
                                    isConflicted ? 'ring-2 ring-rose-500' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="line-clamp-1 leading-tight text-[11px]">
                                      {todo.title}
                                    </span>
                                    {isConflicted && (
                                      <span
                                        className="text-[9px] px-1 py-0.2 rounded bg-rose-600 text-white font-extrabold"
                                        title="Bentrok jam kegiatan"
                                      >
                                        Bentrok
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-mono block ${theme.sub}`}>
                                    {todo.startTime} - {todo.endTime || ''}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
