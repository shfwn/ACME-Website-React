'use client';

import type { Metadata } from 'next';
import { TaskProvider } from '@/lib/store/task-store';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <TaskProvider>{children}</TaskProvider>
      </body>
    </html>
  );
}
