'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTaskContext, PersonalNote } from '@/lib/store/task-store';
import {
  Plus,
  Save,
  Trash2,
  Calendar as CalendarIcon,
  Tag,
  ArrowRight,
  ListTodo,
} from 'lucide-react';

export default function PersonalNotesPage() {
  const {
    currentUser,
    personalNotes,
    savePersonalNote,
    deletePersonalNote,
    addPersonalTodo,
  } = useTaskContext();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedNoteId, setSelectedNoteId] = useState<string>(personalNotes[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);

  const activeNote = personalNotes.find(n => n.id === selectedNoteId) || personalNotes[0];

  const [title, setTitle] = useState(activeNote?.title || '');
  const [contentMarkdown, setContentMarkdown] = useState(activeNote?.contentMarkdown || '');
  const [linkedDate, setLinkedDate] = useState<string>(activeNote?.linkedDate || todayStr);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(activeNote?.tags || ['Pribadi']);

  if (!currentUser) return null;

  const handleSelectNote = (note: PersonalNote) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContentMarkdown(note.contentMarkdown);
    setLinkedDate(note.linkedDate || todayStr);
    setTags(note.tags || ['Pribadi']);
    setIsEditing(false);
  };

  const handleCreateNote = () => {
    const newNote = savePersonalNote({
      title: 'Catatan Rapat ' + new Date().toLocaleDateString('id-ID'),
      contentMarkdown: `### Agenda Pertemuan & Catatan\n- [ ] Action item 1\n- [ ] Action item 2\n\n> Tulis hasil diskusi atau keputusan penting di sini...`,
      linkedDate: todayStr,
      tags: ['Briefing', 'Eksekutif'],
    });

    if (newNote) {
      setSelectedNoteId(newNote.id);
      setTitle(newNote.title);
      setContentMarkdown(newNote.contentMarkdown);
      setLinkedDate(newNote.linkedDate || todayStr);
      setTags(newNote.tags);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!activeNote) return;
    savePersonalNote({
      id: activeNote.id,
      title: title.trim() || 'Tanpa Judul',
      contentMarkdown,
      linkedDate,
      tags,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!activeNote) return;
    deletePersonalNote(activeNote.id);
    const remaining = personalNotes.filter(n => n.id !== activeNote.id);
    if (remaining.length > 0) {
      handleSelectNote(remaining[0]);
    } else {
      setSelectedNoteId('');
    }
    setIsEditing(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter(t => t !== tToRemove));
  };

  // Convert note bullet points or checklists directly into personal to-do items
  const handleExtractTodos = () => {
    if (!contentMarkdown) return;
    const lines = contentMarkdown.split('\n');
    let addedCount = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      let extractedTitle = '';

      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        extractedTitle = trimmed.replace(/- \[[ x]\]\s*/i, '').trim();
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        extractedTitle = trimmed.substring(2).trim();
      }

      if (extractedTitle && extractedTitle.length > 2) {
        addPersonalTodo({
          title: extractedTitle,
          targetDate: linkedDate || todayStr,
          isCompleted: false,
          priority: 'MEDIUM',
          category: 'Kerja',
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      alert(`${addedCount} to-do berhasil diekstrak dan disematkan ke tanggal ${linkedDate}!`);
    } else {
      alert('Tidak ditemukan baris checklist (- [ ]) atau bullet list (- ) pada catatan ini.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Catatan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi dan catatan harian terhubung tanggal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Notes List + Editor / Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notes List (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Semua Catatan ({personalNotes.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {personalNotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center">Belum ada catatan.</p>
            ) : (
              personalNotes.map(n => {
                const isSelected = activeNote?.id === n.id;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleSelectNote(n)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400/30'
                        : 'bg-slate-50/60 hover:bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-900 truncate flex-1">
                        {n.title}
                      </h3>
                      {n.linkedDate && (
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shrink-0 ml-2">
                          {n.linkedDate}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {n.contentMarkdown.replace(/[#*`>-]/g, '')}
                    </p>

                    {n.tags && n.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {n.tags.map(t => (
                          <span
                            key={t}
                            className="text-[9px] font-semibold bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Content Viewer & Editor (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          {activeNote ? (
            <>
              {/* Note Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex-1 space-y-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Judul Catatan..."
                      className="w-full text-base sm:text-lg font-extrabold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {activeNote.title}
                    </h2>
                  )}

                  {/* Linked Date & Tag Info */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{linkedDate || 'Tidak terikat'}</span>
                    </span>

                    {/* Quick Link to Calendar */}
                    {linkedDate && (
                      <Link
                        href="/milt/calendar"
                        className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <span>Lihat di Kalender</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setTitle(activeNote.title);
                          setContentMarkdown(activeNote.contentMarkdown);
                          setLinkedDate(activeNote.linkedDate || todayStr);
                          setTags(activeNote.tags || []);
                          setIsEditing(true);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Edit Catatan
                      </button>

                      <button
                        onClick={handleExtractTodos}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer"
                        title="Ekstrak baris checklist (- [ ]) menjadi agenda to-do kalender"
                      >
                        <ListTodo className="w-4 h-4 text-indigo-600" />
                        <span className="hidden sm:inline">Ekstrak To-Do</span>
                      </button>

                      <button
                        onClick={handleDelete}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Linked Date Editor when in Edit Mode */}
              {isEditing && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tautkan ke Tanggal Kalender:</span>
                    </label>
                    <input
                      type="date"
                      value={linkedDate}
                      onChange={e => setLinkedDate(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tagar Kategori (Tekan Enter):</span>
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Ketik tagar lalu Enter..."
                        className="w-full p-2 bg-white rounded-xl border border-slate-200 text-slate-800"
                      />
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div className="sm:col-span-2 flex items-center gap-1.5 flex-wrap pt-1">
                      {tags.map(t => (
                        <span
                          key={t}
                          className="bg-indigo-50 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1"
                        >
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-indigo-400 hover:text-rose-600 ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Markdown Editor or Clean Reader */}
              {isEditing ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Isi Catatan Markdown (Mendukung Checklist - [ ])
                  </label>
                  <textarea
                    rows={16}
                    value={contentMarkdown}
                    onChange={e => setContentMarkdown(e.target.value)}
                    placeholder="Tulis catatan eksekutif Anda di sini..."
                    className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
                  />
                </div>
              ) : (
                <div className="prose max-w-none text-xs leading-relaxed space-y-3 whitespace-pre-wrap font-sans text-slate-700 bg-slate-50/60 p-5 sm:p-6 rounded-2xl border border-slate-100 min-h-[300px]">
                  {activeNote.contentMarkdown}
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-12 text-slate-400 text-xs">
              Pilih catatan di sebelah kiri atau klik &ldquo;Buat Catatan Baru&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
