'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTaskContext, PersonalNote, PersonalTodoColor } from '@/lib/store/task-store';
import {
  Plus,
  ArrowLeft,
  Trash2,
  Save,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  CheckCircle2,
  FileText,
  Clock,
  X,
  Maximize2,
  Calendar as CalendarIcon,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
export default function NotesPage() {
  const {
    currentUser,
    personalNotes,
    savePersonalNote,
    deletePersonalNote,
    addPersonalTodo,
  } = useTaskContext();

  const todayStr = new Date().toISOString().split('T')[0];

  // Mode: 'list' (semua catatan) or 'editor' (tulis/edit)
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Editor states
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [linkedDate, setLinkedDate] = useState<string>(todayStr);
  const [images, setImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'DAILY' | 'PHOTOS'>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Note-to-Todo Converter states
  const [showTodoConverter, setShowTodoConverter] = useState(false);
  const [todoTitleInput, setTodoTitleInput] = useState('');
  const [todoTimeInput, setTodoTimeInput] = useState('09:00');
  const [todoColorInput, setTodoColorInput] = useState<PersonalTodoColor>('yellow');
  const [todoCreatedSuccess, setTodoCreatedSuccess] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Open existing note for editing
  const handleOpenNote = (note: PersonalNote) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContentHtml(note.contentMarkdown || '');
    setLinkedDate(note.linkedDate || todayStr);
    setImages(note.images || []);
    setViewMode('editor');
  };

  // Create new note
  const handleCreateNewNote = (forDate?: string) => {
    const targetDate = forDate || todayStr;
    const todayFormatted = new Date(targetDate + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const defaultTitle = `Catatan Harian — ${todayFormatted}`;
    const defaultHtml = `<p>Tulis rangkuman harian, evaluasi meeting, atau poin penting di sini...</p>`;

    const newNote = savePersonalNote({
      title: defaultTitle,
      contentMarkdown: defaultHtml,
      linkedDate: targetDate,
      images: [],
    });

    if (newNote) {
      setActiveNoteId(newNote.id);
      setTitle(newNote.title);
      setContentHtml(newNote.contentMarkdown);
      setLinkedDate(targetDate);
      setImages([]);
      setViewMode('editor');
    }
  };

  // Sanitize HTML to prevent stored XSS
  const sanitizeHtml = (raw: string): string => {
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:[^"']*/gi, '');
  };

  // Cleanup timer on switch or unmount
  useEffect(() => {
    return () => {
      clearTimeout(autoSaveTimerRef.current!);
    };
  }, [activeNoteId]);

  // Sync editor HTML into contentEditable on open
  useEffect(() => {
    if (viewMode === 'editor' && editorRef.current) {
      const safe = sanitizeHtml(contentHtml);
      if (editorRef.current.innerHTML !== safe) {
        editorRef.current.innerHTML = safe;
      }
    }
  }, [viewMode, activeNoteId, contentHtml]);

  // Debounced auto-save function
  const triggerAutoSave = useCallback(
    (updatedTitle: string, updatedHtml: string, updatedImages: string[], updatedDate: string) => {
      if (!activeNoteId) return;
      setIsSaving(true);
      clearTimeout(autoSaveTimerRef.current!);
      autoSaveTimerRef.current = setTimeout(() => {
        savePersonalNote({
          id: activeNoteId,
          title: updatedTitle.trim() || 'Tanpa Judul',
          contentMarkdown: sanitizeHtml(updatedHtml),
          linkedDate: updatedDate,
          images: updatedImages,
        });
        setIsSaving(false);
      }, 800);
    },
    [activeNoteId, savePersonalNote]
  );

  // Handle title changes with auto-save
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerAutoSave(newTitle, contentHtml, images, linkedDate);
  };

  const handleDateChange = (newDate: string) => {
    setLinkedDate(newDate);
    triggerAutoSave(title, contentHtml, images, newDate);
  };

  // Handle content changes in contentEditable
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setContentHtml(html);
      triggerAutoSave(title, html, images, linkedDate);
    }
  };

  // Manual save
  const handleManualSave = () => {
    if (!activeNoteId) return;
    clearTimeout(autoSaveTimerRef.current!);
    savePersonalNote({
      id: activeNoteId,
      title: title.trim() || 'Tanpa Judul',
      contentMarkdown: contentHtml,
      linkedDate,
      images,
    });
    setIsSaving(false);
  };

  // Delete note
  const handleDeleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Hapus catatan ini secara permanen?')) {
      deletePersonalNote(noteId);
      if (activeNoteId === noteId) {
        setViewMode('list');
        setActiveNoteId(null);
      }
    }
  };

  // Convert snippet / task from note to To-Do List
  const handleConvertToTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoTitleInput.trim()) return;

    addPersonalTodo({
      title: todoTitleInput.trim(),
      description: `Berasal dari catatan: "${title}"`,
      targetDate: linkedDate || todayStr,
      startTime: todoTimeInput || undefined,
      colorTheme: todoColorInput,
      priority: 'MEDIUM',
      category: 'Kerja',
      isCompleted: false,
    });

    setTodoTitleInput('');
    setTodoCreatedSuccess(true);
    setTimeout(() => {
      setTodoCreatedSuccess(false);
      setShowTodoConverter(false);
    }, 1800);
  };

  // Rich text command helper
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  // Handle image upload and store as base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 2.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) {
        const base64 = ev.target.result as string;
        const updatedImages = [...images, base64];
        setImages(updatedImages);
        triggerAutoSave(title, contentHtml, updatedImages, linkedDate);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    triggerAutoSave(title, contentHtml, updated, linkedDate);
  };

  if (!currentUser) return null;

  // Filter notes
  const filteredNotes = personalNotes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.contentMarkdown.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTabFilter === 'DAILY') {
      return !!n.linkedDate;
    }
    if (activeTabFilter === 'PHOTOS') {
      return (n.images || []).length > 0;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in pb-16">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6C7EC2]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Pencatatan & Jurnal Harian
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Dokumentasikan evaluasi harian, meeting, rangkuman, dan hubungkan langsung ke To-Do List.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'list' ? (
            <button
              onClick={() => handleCreateNewNote()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Catatan Baru</span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MODE LIST: Grid Semua Catatan */}
      {viewMode === 'list' && (
        <div className="space-y-5">
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTabFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTabFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({personalNotes.length})
              </button>
              <button
                onClick={() => setActiveTabFilter('DAILY')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTabFilter === 'DAILY'
                    ? 'bg-white text-[#6C7EC2] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jurnal Harian ({personalNotes.filter(n => n.linkedDate).length})
              </button>
              <button
                onClick={() => setActiveTabFilter('PHOTOS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTabFilter === 'PHOTOS'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berlampiran Foto ({personalNotes.filter(n => (n.images || []).length > 0).length})
              </button>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari judul atau isi catatan..."
                className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#6C7EC2] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {filteredNotes.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-[28px] border border-slate-200/80 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Belum ada catatan ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Tulis rangkuman harian atau catatan meeting baru untuk mulai mendokumentasikan aktivitas Anda.
              </p>
              <button
                onClick={() => handleCreateNewNote()}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-[#6C7EC2] hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mulai Menulis</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => {
                const cleanPreview = note.contentMarkdown
                  .replace(/<[^>]*>?/gm, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                const hasPhotos = note.images && note.images.length > 0;
                const formattedDate = new Date(note.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note)}
                    className="group bg-white rounded-[24px] p-5 border border-slate-200/90 hover:border-[#6C7EC2] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-sm font-extrabold text-slate-900 group-hover:text-[#6C7EC2] transition-colors line-clamp-1 flex-1">
                          {note.title}
                        </h2>
                        <button
                          onClick={e => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                          title="Hapus catatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Linked Date Tag if set */}
                      {note.linkedDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#243575] bg-[#F0F3FE] border border-[#C5D0FB] px-2.5 py-0.5 rounded-lg w-fit">
                          <CalendarIcon className="w-3 h-3 text-[#6C7EC2]" />
                          <span>Tertaut: {note.linkedDate}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-normal">
                        {cleanPreview || 'Catatan kosong...'}
                      </p>

                      {hasPhotos && (
                        <div className="flex items-center gap-1.5 pt-1 overflow-hidden">
                          {note.images?.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Lampiran"
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </span>
                      {hasPhotos && (
                        <span className="flex items-center gap-1 text-[#6C7EC2] font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                          <ImageIcon className="w-3 h-3" />
                          <span>{note.images?.length} Foto</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MODE EDITOR DOKUMEN & INTEGRASI TO-DO */}
      {viewMode === 'editor' && (
        <div className="space-y-4">
          {/* Top Status & Date Linking Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-[24px] border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Daftar</span>
              </button>

              {/* Linked Date Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                <CalendarIcon className="w-3.5 h-3.5 text-[#6C7EC2]" />
                <span className="text-[11px] font-bold text-slate-500">Tautkan Tanggal:</span>
                <input
                  type="date"
                  value={linkedDate}
                  onChange={e => e.target.value && handleDateChange(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            {/* Auto-save status & Actions */}
            <div className="flex items-center gap-2">
              <div className="text-xs mr-1">
                {isSaving ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Menyimpan...</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersimpan</span>
                  </span>
                )}
              </div>

              {/* 1-Click Convert to To-Do Button */}
              <button
                onClick={() => setShowTodoConverter(!showTodoConverter)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFE28A] hover:bg-[#FCD86C] text-[#634800] rounded-xl text-xs font-extrabold shadow-2xs cursor-pointer border border-[#F2D16C]"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Jadikan To-Do</span>
              </button>

              <button
                onClick={handleManualSave}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>

              {activeNoteId && (
                <button
                  onClick={() => handleDeleteNote(activeNoteId)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Hapus catatan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Note-to-Todo Conversion Popout Panel */}
          {showTodoConverter && (
            <form
              onSubmit={handleConvertToTodo}
              className="bg-[#FFFCEB] border border-[#F6D779] p-4 rounded-2xl shadow-xs space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#634800] font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-[#F9C942]" />
                  <span>Konversi Cepat Baris Catatan Menjadi To-Do Harian</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTodoConverter(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {todoCreatedSuccess && (
                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Berhasil ditambahkan ke daftar To-Do tanggal {linkedDate}!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    value={todoTitleInput}
                    onChange={e => setTodoTitleInput(e.target.value)}
                    placeholder="Judul to-do baru dari poin catatan ini..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#6C7EC2]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="time"
                    value={todoTimeInput}
                    onChange={e => setTodoTimeInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-amber-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={todoColorInput}
                    onChange={e => setTodoColorInput(e.target.value as PersonalTodoColor)}
                    className="w-full text-xs px-2 py-2 rounded-xl border border-amber-300 bg-white font-bold"
                  >
                    <option value="yellow">Kuning (Fokus)</option>
                    <option value="pink">Pink (Personal)</option>
                    <option value="mint">Mint (Project)</option>
                    <option value="periwinkle">Periwinkle (Utama)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full py-2 bg-[#6C7EC2] hover:bg-[#5C6EB2] text-white rounded-xl text-xs font-extrabold cursor-pointer"
                  >
                    Buat To-Do
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Formatting Toolbar */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 text-xs text-slate-700 select-none">
            {/* Font Family */}
            <select
              onChange={e => execCmd('fontName', e.target.value)}
              className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              defaultValue="sans-serif"
            >
              <option value="sans-serif">Modern Sans</option>
              <option value="serif">Times Serif</option>
              <option value="monospace">Code Monospace</option>
            </select>

            {/* Font Size */}
            <select
              onChange={e => execCmd('fontSize', e.target.value)}
              className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              defaultValue="3"
            >
              <option value="2">Kecil (12px)</option>
              <option value="3">Normal (14px)</option>
              <option value="4">Sedang (16px)</option>
              <option value="5">Subjudul / H2</option>
              <option value="6">Judul Besar / H1</option>
            </select>

            <div className="w-[1px] h-5 bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded-lg hover:bg-slate-100 font-bold cursor-pointer"
              title="Tebal (Bold)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded-lg hover:bg-slate-100 italic cursor-pointer"
              title="Miring (Italic)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded-lg hover:bg-slate-100 underline cursor-pointer"
              title="Garis Bawah (Underline)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('strikeThrough')}
              className="p-1.5 rounded-lg hover:bg-slate-100 line-through cursor-pointer"
              title="Coretan"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1 hidden sm:block" />

            {/* List */}
            <button
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Bullet Points"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1 hidden sm:block" />

            {/* Alignments */}
            <button
              onClick={() => execCmd('justifyLeft')}
              className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('justifyCenter')}
              className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('justifyRight')}
              className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1 hidden sm:block" />

            {/* Upload Photo Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 px-2.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer text-[#6C7EC2] font-bold"
              title="Unggah foto dokumen"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[11px]">Sisipkan Foto</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Main Document Paper Canvas */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs p-6 sm:p-10 space-y-5 min-h-[500px]">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Judul Catatan..."
              className="w-full text-xl sm:text-2xl font-extrabold text-slate-900 placeholder-slate-300 border-0 border-b border-transparent hover:border-slate-200 focus:border-[#6C7EC2] focus:outline-hidden pb-2 transition-colors tracking-tight"
            />

            {/* Content Body */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              data-placeholder="Ketik catatan atau rangkuman Anda di sini..."
              className="min-h-[350px] text-xs sm:text-sm text-slate-800 leading-relaxed font-sans focus:outline-hidden prose max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
            />

            {/* Images Gallery */}
            {images.length > 0 && (
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#6C7EC2]" />
                    <span>Lampiran Foto ({images.length})</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video"
                    >
                      <img
                        src={img}
                        alt={`Lampiran ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewPhoto(img)}
                          className="p-1.5 bg-white text-slate-800 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                          title="Perbesar Foto"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemovePhoto(idx)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform cursor-pointer"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal Preview */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2"
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/60 text-white hover:bg-slate-900 rounded-full transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhoto}
              alt="Preview Rangkuman"
              className="max-h-[82vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
