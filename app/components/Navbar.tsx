'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/lib/store/task-store';
import { Bell, Plus, LogOut, Menu, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth.actions';

interface NavbarProps {
  onOpenCreateTask?: () => void;
  onToggleSidebar?: () => void;
}

export function Navbar({ onOpenCreateTask, onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const { currentUser, logout, notifications, markAllNotificationsAsRead, personalTodos } = useTaskContext();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  if (!currentUser) return null;

  const isOwner = currentUser.role === 'OWNER';
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  const todayActiveTodosCount = personalTodos.filter(t => t.targetDate === todayIso && !t.isCompleted).length;

  const formattedDate = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const unreadNotifs = notifications.filter(n => n.userId === currentUser.id && !n.isRead);

  const handleLogout = async () => {
    logout();
    router.push('/login');
    await logoutAction();
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-10 select-none shadow-2xs">
      {/* Left: Mobile hamburger + Clean Status / Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isOwner ? (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              <CalendarIcon className="w-3.5 h-3.5 text-[#6C7EC2]" />
              <span>{formattedDate}</span>
            </div>

            {todayActiveTodosCount > 0 && (
              <Link
                href="/milt/todos"
                className="flex items-center gap-1.5 text-xs font-bold bg-[#FFF9E6] text-[#553C00] border border-[#F2D16C] px-2.5 py-1 rounded-xl hover:bg-[#FFE28A] transition-colors"
                title={`${todayActiveTodosCount} agenda to-do aktif hari ini`}
              >
                <span className="w-2 h-2 rounded-full bg-[#F9C942] animate-pulse" />
                <span>{todayActiveTodosCount} Agenda Hari Ini</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
              Workspace Tim
            </span>
          </div>
        )}
      </div>

      {/* Right: Notifications, Create Task (non-MILT only), User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create Task Button (Only for team roles) */}
        {!isOwner && onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tugas Baru</span>
          </button>
        )}

        {/* Notifications Dropdown (Team roles only) */}
        {!isOwner && (
          <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white shadow-xs" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Notifikasi</span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-indigo-600 hover:underline font-bold"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">Tidak ada notifikasi baru</div>
                ) : (
                  notifications
                    .filter(n => n.userId === currentUser.id)
                    .map(n => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs space-y-1 ${
                          !n.isRead ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.isRead && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Profile Card & Logout Button */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <Link
            href="/settings"
            className="flex items-center gap-2 p-1 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer group"
            title="Buka Pengaturan Akun"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
              }}
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold font-mono">
                {currentUser.role}
              </div>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors hidden sm:block ml-1" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Keluar dari akun saat ini"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
