'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTaskContext } from '@/lib/store/task-store';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function PersonalCalendarPage() {
  const {
    currentUser,
    personalTodos,
    personalNotes,
    togglePersonalTodo,
  } = useTaskContext();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  const todayIso = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  if (!currentUser) return null;

  // Month navigation
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
  };

  // Month info
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Calculate days in month & offset
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  // Normalize so Monday is 0, Sunday is 6
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Selected date's todos & notes
  const dayTodos = personalTodos.filter(t => t.targetDate === selectedDate);
  const dayNotes = personalNotes.filter(n => n.linkedDate === selectedDate);

  // Time grid slots (08:00 - 20:00)
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const formatReadableDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Jadwal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau agenda bulanan dan alokasi waktu harian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/milt/todos"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Day Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Calendar (7 Cols on desktop) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                {monthNames[currentMonth]} {currentYear}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
            <span>Min</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty offset cells before 1st day */}
            {Array.from({ length: startingDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-14 sm:h-20 rounded-2xl bg-slate-50/40" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
              const isSelected = selectedDate === cellDateStr;
              const isToday = todayIso === cellDateStr;

              // Todos and notes on this date
              const todosOnDate = personalTodos.filter(t => t.targetDate === cellDateStr);
              const pendingOnDate = todosOnDate.filter(t => !t.isCompleted);
              const completedOnDate = todosOnDate.filter(t => t.isCompleted);
              const notesOnDate = personalNotes.filter(n => n.linkedDate === cellDateStr);

              return (
                <div
                  key={cellDateStr}
                  onClick={() => setSelectedDate(cellDateStr)}
                  className={`h-14 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                      : isToday
                      ? 'border-emerald-300 bg-emerald-50/30 hover:border-indigo-300'
                      : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                          ? 'text-indigo-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Total item count indicator on desktop */}
                    {todosOnDate.length > 0 && (
                      <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400">
                        {completedOnDate.length}/{todosOnDate.length}
                      </span>
                    )}
                  </div>

                  {/* Indicator Dots */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {pendingOnDate.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-500"
                        title={`${pendingOnDate.length} to-do aktif`}
                      />
                    )}
                    {completedOnDate.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        title={`${completedOnDate.length} to-do selesai`}
                      />
                    )}
                    {notesOnDate.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500"
                        title={`${notesOnDate.length} catatan tersemat`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Legend */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>To-Do Aktif</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Selesai</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Catatan Rapat</span>
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Schedule & Linked Items */}
        <div className="lg:col-span-5 space-y-4">
          {/* Header Card for Selected Date */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Agenda Tanggal Terpilih
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {formatReadableDate(selectedDate)}
                </h3>
              </div>

              <Link
                href="/milt/todos"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Buka Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* To-Do Checklist on this date */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block">
                Daftar To-Do ({dayTodos.filter(t => t.isCompleted).length}/{dayTodos.length})
              </span>

              {dayTodos.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  Belum ada to-do pada tanggal ini.
                </p>
              ) : (
                dayTodos.map(todo => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <button
                      onClick={() => togglePersonalTodo(todo.id)}
                      className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                    >
                      {todo.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          todo.isCompleted
                            ? 'line-through text-slate-400 font-normal'
                            : 'text-slate-900 font-bold'
                        }
                      >
                        {todo.title}
                      </span>
                    </button>

                    {todo.startTime && (
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                        {todo.startTime}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Linked Notes preview on this date */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Catatan Terhubung ({dayNotes.length})</span>
                </span>
                <Link
                  href="/milt/notes"
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700"
                >
                  Buka Notes
                </Link>
              </div>

              {dayNotes.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  Belum ada catatan rapat untuk tanggal ini.
                </p>
              ) : (
                dayNotes.map(n => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1"
                  >
                    <h4 className="font-bold text-amber-950">{n.title}</h4>
                    <p className="text-[11px] text-amber-900 line-clamp-2 leading-relaxed">
                      {n.contentMarkdown}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Time Grid (Visual Hours Alocation) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Alokasi Jam Kerja ({selectedDate})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Time-blocking</span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {timeSlots.map(slot => {
                // Find any todo scheduled around this slot
                const matchedTodo = dayTodos.find(t => t.startTime && t.startTime.startsWith(slot.slice(0, 2)));

                return (
                  <div
                    key={slot}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-400 w-12 shrink-0">
                      {slot}
                    </span>

                    {matchedTodo ? (
                      <div className="flex-1 bg-indigo-50 border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-lg font-bold flex items-center justify-between">
                        <span className="truncate">{matchedTodo.title}</span>
                        <span className="text-[10px] font-mono text-indigo-600 shrink-0 ml-2">
                          {matchedTodo.startTime} - {matchedTodo.endTime || ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 border-b border-dashed border-slate-200/60 h-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
