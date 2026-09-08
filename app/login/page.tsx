'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/lib/store/task-store';
import { LogIn, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useTaskContext();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.push('/my-tasks');
    }
  }, [currentUser, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput.trim()) {
      setErrorMsg('Silakan masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    const success = login(emailInput.trim());

    if (success) {
      router.push('/my-tasks');
    } else {
      setIsLoading(false);
      setErrorMsg('Email tidak ditemukan dalam sistem. Gunakan email akun Owner yang telah disediakan atau hubungi Owner.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Illustration & Info Banner */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100/60 p-8 flex flex-col justify-between border-r border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md shadow-indigo-600/20">
                AF
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 leading-tight">Acme Task Flow</h1>
                <span className="text-[11px] text-indigo-600 font-semibold">Sistem Manajemen Tugas Tim</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                Portal Masuk Tim & Kolaborasi Kerja
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kelola alur kerja tim, pantau beban jam kerja secara transparan, dan eksekusi tugas dengan sinkronisasi otomatis antar peran.
              </p>
            </div>
          </div>

          <div className="my-6 text-center">
            <img
              src="/assets/images/backgrounds/login-security.svg"
              alt="Security"
              className="max-h-44 mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="p-3.5 bg-white/90 rounded-2xl border border-indigo-100 text-xs text-slate-600 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="leading-tight">Akses terproteksi berdasarkan peran akun tim.</span>
          </div>
        </div>

        {/* Right: Standard Login Form (No Shortcuts) */}
        <div className="p-8 flex flex-col justify-center space-y-6 bg-white">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan email dan kata sandi untuk mengakses workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Memproses Masuk...' : 'Masuk ke Workspace'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
