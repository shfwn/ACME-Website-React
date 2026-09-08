'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/lib/store/task-store';
import { Bell, Plus, LogOut, Sparkles, Lock } from 'lucide-react';

interface NavbarProps {
  onOpenCreateTask?: () => void;
}

export function Navbar({ onOpenCreateTask }: NavbarProps) {
  const router = useRouter();
  const { currentUser, logout, notifications, markAllNotificationsAsRead } = useTaskContext();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  if (!currentUser) return null;

  const unreadNotifs = notifications.filter(n => n.userId === currentUser.id && !n.isRead);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 select-none shadow-2xs">
      {/* Left: Status & Role Active Badge */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Otomasi Real-time Aktif</span>
        </span>

        <span className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-medium">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>Isolasi Hak Edit: Khusus Pembuat</span>
        </span>
      </div>

      {/* Right: Notification, Create Task, User Profile & Logout */}
      <div className="flex items-center gap-3">
        {/* Create Task Button */}
        {onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white shadow-xs" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Pemberitahuan Estafet</span>
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

        {/* Profile Card & Logout Button */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2.5 p-1 px-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
              }}
            />
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-indigo-600 font-bold font-mono">
                {currentUser.role}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Keluar dari akun saat ini"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
