'use client';

import React, { useState } from 'react';
import { useTaskContext, Priority } from '@/lib/store/task-store';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export default function PersonalTodosPage() {
  const {
    currentUser,
    personalTodos,
    addPersonalTodo,
    togglePersonalTodo,
    deletePersonalTodo,
    rolloverPendingTodos,
  } = useTaskContext();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Kerja');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  if (!currentUser) return null;

  // Quick Date Navigation
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Format readable date
  const formatReadableDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Filter todos for selected date
  const dateTodos = personalTodos.filter(t => {
    const matchesDate = t.targetDate === selectedDate;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesDate && matchesCategory;
  });

  // Calculate pending overdue todos from before today/selected date
  const pendingOverdue = personalTodos.filter(t => !t.isCompleted && t.targetDate < selectedDate);

  const completedCount = dateTodos.filter(t => t.isCompleted).length;
  const totalCount = dateTodos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmitTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addPersonalTodo({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      targetDate: selectedDate,
      startTime: newStartTime || undefined,
      endTime: newEndTime || undefined,
      isCompleted: false,
      priority: newPriority,
      category: newCategory,
    });

    setNewTitle('');
    setNewDescription('');
    setNewStartTime('');
    setNewEndTime('');
    setIsFormOpen(false);
  };

  const priorityColors: Record<Priority, { label: string; badge: string }> = {
    LOW: { label: 'Biasa', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    MEDIUM: { label: 'Sedang', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    HIGH: { label: 'Tinggi', badge: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold' },
    URGENT: { label: 'Mendesak', badge: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in pb-12">
      {/* 1. Header Banner & Date Selector */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Agenda
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola tugas harian dan jadwalkan ulang agenda tertunda.
            </p>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors cursor-pointer"
              title="Hari Berikutnya"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              {formatReadableDate(selectedDate)}
            </span>
            {selectedDate === todayStr && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Hari Ini
              </span>
            )}
          </div>

          {/* Date Picker Native Input */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-400">Pilih Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => e.target.value && setSelectedDate(e.target.value)}
              className="text-xs font-bold py-1 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Progres Agenda Hari Ini</span>
            <span className="text-indigo-600 font-extrabold">
              {completedCount}/{totalCount} Selesai ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Daily Rollover Engine Alert (if overdue pending exist) */}
      {pendingOverdue.length > 0 && selectedDate >= todayStr && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-amber-950">
                Ada {pendingOverdue.length} To-Do Tertunda dari Hari Sebelumnya
              </h2>
              <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                Pindahkan agenda yang belum selesai agar tidak tercecer dan langsung masuk ke agenda hari ini.
              </p>
            </div>
          </div>

          <button
            onClick={() => rolloverPendingTodos(selectedDate)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Pindahkan ke Hari Ini</span>
          </button>
        </div>
      )}

      {/* 3. Filter & Add Button Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'Kerja', 'Pribadi', 'Fokus', 'Penting'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isFormOpen ? 'Tutup Form' : 'Tambah To-Do'}</span>
        </button>
      </div>

      {/* 4. Form Tambah To-Do Baru (Collapsible) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitTodo}
          className="bg-white p-5 rounded-3xl border border-indigo-200 shadow-sm space-y-3.5 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Agenda Baru untuk {formatReadableDate(selectedDate)}</span>
            </h2>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Judul Agenda To-Do *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Contoh: Diskusi strategi produk dengan tim..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Catatan Rinci (Opsional)</label>
            <input
              type="text"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Poin penting atau link acuan..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Kategori</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold"
              >
                <option value="Kerja">Kerja</option>
                <option value="Pribadi">Pribadi</option>
                <option value="Fokus">Fokus</option>
                <option value="Penting">Penting</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Prioritas</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as Priority)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold"
              >
                <option value="LOW">Biasa</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Jam Mulai</label>
              <input
                type="time"
                value={newStartTime}
                onChange={e => setNewStartTime(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Jam Selesai</label>
              <input
                type="time"
                value={newEndTime}
                onChange={e => setNewEndTime(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Simpan Agenda
            </button>
          </div>
        </form>
      )}

      {/* 5. Daftar To-Do Items */}
      <div className="space-y-2.5">
        {dateTodos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Tidak ada agenda pada tanggal ini</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hari ini bersih dari to-do. Klik tombol &ldquo;Tambah To-Do&rdquo; di atas untuk menjadwalkan pekerjaan Anda.
            </p>
          </div>
        ) : (
          dateTodos.map(todo => {
            const hasTimeSlot = todo.startTime || todo.endTime;

            return (
              <div
                key={todo.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex items-start justify-between gap-3 shadow-2xs ${
                  todo.isCompleted
                    ? 'border-slate-200/80 bg-slate-50/60'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Checkbox toggle */}
                <button
                  onClick={() => togglePersonalTodo(todo.id)}
                  className="mt-0.5 cursor-pointer shrink-0"
                  title={todo.isCompleted ? 'Batalkan selesai' : 'Tandai selesai'}
                >
                  {todo.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-extrabold ${
                        todo.isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-900'
                      }`}
                    >
                      {todo.title}
                    </span>

                    {/* Category pill */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {todo.category}
                    </span>

                    {/* Priority badge */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${priorityColors[todo.priority].badge}`}>
                      {priorityColors[todo.priority].label}
                    </span>
                  </div>

                  {todo.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {todo.description}
                    </p>
                  )}

                  {/* Time slot indicator */}
                  {hasTimeSlot && (
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-mono font-bold pt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {todo.startTime || '--:--'} s/d {todo.endTime || '--:--'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deletePersonalTodo(todo.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Hapus agenda to-do"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
