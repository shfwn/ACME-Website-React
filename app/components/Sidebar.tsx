'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTaskContext } from '@/lib/store/task-store';
import {
  CheckSquare,
  LayoutDashboard,
  Users2,
  FileText,
  Bell,
  Target,
  Inbox,
  Users,
  ShieldCheck,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const {
    project,
    tasks,
    currentUser,
    users,
    getProjectProgress,
    notifications,
    setSelectedTaskId,
  } = useTaskContext();

  const { progressPercentage, completedTasks, totalTasks } = getProjectProgress();

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;

  // Tugas-tugas aktif yang ditugaskan ke pengguna saat ini
  const myAssignedTasks = tasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    return t.assigneeId === currentUser.id && !status?.isDoneState;
  });

  return (
    <aside className="w-72 bg-white text-slate-700 h-screen flex flex-col border-r border-slate-200 shrink-0 select-none shadow-xs">
      {/* 1. Header Workspace */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
            AF
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-xs text-slate-900 truncate leading-tight">
              Acme Task Flow
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-500 truncate font-medium">
                {currentUser.name} ({currentUser.role})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        
        {/* Navigasi Ruang Pribadi */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Pribadi</span>
          </div>
          <nav className="space-y-1">
            <Link
              href="/my-tasks"
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname === '/my-tasks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className={`w-4 h-4 ${pathname === '/my-tasks' ? 'text-white' : 'text-indigo-600'}`} />
                <span>Tugas Saya</span>
              </div>
              {myAssignedTasks.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pathname === '/my-tasks' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {myAssignedTasks.length}
                </span>
              )}
            </Link>

            <Link
              href="/notifications"
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname === '/notifications'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className={`w-4 h-4 ${pathname === '/notifications' ? 'text-white' : 'text-amber-500'}`} />
                <span>Pemberitahuan Estafet</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  {unreadCount} baru
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* DAFTAR TUGAS MASUK DI SIDEBAR */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                Tugas Masuk
              </span>
            </div>
            <span className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200">
              {myAssignedTasks.length} Aktif
            </span>
          </div>

          {myAssignedTasks.length === 0 ? (
            <div className="p-3 text-center bg-white rounded-xl border border-slate-200/60">
              <p className="text-[11px] text-slate-500 font-medium">Tidak ada tugas tertunda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {myAssignedTasks.map(task => {
                const creator = users.find(u => u.id === task.creatorId);
                const isFromBoss = creator && creator.role === 'OWNER' && creator.id !== currentUser.id;
                const completedSubs = task.subtasks?.filter(s => s.isCompleted).length || 0;
                const totalSubs = task.subtasks?.length || 0;

                return (
                  <div
                    key={task.id}
                    className="p-3 bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-1.5 group"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    {isFromBoss && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 block w-fit">
                        Dari: {creator.name.split(' ')[0]} (Owner)
                      </span>
                    )}

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                      {task.title}
                    </h4>

                    {task.goal && (
                      <div className="flex items-start gap-1 text-[10px] text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200 leading-tight">
                        <Target className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-medium">{task.goal}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      {totalSubs > 0 ? (
                        <span className="font-semibold text-slate-600">Langkah: {completedSubs}/{totalSubs}</span>
                      ) : (
                        <span>1 Tugas</span>
                      )}
                      {task.estimatedHours > 0 && (
                        <span className="font-bold text-slate-600">{task.estimatedHours} Jam</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigasi Proyek Tim */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Ruang Proyek</span>
          </div>

          {/* Roll-up progress card */}
          <div className="mb-2.5 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
              <span className="truncate">{project.name}</span>
              <span className="text-indigo-600 font-extrabold">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between font-medium">
              <span>{completedTasks} dari {totalTasks} selesai</span>
              <span className="text-emerald-600 font-bold">Sinkron</span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href={`/projects/${project.id}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname === `/projects/${project.id}`
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${pathname === `/projects/${project.id}` ? 'text-white' : 'text-sky-600'}`} />
              <span>Papan Proyek</span>
            </Link>

            <Link
              href={`/projects/${project.id}/workload`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.includes('/workload')
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users2 className={`w-4 h-4 ${pathname.includes('/workload') ? 'text-white' : 'text-emerald-600'}`} />
              <span>Beban Waktu Tim</span>
            </Link>

            <Link
              href={`/projects/${project.id}/docs`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.includes('/docs')
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className={`w-4 h-4 ${pathname.includes('/docs') ? 'text-white' : 'text-amber-500'}`} />
              <span>Catatan Panduan</span>
            </Link>

            {/* Menu Kelola Pengguna (Khusus OWNER) */}
            {currentUser.role === 'OWNER' && (
              <Link
                href="/users"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/users'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users className={`w-4 h-4 ${pathname === '/users' ? 'text-white' : 'text-indigo-600'}`} />
                <span>Kelola Pengguna</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* 3. Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-semibold">Neon Tech PostgreSQL</span>
          </div>
          <span className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
            Prisma Active
          </span>
        </div>
      </div>
    </aside>
  );
}
