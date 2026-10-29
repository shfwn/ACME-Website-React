'use client';

import React from 'react';
import { useTaskContext, Task } from '@/lib/store/task-store';
import { calculateProgress } from '@/lib/utils/progress';
import {
  Clock,
  AlertTriangle,
  MessageSquare,
  ListTodo,
  Target,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { users, tasks, project } = useTaskContext();
  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);

  // Kalkulasi langkah subtask
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const subtaskPercentage = calculateProgress(completedSubtasks, totalSubtasks);

  // Cek estafet yang ditunggu
  const prerequisites = tasks.filter(t => task.dependencies?.includes(t.id));
  const uncompletedPrerequisites = prerequisites.filter(p => {
    const pStatus = project.statuses.find(s => s.id === p.statusId);
    return !pStatus?.isDoneState;
  });
  const isBlocked = uncompletedPrerequisites.length > 0;

  // Total logged minutes on this task
  const totalLoggedMinutes = task.timeLogs?.reduce((acc, log) => acc + log.durationMinutes, 0) || 0;

  // Prioritas tanpa emoji
  const priorityLabels = {
    LOW: { label: 'Biasa', class: 'bg-slate-100 text-slate-700 border-slate-200' },
    MEDIUM: { label: 'Sedang', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    HIGH: { label: 'Penting', class: 'bg-amber-50 text-amber-800 border-amber-200 font-bold' },
    URGENT: { label: 'Mendesak', class: 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold' },
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 relative ${
        isBlocked ? 'ring-1 ring-amber-400/50 bg-amber-50/20' : ''
      }`}
    >
      {/* Top Meta: Prioritas & Peringatan Estafet */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${priorityLabels[task.priority].class}`}>
          {priorityLabels[task.priority].label}
        </span>

        {isBlocked && (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Menunggu {uncompletedPrerequisites.length} Tugas Lain</span>
          </span>
        )}
      </div>

      {/* Judul Tugas */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h3>
        {creator && (
          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
            Dibuat oleh: {creator.name.split(' ')[0]} ({creator.role})
          </span>
        )}
      </div>

      {/* TUJUAN */}
      {task.goal && (
        <div className="flex items-start gap-1.5 p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong className="font-bold">Tujuan:</strong> {task.goal}
          </span>
        </div>
      )}

      {/* Langkah Subtask */}
      {totalSubtasks > 0 && (
        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1 font-semibold">
              <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
              <span>Langkah: {completedSubtasks}/{totalSubtasks}</span>
            </span>
            <span className="font-extrabold text-indigo-600">{subtaskPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${subtaskPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Baris Bawah */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500 text-[11px]">
        <div className="flex items-center gap-1.5">
          {assignee ? (
            <div className="flex items-center gap-1.5">
              <img
                src={assignee.avatarUrl}
                alt={assignee.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
                }}
              />
              <span className="text-[11px] font-bold text-slate-700">
                {assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[11px] italic text-slate-400">Belum ditugaskan</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {totalLoggedMinutes > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>{(totalLoggedMinutes / 60).toFixed(1)}h</span>
            </div>
          )}

          {task.estimatedHours > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600">
              <span>{task.estimatedHours}h est</span>
            </div>
          )}

          {task.comments?.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
