'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/lib/store/task-store';
import { Sidebar } from '@/app/components/Sidebar';
import { Navbar } from '@/app/components/Navbar';
import { TaskDetailModal } from '@/app/components/TaskDetailModal';
import { CreateTaskModal } from '@/app/components/CreateTaskModal';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, selectedTaskId, setSelectedTaskId } = useTaskContext();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs font-semibold">
        Mengarahkan ke halaman Login...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar onOpenCreateTask={() => setIsCreateTaskOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Modals */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {isCreateTaskOpen && (
        <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} />
      )}
    </div>
  );
}
