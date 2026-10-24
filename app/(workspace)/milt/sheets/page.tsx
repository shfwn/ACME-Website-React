'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import {
  Table2,
  Plus,
  ExternalLink,
  Maximize2,
  Minimize2,
  Split,
  Bookmark,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function SpreadsheetHubPage() {
  const {
    currentUser,
    savedSheets,
    saveSheetLink,
    deleteSheetLink,
    personalTodos,
    togglePersonalTodo,
  } = useTaskContext();

  const [activeSheetId, setActiveSheetId] = useState<string>(savedSheets[0]?.id || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Spreadsheet');

  const [isSplitView, setIsSplitView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      // If it's a Google Sheet edit link, convert to preview/embed
      if (rawUrl.includes('docs.google.com/spreadsheets')) {
        if (rawUrl.includes('/edit')) {
          return rawUrl.replace(/\/edit.*$/, '/htmlembed?widget=true&headers=false');
        }
        if (!rawUrl.includes('htmlembed') && !rawUrl.includes('preview')) {
          return rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'widget=true&headers=false';
        }
      }
      // If Google Docs
      if (rawUrl.includes('docs.google.com/document') && rawUrl.includes('/edit')) {
        return rawUrl.replace(/\/edit.*$/, '/preview');
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const todayTodos = personalTodos.filter(t => t.targetDate === todayIso);

  return (
    <div className={`space-y-4 animate-in fade-in pb-12 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/90 p-4' : 'max-w-7xl mx-auto'}`}>
      {/* 1. Header Banner */}
      {!isFullscreen && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Spreadsheet
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Akses langsung Google Sheets dan Drive di dalam ruang kerja.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Link</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Form Tambah Link Sheet (Collapsible) */}
      {isFormOpen && !isFullscreen && (
        <form
          onSubmit={handleAddSheet}
          className="bg-white p-5 rounded-3xl border border-indigo-200 shadow-sm space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bookmark Google Sheet / Google Drive Baru</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Judul Spreadsheet *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Contoh: Tracker Finansial 2026"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600">URL Tautan Google Sheet / Drive *</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500">Kategori:</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="Perencanaan">Perencanaan</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Tracker">Tracker</option>
                <option value="Drive">Google Drive</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Bookmark
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. Sheet Tabs Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Bookmarked Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {savedSheets.length === 0 ? (
            <span className="text-xs text-slate-400 italic px-2">Belum ada spreadsheet disimpan</span>
          ) : (
            savedSheets.map(sheet => {
              const isActive = (activeSheet?.id || savedSheets[0]?.id) === sheet.id;

              return (
                <div
                  key={sheet.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setActiveSheetId(sheet.id)}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>{sheet.title}</span>
                  </button>

                  <button
                    onClick={() => deleteSheetLink(sheet.id)}
                    className={`p-0.5 rounded hover:text-rose-400 transition-colors cursor-pointer ${
                      isActive ? 'text-white/70' : 'text-slate-400'
                    }`}
                    title="Hapus bookmark ini"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Split view toggle */}
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSplitView
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Berdampingan dengan agenda to-do hari ini"
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split View</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Open external link */}
          {activeSheet && (
            <a
              href={activeSheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buka di Tab Baru</span>
            </a>
          )}
        </div>
      </div>

      {/* 4. Main Embed Container */}
      <div className={`grid gap-4 items-start ${isSplitView ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Iframe Viewer */}
        <div className={`${isSplitView ? 'lg:col-span-8' : 'w-full'} bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[650px]`}>
          {activeSheet ? (
            <div className="relative w-full h-full flex flex-col">
              <div className="p-2 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="truncate font-semibold text-slate-700">
                  Embed: {activeSheet.title} ({activeSheet.category})
                </span>
                <span className="text-emerald-700 font-mono font-bold">Terhubung</span>
              </div>
              <iframe
                src={getEmbedUrl(activeSheet.url)}
                title={activeSheet.title}
                className="w-full flex-1 border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-16 text-center space-y-2 m-auto">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Belum ada spreadsheet aktif</h3>
              <p className="text-xs text-slate-500">
                Simpan link Google Sheet Anda pada tombol &ldquo;Simpan Link Baru&rdquo; di atas untuk mulai menyematkan.
              </p>
            </div>
          )}
        </div>

        {/* Split View: Quick Today's To-Do Panel on Right */}
        {isSplitView && (
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 h-[650px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>To-Do Hari Ini (Quick View)</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                {todayTodos.filter(t => t.isCompleted).length}/{todayTodos.length}
              </span>
            </div>

            <div className="space-y-2">
              {todayTodos.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">
                  Tidak ada agenda untuk hari ini.
                </p>
              ) : (
                todayTodos.map(todo => (
                  <div
                    key={todo.id}
                    onClick={() => togglePersonalTodo(todo.id)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 transition-colors cursor-pointer flex items-start gap-2.5 text-xs"
                  >
                    <button className="mt-0.5">
                      {todo.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`font-bold block truncate ${todo.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {todo.title}
                      </span>
                      {todo.startTime && (
                        <span className="text-[10px] font-mono text-indigo-600 font-bold">
                          {todo.startTime} - {todo.endTime || ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
