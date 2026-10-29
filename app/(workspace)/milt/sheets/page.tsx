'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import {
  Table2,
  Plus,
  ExternalLink,
  Lock,
  KeyRound,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

export default function SpreadsheetHubPage() {
  const {
    currentUser,
    savedSheets,
    saveSheetLink,
    personalTodos,
    togglePersonalTodo,
  } = useTaskContext();

  // Mode: 'live-sheet' (Interactive schedule table) or 'vault' (External Google Sheets)
  const [activeTab, setActiveTab] = useState<'live-sheet' | 'vault'>('live-sheet');

  // Filter for live sheet
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MONTH' | 'WEEK' | 'TODAY'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Vault states
  const [activeSheetId, setActiveSheetId] = useState<string>(savedSheets[0]?.id || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory] = useState('Spreadsheet');
  // Password verification state for sensitive spreadsheet access
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const todayIso = new Date().toISOString().split('T')[0];

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordInput === 'password123') {
      setIsUnlocked(true);
      setPasswordInput('');
    } else {
      setPasswordError('Kata sandi salah. Gunakan kata sandi login Anda.');
    }
  };

  if (!currentUser) return null;

  const activeSheet = savedSheets.find(s => s.id === activeSheetId) || savedSheets[0];

  const handleAddSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    saveSheetLink(newTitle.trim(), newUrl.trim(), newCategory);
    setNewTitle('');
    setNewUrl('');
    setIsFormOpen(false);
  };

  // Convert Google Sheet URL to embeddable URL
  const getEmbedUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    try {
      if (rawUrl.includes('docs.google.com/spreadsheets')) {
        if (rawUrl.includes('/edit')) {
          return rawUrl.replace(/\/edit.*$/, '/htmlembed?widget=true&headers=false');
        }
        if (!rawUrl.includes('htmlembed') && !rawUrl.includes('preview')) {
          return rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'widget=true&headers=false';
        }
      }
      if (rawUrl.includes('docs.google.com/document') && rawUrl.includes('/edit')) {
        return rawUrl.replace(/\/edit.*$/, '/preview');
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  // Live Sheet Calculations & Filtering
  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  const getDurationHours = (start?: string, end?: string): number => {
    if (!start || !end) return 1;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 ? parseFloat((diff / 60).toFixed(2)) : 1;
  };

  // Date filtering logic
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const filteredTodos = personalTodos.filter(t => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

    if (dateFilter === 'TODAY') {
      return t.targetDate === todayIso;
    }
    if (dateFilter === 'MONTH') {
      return t.targetDate.startsWith(currentMonthStr);
    }
    if (dateFilter === 'WEEK') {
      const todoDate = new Date(t.targetDate + 'T00:00:00');
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return todoDate >= startOfWeek && todoDate <= endOfWeek;
    }
    return true;
  });

  // Sort by targetDate ascending, then startTime
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.targetDate !== b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  // KPI Summary
  const totalTasksCount = sortedTodos.length;
  const completedTasksCount = sortedTodos.filter(t => t.isCompleted).length;
  const totalScheduledHours = sortedTodos
    .reduce((acc, t) => acc + getDurationHours(t.startTime, t.endTime), 0)
    .toFixed(1);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Hari',
      'Jam Mulai',
      'Jam Selesai',
      'Durasi (Jam)',
      'Kategori',
      'Prioritas',
      'Judul Tugas',
      'Deskripsi',
      'Status Selesai',
    ];

    const rows = sortedTodos.map((t, idx) => [
      idx + 1,
      `"${t.targetDate}"`,
      `"${getDayName(t.targetDate)}"`,
      `"${t.startTime || '-'}"`,
      `"${t.endTime || '-'}"`,
      getDurationHours(t.startTime, t.endTime),
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.isCompleted ? 'SELESAI' : 'BELUM'}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `rekap-jadwal-spreadsheet-${todayIso}.csv`;
    link.click();
  };

  // Copy TSV for direct paste into Google Sheets / Excel
  const handleCopyTSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Hari',
      'Jam Mulai',
      'Jam Selesai',
      'Durasi (Jam)',
      'Kategori',
      'Prioritas',
      'Judul Tugas',
      'Status',
    ];

    const rows = sortedTodos.map((t, idx) => [
      idx + 1,
      t.targetDate,
      getDayName(t.targetDate),
      t.startTime || '-',
      t.endTime || '-',
      getDurationHours(t.startTime, t.endTime),
      t.category,
      t.priority,
      t.title,
      t.isCompleted ? 'SELESAI' : 'BELUM',
    ]);

    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. Header Banner & Mode Tabs */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#6C7EC2] text-white flex items-center justify-center shadow-xs">
            <Table2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Spreadsheet Hub & Konverter
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Konversi jadwal to-do harian menjadi lembar kerja spreadsheet dan sinkronisasi berkas Google Drive.
            </p>
          </div>
        </div>

        {/* Tab Switcher: Live Sheet vs External Vault */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center shadow-2xs">
            <button
              onClick={() => setActiveTab('live-sheet')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'live-sheet'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Schedule Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#6C7EC2]" />
              <span>Google Sheets Embed</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB 1: LIVE SCHEDULE SHEET (INTERACTIVE SPREADSHEET)   */}
      {/* ======================================================== */}
      {activeTab === 'live-sheet' && (
        <div className="space-y-5">
          {/* Top KPI Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FFE28A]/40 border border-[#FFE28A] p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-[#725200] block uppercase tracking-wide">
                Total Agenda
              </span>
              <span className="text-2xl font-black text-[#5C4100] mt-1 block">
                {totalTasksCount}
              </span>
            </div>

            <div className="bg-[#90E5D2]/30 border border-[#90E5D2] p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-[#0D574A] block uppercase tracking-wide">
                Total Jam Terjadwal
              </span>
              <span className="text-2xl font-black text-[#0A4A3F] mt-1 block">
                {totalScheduledHours} <span className="text-xs font-bold">Jam</span>
              </span>
            </div>

            <div className="bg-[#F7B6C4]/30 border border-[#F7B6C4] p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-[#7B1E34] block uppercase tracking-wide">
                Selesai / Terlaksana
              </span>
              <span className="text-2xl font-black text-[#691428] mt-1 block">
                {completedTasksCount} / {totalTasksCount}
              </span>
            </div>

            <div className="bg-[#C5D0FB]/40 border border-[#C5D0FB] p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-[#2A3B7D] block uppercase tracking-wide">
                Tingkat Penyelesaian
              </span>
              <span className="text-2xl font-black text-[#1E2E6C] mt-1 block">
                {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Filtering and Export Controls */}
          <div className="bg-white p-4 rounded-[24px] border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <span className="px-2 text-slate-400">Periode:</span>
                {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setDateFilter(p)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      dateFilter === p
                        ? 'bg-[#6C7EC2] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === 'ALL'
                      ? 'Semua'
                      : p === 'TODAY'
                      ? 'Hari Ini'
                      : p === 'WEEK'
                      ? 'Minggu Ini'
                      : 'Bulan Ini'}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Kerja">Kerja</option>
                <option value="Pribadi">Pribadi</option>
                <option value="Fokus">Fokus</option>
                <option value="Penting">Penting</option>
              </select>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy ke Google Sheets</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV / Excel</span>
              </button>
            </div>
          </div>

          {/* Interactive Spreadsheet Table Grid */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F0F3FE] border-b border-[#D4DCFC] text-[11px] font-black uppercase text-[#243575] tracking-wider">
                    <th className="py-3 px-3 w-10 text-center border-r border-[#D4DCFC] text-slate-400">#</th>
                    <th className="py-3 px-4 border-r border-[#D4DCFC]">Tanggal</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC]">Hari</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC]">Jam Mulai</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC]">Jam Selesai</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC] text-center">Durasi</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC]">Kategori</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC]">Prioritas</th>
                    <th className="py-3 px-4 border-r border-[#D4DCFC]">Judul Kegiatan / Agenda</th>
                    <th className="py-3 px-3 border-r border-[#D4DCFC] text-center">Checklist</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTodos.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 italic font-medium">
                        Tidak ada data agenda yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    sortedTodos.map((todo, idx) => {
                      const duration = getDurationHours(todo.startTime, todo.endTime);
                      const subtasks = todo.subtasks || [];
                      const subDone = subtasks.filter(s => s.isCompleted).length;

                      return (
                        <tr
                          key={todo.id}
                          className="hover:bg-slate-50/80 transition-colors font-medium text-slate-800"
                        >
                          <td className="py-3 px-3 text-center font-mono text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                            {todo.targetDate}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 whitespace-nowrap text-slate-600">
                            {getDayName(todo.targetDate)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#6C7EC2] border-r border-slate-100 whitespace-nowrap">
                            {todo.startTime || '--:--'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#6C7EC2] border-r border-slate-100 whitespace-nowrap">
                            {todo.endTime || '--:--'}
                          </td>
                          <td className="py-3 px-3 font-mono text-center font-bold text-slate-700 border-r border-slate-100">
                            {duration}h
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                              todo.colorTheme === 'pink'
                                ? 'bg-[#F7B6C4] text-[#6E182A] border-[#E79CAB]'
                                : todo.colorTheme === 'mint'
                                ? 'bg-[#90E5D2] text-[#08483C] border-[#69D5BE]'
                                : todo.colorTheme === 'periwinkle'
                                ? 'bg-[#C5D0FB] text-[#202F68] border-[#A8B7F7]'
                                : 'bg-[#FFE28A] text-[#553C00] border-[#E8C45A]'
                            }`}>
                              {todo.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                todo.priority === 'URGENT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : todo.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {todo.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100 min-w-[200px]">
                            {todo.title}
                          </td>
                          <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap text-[11px] font-mono">
                            {subtasks.length > 0 ? `${subDone}/${subtasks.length}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => togglePersonalTodo(todo.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all ${
                                todo.isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {todo.isCompleted ? 'SELESAI' : 'BELUM'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Formula Row */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 gap-3">
              <span className="text-slate-500">
                Formula Total Baris: <span className="font-mono text-slate-900 font-extrabold">{sortedTodos.length} Data</span>
              </span>
              <div className="flex items-center gap-4">
                <span>
                  Total Alokasi Durasi: <span className="font-mono text-[#6C7EC2] font-black">{totalScheduledHours} Jam</span>
                </span>
                <span>
                  Rasio Terselesaikan: <span className="font-mono text-emerald-700 font-black">{completedTasksCount}/{totalTasksCount}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 2: GOOGLE SHEETS EMBED VAULT & SECURE LINK        */}
      {/* ======================================================== */}
      {activeTab === 'vault' && (
        <div className="space-y-5">
          {!isUnlocked ? (
            <div className="max-w-md mx-auto my-12 bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200 shadow-md text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-[#6C7EC2] rounded-2xl flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Verifikasi Akses Berkas Google Sheet
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Berkas spreadsheet eksternal dilindungi. Masukkan kata sandi akun Anda (default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-700">password123</code>).
              </p>

              <form onSubmit={handleVerifyPassword} className="space-y-3 pt-2">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#6C7EC2] bg-slate-50 text-center"
                />
                {passwordError && (
                  <p className="text-[11px] text-rose-600 font-medium">{passwordError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  Buka Kunci Akses
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sheet Switcher & Add Form */}
              <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {savedSheets.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSheetId(s.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeSheet?.id === s.id
                          ? 'bg-[#6C7EC2] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Sheet</span>
                  </button>
                  {activeSheet && (
                    <a
                      href={activeSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-[#6C7EC2] rounded-xl text-xs font-bold hover:bg-indigo-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Tab Baru</span>
                    </a>
                  )}
                </div>
              </div>

              {isFormOpen && (
                <form
                  onSubmit={handleAddSheet}
                  className="bg-white p-5 rounded-[24px] border border-indigo-200 shadow-xs space-y-3 animate-in fade-in"
                >
                  <h3 className="text-xs font-extrabold text-slate-800">Sematkan Tautan Google Sheet Baru</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Judul Spreadsheet..."
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <input
                      type="url"
                      required
                      placeholder="URL Google Sheets (https://docs.google.com/spreadsheets/...)"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#6C7EC2] text-white rounded-xl text-xs font-bold"
                    >
                      Simpan Tautan
                    </button>
                  </div>
                </form>
              )}

              {/* Iframe Viewer */}
              {activeSheet && (
                <div className="bg-white rounded-[28px] border border-slate-200 shadow-xs overflow-hidden h-[650px] relative">
                  <iframe
                    src={getEmbedUrl(activeSheet.url)}
                    className="w-full h-full border-0"
                    title={activeSheet.title}
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
