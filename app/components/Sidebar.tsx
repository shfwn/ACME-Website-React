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
  Calendar,
  Table2,
  BookOpen,
  X,
  Lock,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const {
    project,
    tasks,
    currentUser,
    users,
    getProjectProgress,
    notifications,
    personalTodos,
    setSelectedTaskId,
  } = useTaskContext();

  const { progressPercentage, completedTasks, totalTasks } = getProjectProgress();

  if (!currentUser) return null;

  const isOwner = currentUser.role === 'OWNER';
  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;

  const todayIso = new Date().toISOString().split('T')[0];
  const todayActiveTodosCount = personalTodos.filter(t => t.targetDate === todayIso && !t.isCompleted).length;

  // Tugas-tugas aktif tim yang ditugaskan ke pengguna saat ini
  const myAssignedTasks = tasks.filter(t => {
    const status = project.statuses.find(s => s.id === t.statusId);
    return t.assigneeId === currentUser.id && !status?.isDoneState;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-64 sm:w-72 ${
          isOwner ? 'bg-[#6C7EC2] text-white border-r border-[#5C6EB2]' : 'bg-white text-slate-700 border-r border-slate-200'
        } h-screen flex flex-col shrink-0 select-none shadow-xl md:shadow-xs`}
      >
        {/* 1. Header Workspace */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isOwner ? 'bg-black/10 border-white/10' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
              isOwner ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {isOwner ? 'OW' : 'AF'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`font-extrabold text-xs truncate leading-tight ${
                isOwner ? 'text-white' : 'text-slate-900'
              }`}>
                {isOwner ? 'Executive Workspace' : 'Acme Task Flow'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className={`text-[11px] truncate font-medium ${
                  isOwner ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {currentUser.name}
                </span>
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1 rounded-lg md:hidden cursor-pointer ${
                isOwner ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* ============================================================== */}
          {/* TAMPILAN KHUSUS ROLE MILT (HANYA MENAMPILKAN FITUR SENDIRI)   */}
          {/* ============================================================== */}
          {isOwner ? (
            <div>
              <div className={`px-2 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider ${
                isOwner ? 'text-white/60' : 'text-slate-400'
              }`}>
                <span>Menu Utama</span>
                <span className={`flex items-center gap-1 text-[10px] font-medium normal-case ${
                  isOwner ? 'text-white/60' : 'text-slate-400'
                }`}>
                  <Lock className="w-3 h-3" />
                  Privat
                </span>
              </div>

              <nav className="space-y-1">
                {/* 1. To-Do Harian */}
                <Link
                  href="/milt/todos"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/milt/todos'
                      ? 'bg-white/25 text-white shadow-2xs font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-white" />
                    <span>To-Do Harian</span>
                  </div>
                  {todayActiveTodosCount > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFE28A] text-[#634800]">
                      {todayActiveTodosCount}
                    </span>
                  )}
                </Link>

                {/* 2. Jadwal & Kalender */}
                <Link
                  href="/milt/calendar"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/milt/calendar'
                      ? 'bg-white/25 text-white shadow-2xs font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-white" />
                  <span>Jadwal & Kalender</span>
                </Link>

                {/* 3. Catatan */}
                <Link
                  href="/milt/notes"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/milt/notes'
                      ? 'bg-white/25 text-white shadow-2xs font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-white" />
                  <span>Catatan Harian</span>
                </Link>

                {/* 4. Spreadsheet Hub */}
                <Link
                  href="/milt/sheets"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/milt/sheets'
                      ? 'bg-white/25 text-white shadow-2xs font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Table2 className="w-4 h-4 text-white" />
                  <span>Spreadsheet Hub</span>
                </Link>

                {/* 5. Pengaturan Akun */}
                <Link
                  href="/settings"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/settings'
                      ? 'bg-white/25 text-white shadow-2xs font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 text-white" />
                  <span>Pengaturan</span>
                </Link>
              </nav>
            </div>
          ) : (
            /* ============================================================== */
            /* TAMPILAN TIM (OWNER, ADMIN, MEMBER, VIEWER)                   */
            /* ============================================================== */
            <>
              {/* Ruang Pribadi Tim */}
              <div>
                <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Pribadi</span>
                </div>
                <nav className="space-y-1">
                  <Link
                    href="/my-tasks"
                    onClick={onClose}
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
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/notifications'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className={`w-4 h-4 ${pathname === '/notifications' ? 'text-white' : 'text-amber-500'}`} />
                      <span>Notifikasi</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                        {unreadCount} baru
                      </span>
                    )}
                  </Link>
                </nav>
              </div>

              {/* Daftar Tugas Masuk Tim */}
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
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            if (onClose) onClose();
                          }}
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
                  <span>Proyek</span>
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
                    onClick={onClose}
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
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pathname.includes('/workload')
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Users2 className={`w-4 h-4 ${pathname.includes('/workload') ? 'text-white' : 'text-emerald-600'}`} />
                    <span>Beban Kerja</span>
                  </Link>

                  <Link
                    href={`/projects/${project.id}/docs`}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pathname.includes('/docs')
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className={`w-4 h-4 ${pathname.includes('/docs') ? 'text-white' : 'text-amber-500'}`} />
                    <span>Dokumen</span>
                  </Link>

                  {/* Menu Kelola Pengguna (Khusus OWNER) */}
                  {currentUser.role === 'OWNER' && (
                    <Link
                      href="/users"
                      onClick={onClose}
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

                  <Link
                    href="/settings"
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/settings'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Settings className={`w-4 h-4 ${pathname === '/settings' ? 'text-white' : 'text-slate-500'}`} />
                    <span>Pengaturan Akun</span>
                  </Link>
                </nav>
              </div>
            </>
          )}
        </div>

        {/* 3. Footer (Hanya untuk Tim) */}
        {/* 3. Footer (Events Distribution Widget for Owner, or Team Status) */}
        {isOwner ? (
          <div className="p-4 border-t border-white/10 bg-black/5 space-y-2">
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold text-white/90 block uppercase tracking-wide">
                Events Distribution
              </span>
              <span className="text-[10px] text-white/60 block">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Concentric Curved Arcs matching Image #1 bottom-left */}
            <div className="pt-1 flex items-center justify-start">
              <svg className="w-24 h-16" viewBox="0 0 100 65">
                {/* Mint Arc */}
                <path
                  d="M 12 55 A 38 38 0 0 1 88 55"
                  fill="none"
                  stroke="#90E5D2"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                {/* Yellow Arc */}
                <path
                  d="M 24 55 A 26 26 0 0 1 76 55"
                  fill="none"
                  stroke="#FFE28A"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                {/* Pink Arc */}
                <path
                  d="M 36 55 A 14 14 0 0 1 64 55"
                  fill="none"
                  stroke="#F7B6C4"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700 font-semibold">Sistem Tim</span>
              </div>
              <span className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
                Aktif
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
