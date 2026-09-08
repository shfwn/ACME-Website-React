'use client';

import React, { useState } from 'react';
import { useTaskContext, Priority } from '@/lib/store/task-store';
import { X, Target, UserPlus } from 'lucide-react';

interface CreateTaskModalProps {
  onClose: () => void;
  defaultStatusId?: string;
}

export function CreateTaskModal({ onClose, defaultStatusId }: CreateTaskModalProps) {
  const { project, users, currentUser, createTask } = useTaskContext();
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(defaultStatusId || project.statuses[0].id);
  const [assigneeId, setAssigneeId] = useState(currentUser?.id || '');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      goal: goal.trim() || undefined,
      description: description.trim(),
      statusId,
      assigneeId: assigneeId || undefined,
      priority,
      estimatedHours: Number(estimatedHours) || 0,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Buat Tugas Baru
            </h2>
            <span className="text-[11px] text-slate-500">
              Anda sebagai pembuat akan memiliki hak kelola penuh atas tugas ini.
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">
              Nama Tugas *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Desain Halaman Profil Pengguna"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* TUJUAN / OUTPUT TUGAS */}
          <div className="space-y-1 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
            <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tujuan Utama / Hasil yang Diharapkan</span>
            </label>
            <input
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Contoh: Agar user bisa mengedit foto profil dan bio..."
              className="w-full text-xs p-2.5 rounded-xl border border-emerald-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">
              Petunjuk Pengerjaan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tambahkan detail instruksi atau lampiran tautan..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Tahap Awal</label>
              <select
                value={statusId}
                onChange={e => setStatusId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer font-medium"
              >
                {project.statuses.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee (Can choose self or other team members) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Ditugaskan Kepada</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer font-bold"
              >
                <option value="">Tanpa Penanggung Jawab</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.id === currentUser?.id ? `[Diri Sendiri] ${u.name}` : `${u.name} (${u.role})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Tingkat Urgensi</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer font-medium"
              >
                <option value="LOW">Biasa</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Penting</option>
                <option value="URGENT">Mendesak</option>
              </select>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Estimasi Jam</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Batas Selesai</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
