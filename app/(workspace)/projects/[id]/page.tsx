'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import { TaskCard } from '@/app/components/TaskCard';
import { CreateTaskModal } from '@/app/components/CreateTaskModal';
import {
  Kanban,
  List,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';

export default function ProjectKanbanPage() {
  const { project, tasks, getProjectProgress, setSelectedTaskId } = useTaskContext();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [createForStatusId, setCreateForStatusId] = useState<string | null>(null);

  const { progressPercentage, completedTasks, totalTasks } = getProjectProgress();

  // Filter tasks for this project
  const projectTasks = tasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.goal && t.goal.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {/* Project Header & Roll-Up Metrics (Clean Light) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-4 h-4 rounded-md" style={{ backgroundColor: project.color }} />
              <h1 className="text-xl font-extrabold text-slate-900">
                {project.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Roll-up Progress Stat Card */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 min-w-[240px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Roll-up Progres Tim</span>
              </span>
              <span className="text-base font-extrabold text-indigo-600">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-indigo-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>{completedTasks} dari {totalTasks} Tugas Selesai</span>
              <span className="text-emerald-600 font-bold">Sinkronisasi Otomatis</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari tugas atau tujuan..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer font-medium"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="LOW">Biasa</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Penting</option>
              <option value="URGENT">Mendesak</option>
            </select>
          </div>

          {/* View Mode Toggle (Kanban vs List) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Papan Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar List</span>
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW (Clean Light) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {project.statuses.map(status => {
            const columnTasks = projectTasks.filter(t => t.statusId === status.id);

            return (
              <div
                key={status.id}
                className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3 min-h-[520px] flex flex-col shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <h2 className="text-xs font-extrabold text-slate-800">
                      {status.name}
                    </h2>
                    <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => setCreateForStatusId(status.id)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title={`Tambah tugas ke ${status.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Task Cards Column List */}
                <div className="space-y-3 flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="h-36 border-2 border-dashed border-slate-200/80 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-medium">
                      Belum ada tugas
                    </div>
                  ) : (
                    columnTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTaskId(task.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW (Clean Light) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
          {projectTasks.map(task => {
            const status = project.statuses.find(s => s.id === task.statusId);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${status?.color}15`,
                        borderColor: `${status?.color}30`,
                        color: status?.color,
                      }}
                    >
                      {status?.name}
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      {task.title}
                    </h3>
                  </div>
                  {task.goal && (
                    <p className="text-xs text-emerald-800 line-clamp-1 font-medium">
                      Tujuan: {task.goal}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span>{task.estimatedHours} Jam</span>
                  <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100">
                    {task.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal triggered from column */}
      {createForStatusId && (
        <CreateTaskModal
          defaultStatusId={createForStatusId}
          onClose={() => setCreateForStatusId(null)}
        />
      )}
    </div>
  );
}
