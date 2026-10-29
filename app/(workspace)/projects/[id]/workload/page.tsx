'use client';

import React from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import { Users2, AlertTriangle } from 'lucide-react';

export default function WorkloadPage() {
  const { getWorkloadData, setSelectedTaskId } = useTaskContext();
  const workload = getWorkloadData();

  const getStatusBadge = (status: 'LIGHT' | 'OPTIMAL' | 'OVERLOAD') => {
    switch (status) {
      case 'LIGHT':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Kapasitas Luang
          </span>
        );
      case 'OPTIMAL':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Beban Optimal (Seimbang)
          </span>
        );
      case 'OVERLOAD':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Kelebihan Beban (Overload)</span>
          </span>
        );
    }
  };

  const getProgressBarColor = (status: 'LIGHT' | 'OPTIMAL' | 'OVERLOAD') => {
    if (status === 'OVERLOAD') return 'bg-rose-500';
    if (status === 'LIGHT') return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* Header Banner (Clean Light with Teamwork Asset) */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-xs flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Users2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Peta Beban Waktu Tim (Workload View)
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Transparansi kapasitas kerja seluruh anggota tim. Membantu ketua menyesuaikan alokasi tugas agar beban kerja terdistribusi secara seimbang dan teratur.
          </p>
        </div>

        <img
          src="/assets/images/backgrounds/teamwork.png"
          alt="Teamwork"
          className="hidden sm:block max-h-24 object-contain"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Member Workload Cards (Clean Light) */}
      <div className="space-y-4">
        {workload.map(item => (
          <div
            key={item.user.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
          >
            {/* User Header & Capacity Gauge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={item.user.avatarUrl}
                  alt={item.user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      {item.user.name}
                    </h2>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {item.user.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{item.user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    {item.totalHours} / {item.capacity} Jam
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Kapasitas Terpakai: <span className="font-bold text-slate-800">{item.percentage}%</span>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Visual Capacity Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                    item.status
                  )}`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </div>

            {/* Active Tasks Assigned to this Member */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Tugas Aktif yang Sedang Dikerjakan ({item.tasks.length}):
              </span>
              {item.tasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada tugas aktif saat ini.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {item.tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer flex items-center justify-between text-xs transition-colors shadow-2xs"
                    >
                      <span className="font-bold text-slate-800 truncate flex-1">
                        {t.title}
                      </span>
                      <span className="text-slate-600 font-mono font-bold shrink-0 ml-2 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {t.estimatedHours}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
