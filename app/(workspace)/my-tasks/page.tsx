'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/lib/store/task-store';
import { isDateToday, isDateOverdue } from '@/lib/utils/timezone';
import { calculateProgress } from '@/lib/utils/progress';
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  ListTodo,
  Target,
  Plus,
} from 'lucide-react';

export default function MyTasksPage() {
  const {
    currentUser,
    users,
    tasks,
    project,
    toggleSubtask,
    updateTaskStatus,
    setSelectedTaskId,
    addTimeLog,
  } = useTaskContext();
  const router = useRouter();
  useEffect(() => { if (currentUser?.role === 'MILT') { router.replace('/milt/todos'); } }, [currentUser, router]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'done'>('all');

  if (!currentUser) return null;

  // Filter tasks assigned to current user
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);

  // Filtered list
  const filteredTasks = myTasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    const isDone = status?.isDoneState;

    if (filter === 'done') return isDone;
    if (isDone && filter !== 'all') return false;

    if (filter === 'today') return isDateToday(t.dueDate);
    if (filter === 'overdue') return isDateOverdue(t.dueDate);
    if (filter === 'upcoming') return t.dueDate && !isDateToday(t.dueDate) && !isDateOverdue(t.dueDate);
    return true;
  });

  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    return status?.isDoneState;
  }).length;
  const todayTasksCount = myTasks.filter(t => isDateToday(t.dueDate) && !project.statuses.find(s => s.id === t.statusId)?.isDoneState).length;
  const overdueTasksCount = myTasks.filter(t => isDateOverdue(t.dueDate) && !project.statuses.find(s => s.id === t.statusId)?.isDoneState).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-slate-900">
              Tugas Pribadi
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-200">
              {currentUser.name} ({currentUser.role})
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Daftar pekerjaan yang ditugaskan kepada Anda.
          </p>
        </div>

        {/* Ringkasan Angka Cepat */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Hari Ini</span>
            <span className="text-sm font-extrabold text-indigo-600 flex items-center justify-center gap-1">
              {todayTasksCount} Tugas
            </span>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Terlambat</span>
            <span className={`text-sm font-extrabold ${overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {overdueTasksCount} Tugas
            </span>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Selesai</span>
            <span className="text-sm font-extrabold text-emerald-600">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          Semua ({myTasks.length})
        </button>

        <button
          onClick={() => setFilter('today')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'today'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Hari Ini ({todayTasksCount})</span>
        </button>

        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          Mendatang
        </button>

        <button
          onClick={() => setFilter('overdue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Terlambat ({overdueTasksCount})</span>
        </button>

        <button
          onClick={() => setFilter('done')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'done'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          Selesai ({completedTasks})
        </button>
      </div>

      {/* Daftar Tugas */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Tidak ada tugas pada kategori ini</h3>
            <p className="text-xs text-slate-500">
              Semua tugas Anda beres atau belum ada tugas yang sesuai filter.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const status = project.statuses.find(s => s.id === task.statusId);
            const isDone = status?.isDoneState;
            const creator = users.find(u => u.id === task.creatorId);
            const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
            const totalSubtasks = task.subtasks?.length || 0;
            const subProgress = calculateProgress(completedSubtasks, totalSubtasks);

            // Total logged minutes on this task
            const totalLoggedMinutes = task.timeLogs?.reduce((acc, log) => acc + log.durationMinutes, 0) || 0;
            const totalLoggedHours = (totalLoggedMinutes / 60).toFixed(1);

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs transition-all space-y-3.5"
              >
                {/* Baris Atas: Checkbox Selesai + Judul + Pengirim + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => {
                        const nextStatus = isDone
                          ? project.statuses[0].id
                          : project.statuses.find(s => s.isDoneState)?.id || project.statuses[project.statuses.length - 1].id;
                        updateTaskStatus(task.id, nextStatus);
                      }}
                      className="mt-0.5 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600 transition-colors" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`text-sm font-extrabold cursor-pointer hover:text-indigo-600 transition-colors ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h3>

                        {creator && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                            {creator.id === currentUser.id ? 'Dibuat Sendiri' : `Dari: ${creator.name} (${creator.role})`}
                          </span>
                        )}
                      </div>

                      {/* TUJUAN */}
                      {task.goal && (
                        <div className="flex items-start gap-1.5 p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-950 text-xs leading-relaxed">
                          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-bold text-emerald-900">Tujuan:</strong> {task.goal}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Time Logger with live indicator & Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Time Log Button with Total Hours Badge */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                      <button
                        onClick={() => addTimeLog(task.id, 30, 'Pengerjaan harian')}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 shadow-2xs border border-slate-200/80 cursor-pointer active:scale-95"
                        title="Tambah 30 Menit ke catatan waktu"
                      >
                        <Plus className="w-3 h-3" />
                        <span>30m</span>
                      </button>

                      {totalLoggedMinutes > 0 && (
                        <span className="px-2 text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{totalLoggedHours}h</span>
                        </span>
                      )}
                    </div>

                    <select
                      value={task.statusId}
                      onChange={e => updateTaskStatus(task.id, e.target.value)}
                      className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer"
                    >
                      {project.statuses.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Buka Detail Tugas"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Fast Checklist */}
                {totalSubtasks > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Langkah Pengerjaan: {completedSubtasks}/{totalSubtasks} Selesai</span>
                      </span>
                      <span className="font-extrabold text-indigo-600">{subProgress}% Progres</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {task.subtasks.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => toggleSubtask(task.id, sub.id)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white hover:bg-indigo-50/50 text-left transition-colors text-xs border border-slate-200 hover:border-indigo-300 cursor-pointer"
                        >
                          {sub.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={
                              sub.isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 font-bold'
                            }
                          >
                            {sub.title}
                          </span>
                        </button>
                      ))}
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
