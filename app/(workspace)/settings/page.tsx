'use client';

import React, { useState, useRef } from 'react';
import { useTaskContext } from '@/lib/store/task-store';
import { updateProfileAction } from '@/app/actions/user.actions';
import {
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
} from 'lucide-react';

export default function AccountSettingsPage() {
  const { currentUser, updateProfile } = useTaskContext();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '/assets/images/profile/user-1.jpg');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI feedback states
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  // Local avatar presets from local assets
  const localAvatarPresets = Array.from({ length: 8 }, (_, i) => `/assets/images/profile/user-${i + 1}.jpg`);

  // Handle local photo upload (converted to Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
      setStatusMessage({ type: 'success', text: 'Foto profil lokal terpilih. Klik Simpan Perubahan untuk menerapkan.' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setStatusMessage({ type: 'error', text: 'Nama pengguna dan alamat email wajib diisi.' });
      return;
    }

    // Password validation if user is attempting to change password
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setStatusMessage({ type: 'error', text: 'Silakan masukkan kata sandi saat ini untuk mengganti kata sandi.' });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setStatusMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Server Action update
      const res = await updateProfileAction({
        name: cleanName,
        email: cleanEmail,
        avatarUrl,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (!res.ok) {
        setStatusMessage({ type: 'error', text: res.error || 'Gagal memperbarui profil di server.' });
        setIsSubmitting(false);
        return;
      }

      // 2. Client Store update
      updateProfile({
        name: cleanName,
        email: cleanEmail,
        avatarUrl,
      });

      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setStatusMessage({ type: 'success', text: 'Pengaturan akun dan profil berhasil disimpan!' });
    } catch {
      // Offline fallback: update local store directly
      updateProfile({
        name: cleanName,
        email: cleanEmail,
        avatarUrl,
      });
      setStatusMessage({ type: 'success', text: 'Profil berhasil diperbarui di penyimpanan lokal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-md border border-indigo-200">
              AKUN SAYA
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Pengaturan Akun & Profil
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Perbarui identitas profil, alamat email, foto avatar lokal, dan kata sandi keamanan Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Peran: {currentUser.role}</span>
          </span>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Foto Profil & Identitas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <span>Foto Profil & Identitas Pengguna</span>
          </h2>

          {/* Avatar Customization */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative group shrink-0 self-start sm:self-auto">
              <img
                src={avatarUrl}
                alt={name}
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Ganti foto dari file lokal"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Unggah Foto Lokal</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  (Disimpan lokal, tanpa koneksi luar)
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {/* Preset Local Avatars */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Atau pilih avatar bawaan:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {localAvatarPresets.map((preset, idx) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === preset ? 'border-indigo-600 scale-110 shadow-sm' : 'border-slate-200 hover:border-slate-400'
                      }`}
                      title={`Pilih Avatar ${idx + 1}`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Pengguna / Username *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Alamat Email *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Keamanan & Kata Sandi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Ganti Kata Sandi (Opsional)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Biarkan kolom di bawah ini kosong jika Anda tidak ingin mengubah kata sandi saat ini.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Sandi Saat Ini</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Sandi Baru</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Konfirmasi Sandi Baru</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi baru"
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
