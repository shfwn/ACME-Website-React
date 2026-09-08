'use client';

import React from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import { Bell, Sparkles, Check, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const {
    notifications,
    currentUser,
    users,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    setSelectedTaskId,
  } = useTaskContext();

  if (!currentUser) return null;

  const userNotifs = notifications.filter(n => n.userId === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header (Clean Light) */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Pemberitahuan Estafet Tugas
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Pemberitahuan otomatis saat tugas prasyarat yang Anda tunggu telah diselesaikan oleh rekan tim.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userNotifs.some(n => !n.isRead) && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tandai Dibaca</span>
            </button>
          )}

          {userNotifs.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bersihkan semua notifikasi Anda?')) {
                  clearAllNotifications();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List (Clean Light) */}
      <div className="space-y-3">
        {userNotifs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 font-medium">
            Belum ada notifikasi baru untuk Anda.
          </div>
        ) : (
          userNotifs.map(n => {
            const actor = users.find(u => u.id === n.actorId);
            return (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.linkUrl?.includes('taskId=')) {
                    const taskId = n.linkUrl.split('taskId=')[1];
                    if (taskId) setSelectedTaskId(taskId);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !n.isRead
                    ? 'bg-indigo-50/80 border-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-900">
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {n.message}
                  </p>

                  {actor && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                      <span>Diteruskan dari:</span>
                      <img
                        src={actor.avatarUrl}
                        alt={actor.name}
                        className="w-4 h-4 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                        }}
                      />
                      <span className="font-bold text-slate-800">{actor.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Notifikasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
