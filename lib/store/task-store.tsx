'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { calculateProgress } from '../utils/progress';
import {
  createTaskAction,
  updateTaskStatusAction,
  updateTaskAction,
  deleteTaskAction,
} from '@/app/actions/task.actions';
import {
  addSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
  addCommentAction,
  deleteCommentAction,
  addTimeLogAction,
  deleteTimeLogAction,
} from '@/app/actions/item.actions';
import { addDependencyAction, removeDependencyAction } from '@/app/actions/dependency.actions';
import { saveDocAction, deleteDocAction } from '@/app/actions/doc.actions';
import { Priority as PrismaPriority } from '@prisma/client';
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | 'MILT';
  weeklyCapacityHours: number;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CustomStatus {
  id: string;
  projectId: string;
  name: string;
  orderIndex: number;
  color: string;
  isDoneState: boolean;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  durationMinutes: number;
  note?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  statusId: string;
  creatorId: string;
  assigneeId?: string;
  title: string;
  goal?: string;
  description?: string;
  priority: Priority;
  estimatedHours: number;
  dueDate?: string;
  subtasks: Subtask[];
  dependencies: string[];
  comments: TaskComment[];
  timeLogs: TimeLog[];
}

export interface DocWiki {
  id: string;
  projectId: string;
  creatorId: string;
  title: string;
  contentMarkdown: string;
  linkedTaskIds: string[];
  updatedAt: string;
}

export interface PersonalTodoSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export type PersonalTodoColor = 'yellow' | 'pink' | 'mint' | 'periwinkle';

export interface PersonalTodo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate: string; // YYYY-MM-DD
  startTime?: string; // "09:00"
  endTime?: string;   // "10:30"
  isCompleted: boolean;
  priority: Priority;
  category: string;   // "Kerja" | "Pribadi" | "Fokus" | "Penting"
  colorTheme?: PersonalTodoColor;
  subtasks?: PersonalTodoSubtask[];
  reminderAt?: string;
  createdAt: string;
}

export interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  contentMarkdown: string;
  linkedDate?: string; // YYYY-MM-DD
  tags: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedSheetLink {
  id: string;
  userId: string;
  title: string;
  url: string;
  category: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  taskId?: string;
  actorId: string;
  actionType: 'STATUS_CHANGED' | 'SUBTASK_TOGGLED' | 'TIME_LOGGED' | 'COMMENT_ADDED' | 'ASSIGNED' | 'DEPENDENCY_RESOLVED';
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId?: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  statuses: CustomStatus[];
}

export const INITIAL_USERS: User[] = [
  {
    id: 'u-milt',
    name: 'Owner',
    email: 'milt1058@gmail.com',
    avatarUrl: '/assets/images/profile/user-1.jpg',
    role: 'OWNER',
    weeklyCapacityHours: 40,
  },
  {
    id: 'u-siti',
    name: 'Siti Rahma',
    email: 'siti@company.com',
    avatarUrl: '/assets/images/profile/user-2.jpg',
    role: 'ADMIN',
    weeklyCapacityHours: 35,
  },
  {
    id: 'u-andi',
    name: 'Andi Pratama',
    email: 'andi@company.com',
    avatarUrl: '/assets/images/profile/user-3.jpg',
    role: 'MEMBER',
    weeklyCapacityHours: 40,
  },
];

const todayIso = new Date().toISOString().split('T')[0];

export const INITIAL_PERSONAL_TODOS: PersonalTodo[] = [
  {
    id: 'pt-1',
    userId: 'u-milt',
    title: 'Review Rencana Strategis & Roadmap Sistem',
    description: 'Pengecekan timeline dan alokasi sumber daya kuartal ini.',
    targetDate: todayIso,
    startTime: '09:00',
    endTime: '11:00',
    isCompleted: false,
    priority: 'HIGH',
    category: 'Kerja',
    colorTheme: 'yellow',
    subtasks: [
      { id: 'st-1', title: 'Audit dependensi modul milt', isCompleted: true },
      { id: 'st-2', title: 'Verifikasi integrasi database', isCompleted: false },
      { id: 'st-3', title: 'Siapkan draft spreadsheet mingguan', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pt-2',
    userId: 'u-milt',
    title: 'Penyusunan Catatan Harian & Logbook Proyek',
    description: 'Dokumentasikan hasil diskusi rapat pagi dan tindak lanjutnya.',
    targetDate: todayIso,
    startTime: '13:00',
    endTime: '14:00',
    isCompleted: false,
    priority: 'MEDIUM',
    category: 'Pribadi',
    colorTheme: 'pink',
    subtasks: [
      { id: 'st-4', title: 'Tulis ringkasan meeting internal', isCompleted: true },
      { id: 'st-5', title: 'Sematkan tautan dokumen wiki', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pt-3',
    userId: 'u-milt',
    title: 'Sinkronisasi Spreadsheet Keuangan & Operasional',
    description: 'Rekap jadwal mingguan dan konversi data ke spreadsheet.',
    targetDate: todayIso,
    startTime: '14:10',
    endTime: '16:00',
    isCompleted: true,
    priority: 'MEDIUM',
    category: 'Fokus',
    colorTheme: 'mint',
    subtasks: [
      { id: 'st-6', title: 'Ekspor berkas CSV log harian', isCompleted: true },
      { id: 'st-7', title: 'Cek formula total jam kerja', isCompleted: true },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PERSONAL_NOTES: PersonalNote[] = [
  {
    id: 'pn-1',
    userId: 'u-milt',
    title: 'Catatan Harian Eksekutif',
    contentMarkdown: `### Agenda Utama Hari Ini
- [x] Tinjau arsitektur integrasi sistem
- [ ] Monitor performa dan efisiensi waktu kerja

> Catatan: Gunakan fitur Spreadsheet Hub untuk memantau data Google Drive tanpa perlu membuka tab terpisah.`,
    linkedDate: todayIso,
    tags: ['Eksekutif', 'Briefing'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SAVED_SHEETS: SavedSheetLink[] = [];

const INITIAL_PROJECT: Project = {
  id: 'proj-mobile',
  name: 'Peluncuran Aplikasi Mobile 2.0',
  description: 'Pengembangan antarmuka mobile app, fitur keranjang belanja, dan integrasi API Neon Tech.',
  color: '#4F46E5',
  statuses: [
    { id: 'st-backlog', projectId: 'proj-mobile', name: 'Backlog', orderIndex: 0, color: '#64748B', isDoneState: false },
    { id: 'st-progress', projectId: 'proj-mobile', name: 'In Progress', orderIndex: 1, color: '#2563EB', isDoneState: false },
    { id: 'st-review', projectId: 'proj-mobile', name: 'In Review', orderIndex: 2, color: '#D97706', isDoneState: false },
    { id: 'st-approved', projectId: 'proj-mobile', name: 'Approved', orderIndex: 3, color: '#059669', isDoneState: true },
  ],
};

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-mobile',
    statusId: 'st-progress',
    creatorId: 'u-budi',
    assigneeId: 'u-siti',
    title: 'Desain Wireframe dan UI Mobile App',
    goal: 'Menghasilkan panduan visual Figma agar programmer bisa langsung mulai koding.',
    description: 'Membuat rancangan UI Figma untuk halaman Home, Cart, dan Checkout dengan standar aksesibilitas.',
    priority: 'HIGH',
    estimatedHours: 12,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      { id: 'sub-1', taskId: 'task-1', title: 'Riset kebutuhan pengguna dan moodboard', isCompleted: true, orderIndex: 0 },
      { id: 'sub-2', taskId: 'task-1', title: 'Desain alur checkout di Figma', isCompleted: true, orderIndex: 1 },
      { id: 'sub-3', taskId: 'task-1', title: 'Export icon dan token warna developer', isCompleted: false, orderIndex: 2 },
    ],
    dependencies: [],
    comments: [
      {
        id: 'c-1',
        taskId: 'task-1',
        userId: 'u-budi',
        content: 'Pastikan kontras warna tombol sudah memenuhi standar WCAG @Siti Rahma',
        mentions: ['u-siti'],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    timeLogs: [
      { id: 'tl-1', taskId: 'task-1', userId: 'u-siti', durationMinutes: 180, note: 'Eksplorasi wireframe Figma', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 'task-2',
    projectId: 'proj-mobile',
    statusId: 'st-backlog',
    creatorId: 'u-budi',
    assigneeId: 'u-andi',
    title: 'Koding Halaman Pembayaran dan Checkout',
    goal: 'Membuat sistem pembayaran aplikasi berfungsi dengan lancar tanpa kendala.',
    description: 'Implementasi komponen checkout di React Native berdasarkan desain Figma.',
    priority: 'HIGH',
    estimatedHours: 18,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      { id: 'sub-4', taskId: 'task-2', title: 'Setup sistem keranjang belanja', isCompleted: false, orderIndex: 0 },
      { id: 'sub-5', taskId: 'task-2', title: 'Hubungkan form dengan gateway pembayaran', isCompleted: false, orderIndex: 1 },
    ],
    dependencies: ['task-1'],
    comments: [],
    timeLogs: [],
  },
  {
    id: 'task-3',
    projectId: 'proj-mobile',
    statusId: 'st-approved',
    creatorId: 'u-budi',
    assigneeId: 'u-budi',
    title: 'Setup Database Neon Tech dan Server API',
    goal: 'Menyiapkan database serverless agar data tugas dan pengguna tersimpan aman.',
    description: 'Konfigurasi database Serverless PostgreSQL di Neon Tech dan connection pooling.',
    priority: 'URGENT',
    estimatedHours: 8,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      { id: 'sub-6', taskId: 'task-3', title: 'Setup database PostgreSQL di Neon Tech', isCompleted: true, orderIndex: 0 },
      { id: 'sub-7', taskId: 'task-3', title: 'Hubungkan Prisma ORM dengan database', isCompleted: true, orderIndex: 1 },
    ],
    dependencies: [],
    comments: [],
    timeLogs: [
      { id: 'tl-2', taskId: 'task-3', userId: 'u-budi', durationMinutes: 480, note: 'Setup database dan migrations', createdAt: new Date().toISOString() },
    ],
  },
];

const INITIAL_DOCS: DocWiki[] = [
  {
    id: 'doc-1',
    projectId: 'proj-mobile',
    creatorId: 'u-budi',
    title: 'Panduan Desain dan Arsitektur API V2',
    contentMarkdown: `# Panduan Integrasi Mobile 2.0

Dokumen ini merangkum endpoint API dan spesifikasi design token untuk mobile developer.

### Standar Token
- Primary Color: #4F46E5
- Status Green: #059669
- API Base URL: /api/v2

### Aturan Estafet Tugas
1. Desain UI diselesaikan di Figma sebelum frontend koding dimulai.
2. Setiap tugas wajib mencantumkan estimasi jam untuk transparansi beban waktu tim.`,
    linkedTaskIds: ['task-1', 'task-2', 'task-3'],
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    projectId: 'proj-mobile',
    taskId: 'task-1',
    actorId: 'u-siti',
    actionType: 'SUBTASK_TOGGLED',
    message: 'mencentang subtask "Desain alur checkout di Figma"',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'act-2',
    projectId: 'proj-mobile',
    taskId: 'task-3',
    actorId: 'u-budi',
    actionType: 'STATUS_CHANGED',
    message: 'mengubah status menjadi "Approved"',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'u-siti',
    actorId: 'u-budi',
    title: 'Panggilan Tugas',
    message: 'Budi Santoso memanggil Anda dalam komentar tugas Desain Wireframe dan UI Mobile App.',
    linkUrl: '/projects/proj-mobile?taskId=task-1',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

interface TaskContextType {
  currentUser: User | null;
  users: User[];
  project: Project;
  tasks: Task[];
  docs: DocWiki[];
  activities: ActivityLog[];
  visibleActivities: ActivityLog[];
  notifications: Notification[];
  selectedTaskId: string | null;
  toastMessage: string | null;
  setSelectedTaskId: (id: string | null) => void;
  setToastMessage: (msg: string | null) => void;
  login: (identifier: string) => boolean;
  logout: () => void;
  // User Management for Owner
  addUser: (name: string, email: string, role: User['role'], capacity?: number) => { success: boolean; error?: string };
  updateUserRole: (userId: string, role: User['role']) => void;
  deleteUser: (userId: string) => void;
  // Actions
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  updateTaskStatus: (taskId: string, newStatusId: string) => void;
  createTask: (data: Partial<Task>) => void;
  updateTask: (taskId: string, data: Partial<Task>) => boolean;
  deleteTask: (taskId: string) => boolean;
  addComment: (taskId: string, content: string, mentions: string[]) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  addTimeLog: (taskId: string, durationMinutes: number, note: string) => void;
  deleteTimeLog: (taskId: string, logId: string) => void;
  addDependency: (taskId: string, dependsOnTaskId: string) => { success: boolean; error?: string };
  removeDependency: (taskId: string, dependsOnTaskId: string) => void;
  saveDoc: (doc: Partial<DocWiki>) => DocWiki | undefined;
  deleteDoc: (docId: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getProjectProgress: () => { totalTasks: number; completedTasks: number; progressPercentage: number };
  getWorkloadData: () => Array<{
    user: User;
    totalHours: number;
    capacity: number;
    percentage: number;
    status: 'LIGHT' | 'OPTIMAL' | 'OVERLOAD';
    tasks: Task[];
  }>;
  // MILT Personal Executive Space
  personalTodos: PersonalTodo[];
  personalNotes: PersonalNote[];
  savedSheets: SavedSheetLink[];
  addPersonalTodo: (data: Omit<PersonalTodo, 'id' | 'createdAt' | 'userId'>) => void;
  togglePersonalTodo: (id: string) => void;
  updatePersonalTodo: (id: string, data: Partial<PersonalTodo>) => void;
  deletePersonalTodo: (id: string) => void;
  togglePersonalTodoSubtask: (todoId: string, subtaskId: string) => void;
  addPersonalTodoSubtask: (todoId: string, title: string) => void;
  deletePersonalTodoSubtask: (todoId: string, subtaskId: string) => void;
  rolloverPendingTodos: (targetDate: string) => number;
  savePersonalNote: (data: Partial<PersonalNote>) => PersonalNote | undefined;
  deletePersonalNote: (id: string) => void;
  saveSheetLink: (title: string, url: string, category?: string) => void;
  deleteSheetLink: (id: string) => void;
  updateProfile: (data: { name?: string; email?: string; avatarUrl?: string }) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [project] = useState<Project>(INITIAL_PROJECT);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [docs, setDocs] = useState<DocWiki[]>(INITIAL_DOCS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>(INITIAL_PERSONAL_TODOS);
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>(INITIAL_PERSONAL_NOTES);
  const [savedSheets, setSavedSheets] = useState<SavedSheetLink[]>(INITIAL_SAVED_SHEETS);

  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('acme_users');
      let loadedUsers = INITIAL_USERS;
      if (savedUsers) {
        loadedUsers = JSON.parse(savedUsers);
      }

      const savedTasks = localStorage.getItem('acme_tasks');
      const loadedTasks = savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS;

      const savedDocs = localStorage.getItem('acme_docs');
      const loadedDocs = savedDocs ? JSON.parse(savedDocs) : INITIAL_DOCS;

      const savedNotifs = localStorage.getItem('acme_notifications');
      const loadedNotifs = savedNotifs ? JSON.parse(savedNotifs) : INITIAL_NOTIFICATIONS;

      const savedActs = localStorage.getItem('acme_activities');
      const loadedActs = savedActs ? JSON.parse(savedActs) : INITIAL_ACTIVITIES;

      const savedPersonalTodos = localStorage.getItem('acme_personal_todos');
      const loadedPersonalTodos = savedPersonalTodos ? JSON.parse(savedPersonalTodos) : INITIAL_PERSONAL_TODOS;

      const savedPersonalNotes = localStorage.getItem('acme_personal_notes');
      const loadedPersonalNotes = savedPersonalNotes ? JSON.parse(savedPersonalNotes) : INITIAL_PERSONAL_NOTES;

      const savedSheetsData = localStorage.getItem('acme_saved_sheets');
      const loadedSavedSheets = savedSheetsData ? JSON.parse(savedSheetsData) : INITIAL_SAVED_SHEETS;
      const savedUserId = localStorage.getItem('acme_active_user_id');
      const activeUser = savedUserId ? loadedUsers.find(u => u.id === savedUserId) || null : null;

      queueMicrotask(() => {
        if (savedUsers) setUsers(loadedUsers);
        if (savedTasks) setTasks(loadedTasks);
        if (savedDocs) setDocs(loadedDocs);
        if (savedNotifs) setNotifications(loadedNotifs);
        if (savedActs) setActivities(loadedActs);
        if (savedPersonalTodos) setPersonalTodos(loadedPersonalTodos);
        if (savedPersonalNotes) setPersonalNotes(loadedPersonalNotes);
        if (savedSheetsData) setSavedSheets(loadedSavedSheets);
        setCurrentUser(activeUser);
        setIsLoaded(true);
      });
    } catch {
      queueMicrotask(() => {
        setCurrentUser(null);
        setIsLoaded(true);
      });
    }
  }, []);

  const updateAndPersistTasks = (updater: (prev: Task[]) => Task[]) => {
    setTasks(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_tasks', JSON.stringify(next));
      return next;
    });
  };

  const updateAndPersistDocs = (updater: (prev: DocWiki[]) => DocWiki[]) => {
    setDocs(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_docs', JSON.stringify(next));
      return next;
    });
  };

  const updateAndPersistNotifs = (updater: (prev: Notification[]) => Notification[]) => {
    setNotifications(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_notifications', JSON.stringify(next));
      return next;
    });
  };

  const updateAndPersistActs = (updater: (prev: ActivityLog[]) => ActivityLog[]) => {
    setActivities(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_activities', JSON.stringify(next));
      return next;
    });
  };
  const updateAndPersistPersonalTodos = (updater: (prev: PersonalTodo[]) => PersonalTodo[]) => {
    setPersonalTodos(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_personal_todos', JSON.stringify(next));
      return next;
    });
  };

  const updateAndPersistPersonalNotes = (updater: (prev: PersonalNote[]) => PersonalNote[]) => {
    setPersonalNotes(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_personal_notes', JSON.stringify(next));
      return next;
    });
  };

  const updateAndPersistSavedSheets = (updater: (prev: SavedSheetLink[]) => SavedSheetLink[]) => {
    setSavedSheets(prev => {
      const next = updater(prev);
      localStorage.setItem('acme_saved_sheets', JSON.stringify(next));
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimerRef.current!);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const login = (identifier: string) => {
    const user = users.find(
      u =>
        u.id === identifier ||
        u.email.toLowerCase() === identifier.trim().toLowerCase() ||
        (identifier.trim().toLowerCase() === 'milt1058@gmail.com' && (u.role === 'OWNER' || u.role === 'MILT')) ||
        (identifier.trim().toLowerCase() === 'owner@company.com' && (u.role === 'OWNER' || u.role === 'MILT'))
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('acme_active_user_id', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('acme_active_user_id');
  };

  // User Management Actions (for OWNER)
  const addUser = (name: string, email: string, role: User['role'], capacity: number = 40) => {
    if (!name.trim() || !email.trim()) {
      return { success: false, error: 'Nama dan email wajib diisi.' };
    }
    const exists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: 'Email pengguna sudah terdaftar.' };
    }

    const avatarIndex = (users.length % 10) + 1;
    const newUser: User = {
      id: 'u-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      avatarUrl: `/assets/images/profile/user-${avatarIndex}.jpg`,
      role,
      weeklyCapacityHours: capacity || 40,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('acme_users', JSON.stringify(updatedUsers));
    showToast(`Pengguna ${newUser.name} (${role}) berhasil ditambahkan.`);
    return { success: true };
  };

  const updateUserRole = (userId: string, role: User['role']) => {
    const updated = users.map(u => (u.id === userId ? { ...u, role } : u));
    setUsers(updated);
    localStorage.setItem('acme_users', JSON.stringify(updated));
    if (currentUser?.id === userId) {
      setCurrentUser({ ...currentUser, role });
    }
    showToast('Peran pengguna berhasil diperbarui.');
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      showToast('Tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    localStorage.setItem('acme_users', JSON.stringify(updated));

    // Clean orphaned task assignees
    updateAndPersistTasks(prev =>
      prev.map(t => (t.assigneeId === userId ? { ...t, assigneeId: undefined } : t))
    );

    showToast('Pengguna telah dihapus dari tim.');
  };

  const updateProfile = (data: { name?: string; email?: string; avatarUrl?: string }) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      name: data.name ? data.name.trim() : currentUser.name,
      email: data.email ? data.email.trim().toLowerCase() : currentUser.email,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : currentUser.avatarUrl,
    };
    setCurrentUser(updatedUser);

    const updatedUsers = users.map(u => (u.id === currentUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    localStorage.setItem('acme_users', JSON.stringify(updatedUsers));
    showToast('Profil akun berhasil diperbarui.');
  };

  // Activity privacy filter by role
  const visibleActivities = activities.filter(act => {
    if (!currentUser) return false;
    if (currentUser.role === 'OWNER') return true;

    if (act.actorId === currentUser.id) return true;

    if (act.taskId) {
      const task = tasks.find(t => t.id === act.taskId);
      if (task) {
        if (task.assigneeId === currentUser.id || task.creatorId === currentUser.id) {
          return true;
        }
      }
    }

    return false;
  });

  // 1. Toggle Subtask
  const toggleSubtask = (taskId: string, subtaskId: string) => {
    if (!currentUser) return;
    updateAndPersistTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const updatedSubtasks = t.subtasks.map(s => {
          if (s.id !== subtaskId) return s;
          const nextState = !s.isCompleted;

          updateAndPersistActs(acts => [
            {
              id: 'act-' + Date.now(),
              projectId: t.projectId,
              taskId: t.id,
              actorId: currentUser.id,
              actionType: 'SUBTASK_TOGGLED',
              message: `${nextState ? 'mencentang' : 'membatalkan centang'} subtask "${s.title}"`,
              createdAt: new Date().toISOString(),
            },
            ...acts,
          ]);

          return { ...s, isCompleted: nextState };
        });
        return { ...t, subtasks: updatedSubtasks };
      })
    );
    toggleSubtaskAction(subtaskId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for toggle subtask:', err);
    });
  };

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    updateAndPersistTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const newSub: Subtask = {
          id: 'sub-' + Date.now(),
          taskId: t.id,
          title: title.trim(),
          isCompleted: false,
          orderIndex: t.subtasks.length,
        };
        return { ...t, subtasks: [...t.subtasks, newSub] };
      })
    );
    addSubtaskAction(taskId, title.trim()).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for add subtask:', err);
    });
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    updateAndPersistTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
      })
    );
    deleteSubtaskAction(subtaskId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for delete subtask:', err);
    });
  };

  // 2. Update Task Status
  const updateTaskStatus = (taskId: string, newStatusId: string) => {
    if (!currentUser) return;
    const targetStatus = project.statuses.find(s => s.id === newStatusId);
    if (!targetStatus) return;

    updateTaskStatusAction(taskId, newStatusId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for update status:', err);
    });

    updateAndPersistTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;

      updateAndPersistActs(acts => [
        {
          id: 'act-' + Date.now(),
          projectId: task.projectId,
          taskId: task.id,
          actorId: currentUser.id,
          actionType: 'STATUS_CHANGED',
          message: `mengubah status tugas "${task.title}" menjadi "${targetStatus.name}"`,
          createdAt: new Date().toISOString(),
        },
        ...acts,
      ]);

      if (targetStatus.isDoneState) {
        const dependentTasks = prev.filter(t => t.dependencies.includes(taskId));
        dependentTasks.forEach(depTask => {
          if (depTask.assigneeId) {
            updateAndPersistNotifs(notifs => [
              {
                id: 'notif-' + Date.now() + Math.random(),
                userId: depTask.assigneeId!,
                actorId: currentUser.id,
                title: 'Estafet Tugas: Prasyarat Selesai',
                message: `Semua prasyarat untuk tugas "${depTask.title}" telah selesai. Anda sudah bisa mulai mengerjakan.`,
                linkUrl: `/projects/${depTask.projectId}?taskId=${depTask.id}`,
                isRead: false,
                createdAt: new Date().toISOString(),
              },
              ...notifs,
            ]);
          }
        });
      }

      return prev.map(t => (t.id === taskId ? { ...t, statusId: newStatusId } : t));
    });
    showToast(`Status diperbarui ke "${targetStatus.name}".`);
  };

  // 3. Create Task
  const createTask = (data: Partial<Task>) => {
    if (!currentUser) return;
    const newTask: Task = {
      id: 'task-' + Date.now(),
      projectId: project.id,
      statusId: data.statusId || project.statuses[0].id,
      creatorId: currentUser.id,
      assigneeId: data.assigneeId,
      title: data.title || 'Tugas Baru Tanpa Judul',
      goal: data.goal,
      description: data.description || '',
      priority: data.priority || 'MEDIUM',
      estimatedHours: data.estimatedHours || 0,
      dueDate: data.dueDate,
      subtasks: data.subtasks || [],
      dependencies: data.dependencies || [],
      comments: [],
      timeLogs: [],
    };

    updateAndPersistTasks(prev => [newTask, ...prev]);

    updateAndPersistActs(acts => [
      {
        id: 'act-' + Date.now(),
        projectId: project.id,
        taskId: newTask.id,
        actorId: currentUser.id,
        actionType: 'ASSIGNED',
        message: `membuat tugas baru "${newTask.title}"`,
        createdAt: new Date().toISOString(),
      },
      ...acts,
    ]);
    showToast('Tugas baru berhasil dibuat.');
    createTaskAction({
      projectId: project.id,
      title: newTask.title,
      goal: newTask.goal,
      description: newTask.description,
      statusId: newTask.statusId,
      assigneeId: newTask.assigneeId,
      priority: newTask.priority as PrismaPriority,
      estimatedHours: newTask.estimatedHours,
      dueDate: newTask.dueDate,
    }).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for task creation:', err);
    });
  };

  // 4. Update Task Details (Only Creator or Owner)
  const updateTask = (taskId: string, data: Partial<Task>): boolean => {
    if (!currentUser) return false;
    const existing = tasks.find(t => t.id === taskId);
    if (!existing) return false;

    if (existing.creatorId !== currentUser.id && currentUser.role !== 'OWNER') {
      return false;
    }

    updateAndPersistTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...data } : t)));
    showToast('Perubahan tugas disimpan.');
    updateTaskAction(taskId, {
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      priority: data.priority ? (data.priority as PrismaPriority) : undefined,
      estimatedHours: data.estimatedHours,
      dueDate: data.dueDate,
    }).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for task update:', err);
    });
    return true;
  };

  // 5. Delete Task
  const deleteTask = (taskId: string): boolean => {
    if (!currentUser) return false;
    const existing = tasks.find(t => t.id === taskId);
    if (!existing) return false;

    if (existing.creatorId !== currentUser.id && currentUser.role !== 'OWNER') {
      return false;
    }

    updateAndPersistTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    showToast('Tugas telah dihapus.');
    deleteTaskAction(taskId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for task deletion:', err);
    });
    return true;
  };

  // 6. Comments
  const addComment = (taskId: string, content: string, mentions: string[]) => {
    if (!currentUser || !content.trim()) return;
    const newComment: TaskComment = {
      id: 'c-' + Date.now(),
      taskId,
      userId: currentUser.id,
      content: content.trim(),
      mentions,
      createdAt: new Date().toISOString(),
    };

    updateAndPersistTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t))
    );

    mentions.forEach(mentionedUserId => {
      if (mentionedUserId !== currentUser.id) {
        updateAndPersistNotifs(notifs => [
          {
            id: 'notif-' + Date.now() + Math.random(),
            userId: mentionedUserId,
            actorId: currentUser.id,
            title: 'Panggilan Tugas',
            message: `${currentUser.name} memanggil Anda dalam komentar tugas.`,
            linkUrl: `/projects/${project.id}?taskId=${taskId}`,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...notifs,
        ]);
      }
    });

    updateAndPersistActs(acts => [
      {
        id: 'act-' + Date.now(),
        projectId: project.id,
        taskId,
        actorId: currentUser.id,
        actionType: 'COMMENT_ADDED',
        message: `menambahkan komentar di tugas`,
        createdAt: new Date().toISOString(),
      },
      ...acts,
    ]);
    showToast('Komentar terkirim.');
    addCommentAction(taskId, content.trim(), mentions).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for comment:', err);
    });
  };

  const deleteComment = (taskId: string, commentId: string) => {
    if (!currentUser) return;
    updateAndPersistTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, comments: t.comments.filter(c => c.id !== commentId) } : t))
    );
    showToast('Komentar telah dihapus.');
    deleteCommentAction(commentId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for delete comment:', err);
    });
  };

  // 7. Time Logger with Instant Toast Feedback
  const addTimeLog = (taskId: string, durationMinutes: number, note: string) => {
    if (!currentUser || durationMinutes <= 0) return;
    const newLog: TimeLog = {
      id: 'tl-' + Date.now(),
      taskId,
      userId: currentUser.id,
      durationMinutes,
      note: note.trim() || 'Pencatatan waktu kerja',
      createdAt: new Date().toISOString(),
    };

    updateAndPersistTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, timeLogs: [newLog, ...t.timeLogs] } : t))
    );

    updateAndPersistActs(acts => [
      {
        id: 'act-' + Date.now(),
        projectId: project.id,
        taskId,
        actorId: currentUser.id,
        actionType: 'TIME_LOGGED',
        message: `mencatat waktu ${durationMinutes} menit (${(durationMinutes / 60).toFixed(1)} jam)`,
        createdAt: new Date().toISOString(),
      },
      ...acts,
    ]);

    const formattedTime = durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)} jam` : `${durationMinutes} menit`;
    showToast(`+${formattedTime} berhasil dicatat ke beban kerja.`);
    addTimeLogAction(taskId, durationMinutes, note).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for time log:', err);
    });
  };

  const deleteTimeLog = (taskId: string, logId: string) => {
    if (!currentUser) return;
    updateAndPersistTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, timeLogs: t.timeLogs.filter(tl => tl.id !== logId) } : t))
    );
    showToast('Catatan waktu dihapus.');
    deleteTimeLogAction(logId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for delete time log:', err);
    });
  };

  // 8. Dependencies
  const addDependency = (taskId: string, dependsOnTaskId: string): { success: boolean; error?: string } => {
    if (taskId === dependsOnTaskId) {
      return { success: false, error: 'Tugas tidak dapat bergantung pada dirinya sendiri.' };
    }

    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === taskId) {
        return {
          success: false,
          error: 'Terdeteksi Ketergantungan Siklus! Tugas ini akan membuat loop tak berujung.',
        };
      }

      if (!visited.has(current)) {
        visited.add(current);
        const currTask = tasks.find(t => t.id === current);
        if (currTask && currTask.dependencies) {
          queue.push(...currTask.dependencies);
        }
      }
    }

    updateAndPersistTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        if (t.dependencies.includes(dependsOnTaskId)) return t;
        return { ...t, dependencies: [...t.dependencies, dependsOnTaskId] };
      })
    );

    showToast('Tugas prasyarat berhasil dihubungkan.');
    addDependencyAction(taskId, dependsOnTaskId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for add dependency:', err);
    });
    return { success: true };
  };

  const removeDependency = (taskId: string, dependsOnTaskId: string) => {
    updateAndPersistTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, dependencies: t.dependencies.filter(id => id !== dependsOnTaskId) };
      })
    );
    showToast('Hubungan tugas dihapus.');
    removeDependencyAction(taskId, dependsOnTaskId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for remove dependency:', err);
    });
  };

  // 9. Docs
  const saveDoc = (docData: Partial<DocWiki>): DocWiki | undefined => {
    if (!currentUser) return undefined;
    if (docData.id) {
      let updatedDoc: DocWiki | undefined;
      updateAndPersistDocs(prev =>
        prev.map(d => {
          if (d.id === docData.id) {
            updatedDoc = { ...d, ...docData, updatedAt: new Date().toISOString() };
            return updatedDoc;
          }
          return d;
        })
      );
      showToast('Dokumen berhasil disimpan.');
      saveDocAction({
        id: docData.id,
        projectId: docData.projectId || project.id,
        title: docData.title || 'Dokumen',
        contentMarkdown: docData.contentMarkdown || '',
        linkedTaskIds: docData.linkedTaskIds || [],
      }).catch((err: unknown) => {
        console.warn('[Sync] Offline/Server sync deferred for doc update:', err);
      });
      return updatedDoc;
    } else {
      const newDoc: DocWiki = {
        id: 'doc-' + Date.now(),
        projectId: docData.projectId || project.id,
        creatorId: currentUser.id,
        title: docData.title || 'Dokumen Baru',
        contentMarkdown: docData.contentMarkdown || '',
        linkedTaskIds: docData.linkedTaskIds || [],
        updatedAt: new Date().toISOString(),
      };
      updateAndPersistDocs(prev => [newDoc, ...prev]);
      showToast('Dokumen berhasil disimpan.');
      saveDocAction({
        projectId: newDoc.projectId,
        title: newDoc.title,
        contentMarkdown: newDoc.contentMarkdown,
        linkedTaskIds: newDoc.linkedTaskIds,
      }).catch((err: unknown) => {
        console.warn('[Sync] Offline/Server sync deferred for doc create:', err);
      });
      return newDoc;
    }
  };
  const deleteDoc = (docId: string) => {
    if (!currentUser) return;
    updateAndPersistDocs(prev => prev.filter(d => d.id !== docId));
    showToast('Dokumen telah dihapus.');
    deleteDocAction(docId).catch((err: unknown) => {
      console.warn('[Sync] Offline/Server sync deferred for doc delete:', err);
    });
  };

  // 10. Notifications
  const markNotificationAsRead = (id: string) => {
    updateAndPersistNotifs(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    updateAndPersistNotifs(prev =>
      prev.map(n => (n.userId === currentUser.id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    updateAndPersistNotifs(prev => prev.filter(n => n.id !== id));
    showToast('Notifikasi dihapus.');
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;
    updateAndPersistNotifs(prev => prev.filter(n => n.userId !== currentUser.id));
    showToast('Semua notifikasi dibersihkan.');
  };

  // MILT Personal Executive Workspace Actions
  const addPersonalTodo = (data: Omit<PersonalTodo, 'id' | 'createdAt' | 'userId'>) => {
    if (!data.title.trim()) return;
    const newTodo: PersonalTodo = {
      id: 'pt-' + Date.now(),
      userId: currentUser?.id || 'u-milt',
      title: data.title.trim(),
      description: data.description?.trim(),
      targetDate: data.targetDate,
      startTime: data.startTime,
      endTime: data.endTime,
      isCompleted: false,
      priority: data.priority || 'MEDIUM',
      category: data.category || 'Kerja',
      colorTheme: data.colorTheme || 'yellow',
      subtasks: data.subtasks || [],
      reminderAt: data.reminderAt,
      createdAt: new Date().toISOString(),
    };
    updateAndPersistPersonalTodos(prev => [newTodo, ...prev]);
    showToast('Agenda to-do pribadi ditambahkan.');
  };

  const togglePersonalTodo = (id: string) => {
    updateAndPersistPersonalTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const updatePersonalTodo = (id: string, data: Partial<PersonalTodo>) => {
    updateAndPersistPersonalTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, ...data } : t))
    );
    showToast('Agenda diperbarui.');
  };

  const deletePersonalTodo = (id: string) => {
    updateAndPersistPersonalTodos(prev => prev.filter(t => t.id !== id));
    showToast('Agenda to-do dihapus.');
  };

  const togglePersonalTodoSubtask = (todoId: string, subtaskId: string) => {
    updateAndPersistPersonalTodos(prev =>
      prev.map(t => {
        if (t.id !== todoId) return t;
        const updatedSubtasks = (t.subtasks || []).map(st =>
          st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      })
    );
  };

  const addPersonalTodoSubtask = (todoId: string, title: string) => {
    if (!title.trim()) return;
    const newSubtask: PersonalTodoSubtask = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: title.trim(),
      isCompleted: false,
    };
    updateAndPersistPersonalTodos(prev =>
      prev.map(t => {
        if (t.id !== todoId) return t;
        return { ...t, subtasks: [...(t.subtasks || []), newSubtask] };
      })
    );
  };

  const deletePersonalTodoSubtask = (todoId: string, subtaskId: string) => {
    updateAndPersistPersonalTodos(prev =>
      prev.map(t => {
        if (t.id !== todoId) return t;
        return {
          ...t,
          subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId),
        };
      })
    );
  };

  const rolloverPendingTodos = (targetDate: string): number => {
    let count = 0;
    updateAndPersistPersonalTodos(prev =>
      prev.map(t => {
        if (!t.isCompleted && t.targetDate < targetDate) {
          count++;
          return { ...t, targetDate };
        }
        return t;
      })
    );
    if (count > 0) {
      showToast(`${count} to-do tertunda berhasil dipindahkan ke hari ini.`);
    } else {
      showToast('Tidak ada to-do tertunda untuk dipindahkan.');
    }
    return count;
  };

  const savePersonalNote = (data: Partial<PersonalNote>): PersonalNote | undefined => {
    if (data.id) {
      let updatedNote: PersonalNote | undefined;
      updateAndPersistPersonalNotes(prev =>
        prev.map(n => {
          if (n.id === data.id) {
            updatedNote = { ...n, ...data, updatedAt: new Date().toISOString() };
            return updatedNote;
          }
          return n;
        })
      );
      showToast('Catatan berhasil disimpan.');
      return updatedNote;
    } else {
      const newNote: PersonalNote = {
        id: 'pn-' + Date.now(),
        userId: currentUser?.id || 'u-milt',
        title: data.title || 'Catatan Baru',
        contentMarkdown: data.contentMarkdown || '',
        linkedDate: data.linkedDate,
        tags: data.tags || ['Rangkuman'],
        images: data.images || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updateAndPersistPersonalNotes(prev => [newNote, ...prev]);
      showToast('Catatan baru berhasil dibuat.');
      return newNote;
    }
  };

  const deletePersonalNote = (id: string) => {
    updateAndPersistPersonalNotes(prev => prev.filter(n => n.id !== id));
    showToast('Catatan dihapus.');
  };

  const saveSheetLink = (title: string, url: string, category: string = 'Spreadsheet') => {
    if (!title.trim() || !url.trim()) return;
    const newSheet: SavedSheetLink = {
      id: 'sh-' + Date.now(),
      userId: currentUser?.id || 'u-milt',
      title: title.trim(),
      url: url.trim(),
      category: category.trim(),
      createdAt: new Date().toISOString(),
    };
    updateAndPersistSavedSheets(prev => [newSheet, ...prev]);
    showToast('Link Google Sheet / Drive berhasil disimpan.');
  };

  const deleteSheetLink = (id: string) => {
    updateAndPersistSavedSheets(prev => prev.filter(s => s.id !== id));
    showToast('Bookmark sheet dihapus.');
  };

  // Computed Roll-up Progress
  const getProjectProgress = () => {
    if (!tasks || tasks.length === 0) {
      return { totalTasks: 0, completedTasks: 0, progressPercentage: 0 };
    }

    let totalScore = 0;
    let completedCount = 0;

    tasks.forEach(t => {
      const status = project.statuses.find(s => s.id === t.statusId);
      if (status?.isDoneState) {
        totalScore += 100;
        completedCount++;
      } else if (t.subtasks && t.subtasks.length > 0) {
        const completedSubs = t.subtasks.filter(s => s.isCompleted).length;
        totalScore += calculateProgress(completedSubs, t.subtasks.length);
      }
    });

    const progressPercentage = Math.round(totalScore / tasks.length);
    return {
      totalTasks: tasks.length,
      completedTasks: completedCount,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    };
  };

  // Computed Team Workload
  const getWorkloadData = () => {
    return users.map(user => {
      const userTasks = tasks.filter(t => {
        const status = project.statuses.find(s => s.id === t.statusId);
        return t.assigneeId === user.id && !status?.isDoneState;
      });

      const totalHours = userTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      const capacity = user.weeklyCapacityHours || 40;
      const percentage = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;

      let status: 'LIGHT' | 'OPTIMAL' | 'OVERLOAD' = 'OPTIMAL';
      if (percentage < 50) status = 'LIGHT';
      else if (percentage > 100) status = 'OVERLOAD';

      return {
        user,
        totalHours,
        capacity,
        percentage,
        status,
        tasks: userTasks,
      };
    });
  };

  if (!isLoaded) return null;

  return (
    <TaskContext.Provider
      value={{
        currentUser,
        users,
        project,
        tasks,
        docs,
        activities,
        visibleActivities,
        notifications,
        selectedTaskId,
        toastMessage,
        setSelectedTaskId,
        setToastMessage,
        login,
        logout,
        addUser,
        updateUserRole,
        deleteUser,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        updateTaskStatus,
        createTask,
        updateTask,
        deleteTask,
        addComment,
        deleteComment,
        addTimeLog,
        deleteTimeLog,
        addDependency,
        removeDependency,
        saveDoc,
        deleteDoc,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        getProjectProgress,
        getWorkloadData,
        personalTodos,
        personalNotes,
        savedSheets,
        addPersonalTodo,
        togglePersonalTodo,
        updatePersonalTodo,
        deletePersonalTodo,
        togglePersonalTodoSubtask,
        addPersonalTodoSubtask,
        deletePersonalTodoSubtask,
        rolloverPendingTodos,
        savePersonalNote,
        deletePersonalNote,
        saveSheetLink,
        deleteSheetLink,
        updateProfile,
      }}
    >
      {children}
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
