'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import { Users, UserPlus, Trash2, Lock } from 'lucide-react';
import { createUserAction } from '@/app/actions/user.actions';
import { Role } from '@prisma/client';

export default function UserManagementPage() {
  const { currentUser, users, addUser, updateUserRole, deleteUser } = useTaskContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.MEMBER);
  const [capacity, setCapacity] = useState<number>(40);
  const [formError, setFormError] = useState('');

  if (!currentUser) return null;

  // Guard: Only OWNER or MILT has access to User Management
  if (currentUser.role !== 'OWNER' && currentUser.role !== 'MILT') {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-500">
          Hanya pengguna dengan peran Owner (Ketua Proyek) yang memiliki wewenang untuk mengelola anggota dan menambahkan peran baru.
        </p>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const result = addUser(name, email, role, Number(capacity));
    if (!result.success) {
      setFormError(result.error || 'Gagal menambahkan pengguna.');
      return;
    }
    try {
      await createUserAction({
        name,
        email,
        role,
        weeklyCapacityHours: Number(capacity),
      });
    } catch {
      // Offline fallback preserved by addUser
    }
    setName('');
    setEmail('');
    setRole('MEMBER');
    setCapacity(40);
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'OWNER':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ADMIN':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'MEMBER':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Kelola Pengguna dan Peran Tim
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Tambah anggota baru, tentukan peran akses (Owner, Admin, Member, Viewer), dan atur kapasitas jam kerja mingguan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-200">
            Total {users.length} Anggota
          </span>
        </div>
      </div>

      {/* Form Tambah Pengguna Baru */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Tambah Anggota Baru</h2>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Rian Hidayat"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="rian@company.com"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Peran Akses</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 cursor-pointer font-semibold"
            >
              <option value="MEMBER">Member (Eksekutor)</option>
              <option value="ADMIN">Admin (Lead Bidang)</option>
              <option value="OWNER">Owner (Ketua Proyek)</option>
              <option value="VIEWER">Viewer (Peninjau)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah ke Tim</span>
          </button>
        </form>
      </div>

      {/* Daftar Pengguna yang Terdaftar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Daftar Anggota Terdaftar</h2>
          <span className="text-xs text-slate-500">Anggota baru langsung bisa login di halaman Login</span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map(user => (
            <div
              key={user.id}
              className="p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{user.name}</span>
                    {user.id === currentUser.id && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        Akun Anda
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Role Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Peran:</span>
                  <select
                    value={user.role}
                    disabled={user.id === currentUser.id}
                    onChange={e => updateUserRole(user.id, e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer ${getRoleBadgeStyle(
                      user.role
                    )}`}
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div className="text-right text-xs text-slate-600 font-medium hidden sm:block">
                  <span className="font-bold">{user.weeklyCapacityHours}</span> jam/minggu
                </div>

                {/* Delete button (cannot delete self) */}
                {user.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Yakin ingin menghapus ${user.name} dari tim?`)) {
                        deleteUser(user.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus pengguna dari tim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
