'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTaskContext, Priority, PersonalTodoColor } from '@/lib/store/task-store';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';

export default function PersonalTodosPage() {
  const {
    currentUser,
    personalTodos,
    addPersonalTodo,
    togglePersonalTodo,
    deletePersonalTodo,
    togglePersonalTodoSubtask,
    addPersonalTodoSubtask,
    deletePersonalTodoSubtask,
    rolloverPendingTodos,
    personalNotes,
    savePersonalNote,
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
  const [newColorTheme, setNewColorTheme] = useState<PersonalTodoColor>('yellow');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter & Subtask states
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedTodoIds, setExpandedTodoIds] = useState<Record<string, boolean>>({});
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Quick Daily Note drawer state
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');

  if (!currentUser) return null;

  // Quick Date Navigation
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
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

  const getDayNameOnly = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
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

  // Calculate Time Distribution & Free Time (assuming 8:00 to 18:00 work day = 10h = 600m)
  let totalScheduledMinutes = 0;
  dateTodos.forEach(t => {
    if (t.startTime && t.endTime) {
      const [startH, startM] = t.startTime.split(':').map(Number);
      const [endH, endM] = t.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      if (endMin > startMin) {
        totalScheduledMinutes += endMin - startMin;
      }
    } else {
      totalScheduledMinutes += 45; // Default 45m estimate for unscheduled
    }
  });

  const totalCapacityMinutes = 10 * 60; // 10 hours workday
  const freeMinutes = Math.max(0, totalCapacityMinutes - totalScheduledMinutes);
  const freeHoursDisplay = (freeMinutes / 60).toFixed(1).replace('.', ':') + 'H';
  const scheduledHoursDisplay = (totalScheduledMinutes / 60).toFixed(1) + ' jam';

  // Toggle subtasks expand
  const toggleExpandTodo = (id: string) => {
    setExpandedTodoIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle adding subtask to a todo
  const handleAddSubtask = (todoId: string) => {
    const val = (newSubtaskInputs[todoId] || '').trim();
    if (!val) return;
    addPersonalTodoSubtask(todoId, val);
    setNewSubtaskInputs(prev => ({ ...prev, [todoId]: '' }));
    setExpandedTodoIds(prev => ({ ...prev, [todoId]: true }));
  };

  // Form submit
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
      colorTheme: newColorTheme,
    });

    setNewTitle('');
    setNewDescription('');
    setNewStartTime('');
    setNewEndTime('');
    setIsFormOpen(false);
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (dateTodos.length === 0) {
      alert('Tidak ada agenda to-do untuk diekspor pada tanggal ini.');
      return;
    }

    const headers = [
      'Tanggal',
      'Hari',
      'Jam Mulai',
      'Jam Selesai',
      'Kategori',
      'Prioritas',
      'Judul Tugas',
      'Deskripsi',
      'Status',
      'Subtask Selesai',
      'Total Subtask',
    ];

    const rows = dateTodos.map(t => {
      const dayName = getDayNameOnly(t.targetDate);
      const subtaskDone = (t.subtasks || []).filter(s => s.isCompleted).length;
      const subtaskTotal = (t.subtasks || []).length;
      return [
        `"${t.targetDate}"`,
        `"${dayName}"`,
        `"${t.startTime || '-'}"`,
        `"${t.endTime || '-'}"`,
        `"${t.category}"`,
        `"${t.priority}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${t.isCompleted ? 'SELESAI' : 'BELUM'}"`,
        `"${subtaskDone}"`,
        `"${subtaskTotal}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `todo-jadwal-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy as TSV (Tab Separated) for pasting into Google Sheets / Excel
  const handleCopyTSV = () => {
    if (dateTodos.length === 0) return;

    const headers = ['Tanggal', 'Jam Mulai', 'Jam Selesai', 'Kategori', 'Prioritas', 'Judul Tugas', 'Status'];
    const rows = dateTodos.map(t => [
      t.targetDate,
      t.startTime || '-',
      t.endTime || '-',
      t.category,
      t.priority,
      t.title,
      t.isCompleted ? 'SELESAI' : 'BELUM',
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    });
  };

  // Find linked note for selected date
  const currentDayNote = personalNotes.find(n => n.linkedDate === selectedDate);

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;

    if (currentDayNote) {
      savePersonalNote({
        id: currentDayNote.id,
        contentMarkdown: currentDayNote.contentMarkdown + `\n- ${quickNoteText.trim()}`,
      });
    } else {
      savePersonalNote({
        title: `Catatan Harian — ${formatReadableDate(selectedDate)}`,
        linkedDate: selectedDate,
        contentMarkdown: `### Log Harian (${formatReadableDate(selectedDate)})\n- ${quickNoteText.trim()}`,
        tags: ['Harian', 'Logbook'],
      });
    }
    setQuickNoteText('');
  };

  // Pastel card style map extracted from Image #1
  const cardThemeStyles: Record<
    PersonalTodoColor,
    {
      container: string;
      title: string;
      subText: string;
      badge: string;
      border: string;
      accentBar: string;
      timeBadge: string;
    }
  > = {
    yellow: {
      container: 'bg-[#FFF9E6] text-[#553C00]',
      title: 'text-[#4A3400]',
      subText: 'text-[#6E4E00]',
      badge: 'bg-[#FFE28A] text-[#553C00] border-[#E8C45A]',
      border: 'border-[#F2D16C]',
      accentBar: 'bg-[#F9C942]',
      timeBadge: 'bg-[#FFE9A3] text-[#553C00]',
    },
    pink: {
      container: 'bg-[#FFF1F4] text-[#6E182A]',
      title: 'text-[#5F1222]',
      subText: 'text-[#87253B]',
      badge: 'bg-[#F7B6C4] text-[#6E182A] border-[#E79CAB]',
      border: 'border-[#F2AAB9]',
      accentBar: 'bg-[#F28299]',
      timeBadge: 'bg-[#FCD3DC] text-[#6E182A]',
    },
    mint: {
      container: 'bg-[#EDFAF6] text-[#08483C]',
      title: 'text-[#063C32]',
      subText: 'text-[#0C5B4C]',
      badge: 'bg-[#90E5D2] text-[#08483C] border-[#69D5BE]',
      border: 'border-[#74DAC3]',
      accentBar: 'bg-[#40C9A8]',
      timeBadge: 'bg-[#BFF3E7] text-[#08483C]',
    },
    periwinkle: {
      container: 'bg-[#F2F5FE] text-[#202F68]',
      title: 'text-[#1B2758]',
      subText: 'text-[#2D3E82]',
      badge: 'bg-[#C5D0FB] text-[#202F68] border-[#A8B7F7]',
      border: 'border-[#B4C2F8]',
      accentBar: 'bg-[#6C7EC2]',
      timeBadge: 'bg-[#DCE3FD] text-[#202F68]',
    },
  };
  const priorityBadges: Record<Priority, { label: string; badge: string }> = {
    LOW: { label: 'Biasa', badge: 'bg-white/60 text-slate-700 border-white/80' },
    MEDIUM: { label: 'Sedang', badge: 'bg-white/70 text-slate-800 border-white/90 font-medium' },
    HIGH: { label: 'Tinggi', badge: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold' },
    URGENT: { label: 'Mendesak', badge: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. Top Bar: Header, Date Switcher, & Spreadsheet Converter */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6C7EC2]" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                To-Do Harian & Jadwal
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Rencanakan kegiatan hari ini, checklist subtask, dan konversi rekap ke format spreadsheet.
            </p>
          </div>

          {/* Quick Date Stepper & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200">
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
                    ? 'bg-[#6C7EC2] text-white shadow-xs'
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

            {/* Direct Spreadsheet Conversion Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCSV}
                title="Download CSV Spreadsheet"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleCopyTSV}
                title="Salin untuk di-paste langsung ke Google Sheets / Excel"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                {copiedCsv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Sheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Date Details Bar & Interactive Native Date Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#6C7EC2] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {new Date(selectedDate + 'T00:00:00').getDate()}
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                {formatReadableDate(selectedDate)}
              </span>
              <span className="text-[11px] text-slate-500">
                {dateTodos.length} agenda terdaftar
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-400">Pilih Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => e.target.value && setSelectedDate(e.target.value)}
              className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#6C7EC2] focus:outline-hidden"
            />
          </div>
        </div>

        {/* 2. Events Distribution Bar (Inspired by Image #1 Top Right Widget) */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-extrabold uppercase tracking-wide text-[11px]">
                Events Distribution
              </span>
              <span className="text-[11px] text-slate-500">
                ({scheduledHoursDisplay} teralokasi)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold">
                {freeHoursDisplay} FREE TIME
              </span>
              <span className="text-[#6C7EC2] font-extrabold">
                {completedCount}/{totalCount} Selesai ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Multi-segment colorful bar matching Image #1 */}
          <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden p-0.5 gap-0.5">
            <div
              style={{ width: `${Math.min(100, Math.max(10, (totalScheduledMinutes / 600) * 100))}%` }}
              className="h-full rounded-full flex overflow-hidden"
            >
              <div className="h-full bg-[#FFE28A] flex-1" title="Sesi Utama (Kuning)" />
              <div className="h-full bg-[#F7B6C4] flex-1" title="Personal & Log (Pink)" />
              <div className="h-full bg-[#90E5D2] flex-1" title="Project & Review (Mint)" />
            </div>
            <div
              style={{ width: `${Math.max(0, 100 - (totalScheduledMinutes / 600) * 100)}%` }}
              className="h-full bg-slate-200 rounded-full"
              title="Waktu Luang"
            />
          </div>
        </div>
      </div>

      {/* 3. Daily Rollover Engine Alert (if overdue pending exist) */}
      {pendingOverdue.length > 0 && selectedDate >= todayStr && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-amber-950">
                Ada {pendingOverdue.length} To-Do Tertunda dari Hari Sebelumnya
              </h2>
              <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                Pindahkan agenda yang belum selesai agar langsung masuk ke daftar to-do hari ini.
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

      {/* 4. Filter, Add Button & Quick Daily Note Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'Kerja', 'Pribadi', 'Fokus', 'Penting'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#6C7EC2] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Note Toggle */}
          <button
            onClick={() => setShowQuickNote(!showQuickNote)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showQuickNote
                ? 'bg-indigo-50 border-indigo-200 text-[#6C7EC2]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Catatan Hari Ini</span>
          </button>

          {/* Add Todo Button (Periwinkle style from Image #1) */}
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen ? 'Tutup Form' : 'Tambah To-Do'}</span>
          </button>
        </div>
      </div>

      {/* 5. Quick Daily Note Panel (Integrated Journaling) */}
      {showQuickNote && (
        <div className="bg-white p-5 rounded-[24px] border border-indigo-100 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6C7EC2]" />
              <h3 className="text-xs font-extrabold text-slate-800">
                Log Catatan Harian ({formatReadableDate(selectedDate)})
              </h3>
            </div>
            <Link
              href="/milt/notes"
              className="text-[11px] font-bold text-[#6C7EC2] hover:underline"
            >
              Buka Editor Lengkap &rarr;
            </Link>
          </div>

          {currentDayNote ? (
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">{currentDayNote.title}</p>
              <div
                className="prose prose-xs max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: currentDayNote.contentMarkdown || 'Belum ada isi catatan.' }}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Belum ada catatan khusus untuk tanggal ini. Tulis poin evaluasi atau rangkuman di bawah ini:
            </p>
          )}

          <form onSubmit={handleSaveQuickNote} className="flex gap-2">
            <input
              type="text"
              value={quickNoteText}
              onChange={e => setQuickNoteText(e.target.value)}
              placeholder="Tambahkan poin catatan harian (misal: Evaluasi hasil meeting sore)..."
              className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#6C7EC2] bg-slate-50/50"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#6C7EC2] text-white text-xs font-bold rounded-xl hover:bg-[#5C6EB2] cursor-pointer"
            >
              Simpan Catatan
            </button>
          </form>
        </div>
      )}

      {/* 6. Form Tambah To-Do Baru (Collapsible with Palette Picker) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitTodo}
          className="bg-white p-5 sm:p-6 rounded-[28px] border border-indigo-200/80 shadow-md space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#6C7EC2]" />
              <span>Tambah Agenda To-Do Baru</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Tanggal: {formatReadableDate(selectedDate)}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Agenda / Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Contoh: Robotics Workshop, Desain Flow Aplikasi, dsb."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#6C7EC2] focus:outline-hidden bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Detail arahan tugas, catatan tempat, atau link referensi..."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#6C7EC2] focus:outline-hidden bg-slate-50"
              />
            </div>

            {/* Time Slot, Priority, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={e => setNewStartTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="Kerja">Kerja</option>
                  <option value="Pribadi">Pribadi</option>
                  <option value="Fokus">Fokus</option>
                  <option value="Penting">Penting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as Priority)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="LOW">Biasa (Low)</option>
                  <option value="MEDIUM">Sedang (Medium)</option>
                  <option value="HIGH">Tinggi (High)</option>
                  <option value="URGENT">Mendesak (Urgent)</option>
                </select>
              </div>
            </div>

            {/* Card Color Theme Picker (Matching Image #1) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Warna Kartu Jadwal
              </label>
              <div className="flex items-center gap-2.5">
                {[
                  { key: 'yellow', label: 'Warm Butter', bg: 'bg-[#FFE28A] border-[#E8C55C]' },
                  { key: 'pink', label: 'Blossom Pink', bg: 'bg-[#F7B6C4] border-[#E090A2]' },
                  { key: 'mint', label: 'Pastel Mint', bg: 'bg-[#90E5D2] border-[#65C9B3]' },
                  { key: 'periwinkle', label: 'Periwinkle Blue', bg: 'bg-[#C5D0FB] border-[#95A5F4]' },
                ].map(c => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setNewColorTheme(c.key as PersonalTodoColor)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newColorTheme === c.key
                        ? 'ring-2 ring-[#6C7EC2] shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    } ${c.bg}`}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            >
              Simpan Agenda
            </button>
          </div>
        </form>
      )}

      {/* 7. Daftar Kartu To-Do Harian (Pastel Cards Matching Image #1) */}
      <div className="space-y-3.5">
        {dateTodos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[28px] border border-slate-200/80 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Tidak ada agenda pada tanggal ini</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hari ini bebas tugas. Klik tombol &ldquo;Tambah To-Do&rdquo; di atas untuk merencanakan pekerjaan Anda.
            </p>
          </div>
        ) : (
          dateTodos.map(todo => {
            const hasTimeSlot = todo.startTime || todo.endTime;
            const themeKey = todo.colorTheme || 'yellow';
            const theme = cardThemeStyles[themeKey];
            const isExpanded = !!expandedTodoIds[todo.id];
            const subtasks = todo.subtasks || [];
            const completedSubtasksCount = subtasks.filter(s => s.isCompleted).length;

            return (
              <div
                key={todo.id}
                className={`rounded-[22px] p-4 sm:p-5 border transition-all space-y-3 shadow-2xs ${
                  todo.isCompleted
                    ? 'bg-slate-50/70 border-slate-200 opacity-70'
                    : `${theme.container} ${theme.border}`
                }`}
              >
                {/* Header Row: Checkbox, Title, Badges, Time, Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox button */}
                    <button
                      onClick={() => togglePersonalTodo(todo.id)}
                      className="mt-0.5 cursor-pointer shrink-0"
                      title={todo.isCompleted ? 'Batalkan selesai' : 'Tandai selesai'}
                    >
                      {todo.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 hover:text-[#6C7EC2] transition-colors" />
                      )}
                    </button>

                    {/* Title & metadata */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-extrabold leading-snug ${
                            todo.isCompleted
                              ? 'line-through text-slate-400 font-normal'
                              : theme.title
                          }`}
                        >
                          {todo.title}
                        </span>

                        {/* Category badge */}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${theme.badge}`}>
                          {todo.category}
                        </span>

                        {/* Priority badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${priorityBadges[todo.priority].badge}`}>
                          {priorityBadges[todo.priority].label}
                        </span>

                        {/* Subtasks counter badge if any */}
                        {subtasks.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/10 text-slate-800">
                            {completedSubtasksCount}/{subtasks.length} Subtask
                          </span>
                        )}
                      </div>

                      {todo.description && (
                        <p className={`text-xs leading-relaxed ${todo.isCompleted ? 'text-slate-400' : theme.subText}`}>
                          {todo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side: Time Pill and Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {hasTimeSlot && (
                      <div className={`flex items-center gap-1.5 text-xs font-mono font-extrabold px-3 py-1 rounded-xl shadow-2xs ${theme.timeBadge}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {todo.startTime || '--:--'} - {todo.endTime || '--:--'}
                        </span>
                      </div>
                    )}

                    {/* Toggle subtasks collapse */}
                    <button
                      onClick={() => toggleExpandTodo(todo.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        todo.isCompleted ? 'text-slate-400 hover:bg-slate-200' : `${theme.subText} hover:bg-black/10`
                      }`}
                      title={isExpanded ? 'Sembunyikan checklist' : 'Lihat checklist'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deletePersonalTodo(todo.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus agenda to-do"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Checklist Panel (Interactive Breakdown) */}
                {isExpanded && (
                  <div className="pt-2 border-t border-black/10 space-y-2 animate-in fade-in">
                    <div className="space-y-1.5">
                      {subtasks.map(st => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between gap-2 text-xs bg-white/70 px-3 py-1.5 rounded-xl border border-white/90"
                        >
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.isCompleted}
                              onChange={() => togglePersonalTodoSubtask(todo.id, st.id)}
                              className="rounded-sm accent-[#6C7EC2] cursor-pointer"
                            />
                            <span
                              className={`text-xs ${
                                st.isCompleted
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800 font-medium'
                              }`}
                            >
                              {st.title}
                            </span>
                          </label>

                          <button
                            onClick={() => deletePersonalTodoSubtask(todo.id, st.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Hapus checklist ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new subtask inline */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newSubtaskInputs[todo.id] || ''}
                        onChange={e =>
                          setNewSubtaskInputs(prev => ({
                            ...prev,
                            [todo.id]: e.target.value,
                          }))
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(todo.id);
                          }
                        }}
                        placeholder="Tambah rincian subtask lalu tekan Enter..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-black/10 bg-white/80 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#6C7EC2]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubtask(todo.id)}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
