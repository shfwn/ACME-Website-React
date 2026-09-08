'use client';

import React, { useState } from 'react';
import { useTaskContext, DocWiki } from '@/lib/store/task-store';
import { FileText, Plus, Save, Link as LinkIcon, Trash2 } from 'lucide-react';

export default function DocsPage() {
  const { docs, tasks, saveDoc, deleteDoc, currentUser, setSelectedTaskId } = useTaskContext();
  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);

  const activeDoc = docs.find(d => d.id === selectedDocId) || docs[0];

  const [title, setTitle] = useState(activeDoc?.title || '');
  const [contentMarkdown, setContentMarkdown] = useState(activeDoc?.contentMarkdown || '');

  const handleSelectDoc = (doc: DocWiki) => {
    setSelectedDocId(doc.id);
    setTitle(doc.title);
    setContentMarkdown(doc.contentMarkdown);
    setIsEditing(false);
  };

  const handleCreateDoc = () => {
    const newTitle = 'Dokumen Baru Tanpa Judul';
    const newContent = '# Judul Panduan\n\nTulis panduan atau briefing tugas di sini...';
    saveDoc({ title: newTitle, contentMarkdown: newContent });
  };

  const handleDeleteDoc = () => {
    if (!activeDoc) return;
    if (window.confirm(`Yakin ingin menghapus dokumen "${activeDoc.title}"?`)) {
      deleteDoc(activeDoc.id);
      const remaining = docs.filter(d => d.id !== activeDoc.id);
      if (remaining.length > 0) {
        setSelectedDocId(remaining[0].id);
        setTitle(remaining[0].title);
        setContentMarkdown(remaining[0].contentMarkdown);
      } else {
        setSelectedDocId('');
      }
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    if (!activeDoc) return;
    saveDoc({
      id: activeDoc.id,
      title,
      contentMarkdown,
    });
    setIsEditing(false);
  };

  const isDocCreator = currentUser?.role === 'OWNER' || activeDoc?.creatorId === currentUser?.id;
  const linkedTasks = tasks.filter(t => activeDoc?.linkedTaskIds?.includes(t.id));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Header (Clean Light) */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Catatan & Panduan Proyek
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Pusat instruksi teknis, brief desain, dan catatan rapat yang terhubung langsung ke kartu tugas tim.
          </p>
        </div>

        <button
          onClick={handleCreateDoc}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Dokumen Baru</span>
        </button>
      </div>

      {/* Main Grid: Sidebar Docs List + Editor / Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Document List */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2 h-fit shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-1">
            Daftar Dokumen
          </span>
          <div className="space-y-1">
            {docs.map(doc => (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeDoc?.id === doc.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{doc.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Content Viewer & Editor */}
        <div className="md:col-span-3 bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          {activeDoc ? (
            <>
              {/* Doc Header & Actions */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-lg font-extrabold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-2/3"
                  />
                ) : (
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {activeDoc.title}
                  </h2>
                )}

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setTitle(activeDoc.title);
                          setContentMarkdown(activeDoc.contentMarkdown);
                          setIsEditing(true);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Edit Dokumen
                      </button>

                      {isDocCreator && (
                        <button
                          onClick={handleDeleteDoc}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Linked Tasks Widget */}
              {linkedTasks.length > 0 && (
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tugas Tim yang Terkait dengan Dokumen Ini:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="text-xs bg-white text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 flex items-center gap-1.5 shadow-2xs font-bold cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        <span>{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Markdown Content */}
              {isEditing ? (
                <textarea
                  rows={15}
                  value={contentMarkdown}
                  onChange={e => setContentMarkdown(e.target.value)}
                  className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="prose max-w-none text-xs leading-relaxed space-y-4 whitespace-pre-wrap font-sans text-slate-700 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                  {activeDoc.contentMarkdown}
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-12 text-slate-400 text-xs">Pilih atau buat dokumen baru</div>
          )}
        </div>
      </div>
    </div>
  );
}
