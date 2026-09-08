'use client';

import React, { useState } from 'react';
import { useTaskContext, Task, User } from '@/lib/store/task-store';
import {
  X,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  History,
  Send,
  Target,
  ShieldAlert,
  ListTodo,
  Lock,
} from 'lucide-react';
import { calculateProgress } from '@/lib/utils/progress';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const {
    tasks,
    project,
    users,
    currentUser,
    updateTaskStatus,
    updateTask,
    deleteTask,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    addComment,
    deleteComment,
    addTimeLog,
    deleteTimeLog,
    addDependency,
    removeDependency,
    visibleActivities,
  } = useTaskContext();

  const task = tasks.find(t => t.id === taskId);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedMention, setSelectedMention] = useState<string>('');
  const [timeMinutes, setTimeMinutes] = useState<number>(30);
  const [timeNote, setTimeNote] = useState('');
  const [depError, setDepError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'dependencies' | 'discussion' | 'time' | 'history'>('subtasks');

  if (!task || !currentUser) return null;

  // Hak edit khusus pembuat tugas (creator) atau Owner
  const isCreator = task.creatorId === currentUser.id || currentUser.role === 'OWNER';

  const currentStatus = project.statuses.find(s => s.id === task.statusId);
  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const subtaskProgress = calculateProgress(completedSubtasks, totalSubtasks);

  const availablePrerequisites = tasks.filter(t => t.id !== task.id);
  const prerequisites = tasks.filter(t => task.dependencies?.includes(t.id));

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const mentions = selectedMention ? [selectedMention] : [];
    addComment(task.id, commentText, mentions);
    setCommentText('');
    setSelectedMention('');
  };

  const handleAddTimeLog = (e: React.FormEvent) => {
    e.preventDefault();
    addTimeLog(task.id, Number(timeMinutes), timeNote);
    setTimeNote('');
  };

  const handleAddDep = (prereqId: string) => {
    setDepError(null);
    const result = addDependency(task.id, prereqId);
    if (!result.success) {
      setDepError(result.error || 'Gagal menambahkan ketergantungan');
    }
  };

  const taskActivities = visibleActivities.filter(a => a.taskId === task.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            {/* Status Selector */}
            <select
              value={task.statusId}
              onChange={e => updateTaskStatus(task.id, e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              {project.statuses.map(status => (
                <option key={status.id} value={status.id}>
                  Tahap: {status.name} {status.isDoneState ? '(Selesai)' : ''}
                </option>
              ))}
            </select>

            {/* Priority Selector */}
            {isCreator ? (
              <select
                value={task.priority}
                onChange={e => updateTask(task.id, { priority: e.target.value as any })}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
              >
                <option value="LOW">Prioritas: Biasa</option>
                <option value="MEDIUM">Prioritas: Sedang</option>
                <option value="HIGH">Prioritas: Penting</option>
                <option value="URGENT">Prioritas: Mendesak</option>
              </select>
            ) : (
              <span className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                Prioritas: {task.priority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCreator && (
              <button
                onClick={() => {
                  if (window.confirm('Yakin ingin menghapus tugas ini?')) {
                    deleteTask(task.id);
                    onClose();
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Hapus Tugas Ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Info Hak Akses Bar */}
          {!isCreator && (
            <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 text-blue-800 text-[11px] flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Detail utama dikelola oleh <strong>{creator?.name}</strong>.
                </span>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">
                Mode Eksekusi
              </span>
            </div>
          )}

          {/* Judul & Tujuan */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nama Tugas
              </label>
              {isCreator ? (
                <input
                  type="text"
                  value={task.title}
                  onChange={e => updateTask(task.id, { title: e.target.value })}
                  className="w-full text-base font-extrabold text-slate-900 bg-transparent border-0 border-b border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-0 pb-1"
                  placeholder="Nama tugas..."
                />
              ) : (
                <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                  {task.title}
                </h2>
              )}
            </div>

            {/* TUJUAN TUGAS */}
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
              <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tujuan Utama:</span>
              </label>
              {isCreator ? (
                <input
                  type="text"
                  value={task.goal || ''}
                  onChange={e => updateTask(task.id, { goal: e.target.value })}
                  placeholder="Tujuan yang diharapkan..."
                  className="w-full text-xs font-semibold text-emerald-950 bg-white p-2.5 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-xs font-semibold text-emerald-900 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-emerald-200/60">
                  {task.goal || 'Tidak ada catatan tujuan khusus.'}
                </p>
              )}
            </div>

            {/* Petunjuk / Deskripsi */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Catatan Petunjuk Kerja
              </label>
              {isCreator ? (
                <textarea
                  value={task.description || ''}
                  onChange={e => updateTask(task.id, { description: e.target.value })}
                  rows={2}
                  className="w-full text-xs text-slate-800 bg-slate-50 rounded-xl p-3 border border-slate-200 focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                  placeholder="Instruksi pengerjaan..."
                />
              ) : (
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {task.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              )}
            </div>
          </div>

          {/* Grid Informasi Utama */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            {/* Penanggung Jawab */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Penanggung Jawab
              </span>
              {isCreator ? (
                <select
                  value={task.assigneeId || ''}
                  onChange={e => updateTask(task.id, { assigneeId: e.target.value || undefined })}
                  className="w-full text-xs font-bold py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">Belum Ditugaskan</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-slate-800 py-1">
                  {assignee ? `${assignee.name} (${assignee.role})` : 'Belum Ditugaskan'}
                </div>
              )}
            </div>

            {/* Estimasi Jam Kerja */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Estimasi Waktu
              </span>
              {isCreator ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={task.estimatedHours || 0}
                    onChange={e => updateTask(task.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
                    className="w-20 text-xs font-mono font-bold py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800"
                  />
                  <span className="text-slate-500 text-xs font-medium">Jam</span>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-800 py-1">
                  {task.estimatedHours} Jam
                </div>
              )}
            </div>

            {/* Tenggat Waktu */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Batas Selesai
              </span>
              {isCreator ? (
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={e => updateTask(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full text-xs font-medium py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800"
                />
              ) : (
                <div className="text-xs font-bold text-slate-800 py-1">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : 'Tidak ditentukan'}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'subtasks'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Langkah Kerja ({completedSubtasks}/{totalSubtasks})</span>
            </button>

            <button
              onClick={() => setActiveTab('dependencies')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'dependencies'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tugas yang Ditunggu ({prerequisites.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('discussion')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'discussion'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Diskusi ({task.comments?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('time')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'time'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Catatan Jam ({task.timeLogs?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Riwayat Aktivitas</span>
            </button>
          </div>

          {/* TAB 1: LANGKAH SUBTASK */}
          {activeTab === 'subtasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900">
                  Progres Langkah: {subtaskProgress}% Selesai
                </span>
                <span className="text-[11px] text-slate-500">
                  (Perubahan langsung sinkron ke seluruh tim)
                </span>
              </div>

              <div className="space-y-2">
                {task.subtasks?.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <button
                      onClick={() => toggleSubtask(task.id, sub.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      {sub.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 hover:text-indigo-600 shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          sub.isCompleted
                            ? 'line-through text-slate-400 font-normal'
                            : 'text-slate-900 font-bold'
                        }`}
                      >
                        {sub.title}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form Tambah Langkah */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  placeholder="Tulis checklist langkah pengerjaan..."
                  className="flex-1 text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Tambah Langkah
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: TUGAS YANG DITUNGGU */}
          {activeTab === 'dependencies' && (
            <div className="space-y-4">
              {depError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Pencegahan Siklus Ketergantungan:</strong>
                    <span>{depError}</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">
                  Tugas yang Harus Selesai Terlebih Dahulu:
                </h4>
                {prerequisites.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Tugas ini bisa langsung dikerjakan (tidak menunggu tugas lain).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prerequisites.map(p => {
                      const pStatus = project.statuses.find(s => s.id === p.statusId);
                      const isDone = pStatus?.isDoneState;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isDone ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                              }`}
                            />
                            <span className="font-bold text-slate-900">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (Tahap: {pStatus?.name})
                            </span>
                          </div>
                          {isCreator && (
                            <button
                              onClick={() => removeDependency(task.id, p.id)}
                              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                            >
                              Hapus Hubungan
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {isCreator && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Tautkan Tugas yang Ditunggu:
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="select-prereq"
                      className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-900"
                      defaultValue=""
                    >
                      <option value="" disabled>Pilih tugas prasyarat...</option>
                      {availablePrerequisites
                        .filter(t => !task.dependencies?.includes(t.id))
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById('select-prereq') as HTMLSelectElement;
                        if (select?.value) {
                          handleAddDep(select.value);
                          select.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Hubungkan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISKUSI */}
          {activeTab === 'discussion' && (
            <div className="space-y-4">
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {task.comments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada diskusi.</p>
                ) : (
                  task.comments?.map(c => {
                    const author = users.find(u => u.id === c.userId);
                    return (
                      <div
                        key={c.id}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={author?.avatarUrl}
                              alt={author?.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                              }}
                            />
                            <span className="font-bold text-slate-900">
                              {author?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">({author?.role})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(c.userId === currentUser.id || isCreator) && (
                              <button
                                onClick={() => deleteComment(task.id, c.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                title="Hapus Komentar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-700 leading-relaxed pl-7">
                          {c.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Tulis tanggapan atau pertanyaan..."
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={selectedMention}
                    onChange={e => setSelectedMention(e.target.value)}
                    className="text-xs py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    <option value="">Panggil Rekan (@)...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        @{u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CATATAN WAKTU */}
          {activeTab === 'time' && (
            <div className="space-y-4">
              <form onSubmit={handleAddTimeLog} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Tambah waktu pengerjaan:
                  </span>
                  <div className="flex gap-1.5">
                    {[30, 60, 120].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTimeMinutes(mins)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          timeMinutes === mins
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        +{mins >= 60 ? `${mins / 60} Jam` : `${mins} Menit`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={timeNote}
                    onChange={e => setTimeNote(e.target.value)}
                    placeholder="Catatan pengerjaan..."
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Waktu
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                {task.timeLogs?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada waktu yang dicatat.</p>
                ) : (
                  task.timeLogs?.map(tl => {
                    const logger = users.find(u => u.id === tl.userId);
                    return (
                      <div
                        key={tl.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-900">
                            {(tl.durationMinutes / 60).toFixed(1)} Jam
                          </span>
                          <span className="text-slate-600">- {tl.note}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium">Oleh {logger?.name}</span>
                          {(tl.userId === currentUser.id || isCreator) && (
                            <button
                              onClick={() => deleteTimeLog(task.id, tl.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                              title="Hapus Catatan Waktu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RIWAYAT AKTIVITAS */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {taskActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada riwayat aktivitas.</p>
                ) : (
                  taskActivities.map(act => {
                    const actor = users.find(u => u.id === act.actorId);
                    return (
                      <div
                        key={act.id}
                        className="flex items-center gap-2 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <History className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {actor?.name}
                        </span>
                        <span>{act.message}</span>
                        <span className="text-[10px] text-slate-400 ml-auto font-mono">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
