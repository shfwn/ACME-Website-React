import * as XLSX from 'xlsx';
import { PersonalTodo, PersonalNote } from '@/lib/store/task-store';

/**
 * Helper to export formatted multi-tab Excel (.xlsx) file
 * Tab 1: Jadwal Mingguan / To-Do
 * Tab 2: Catatan Harian (Logbook)
 * Tab 3: Ringkasan Produktivitas (KPI)
 */
export function exportMultiTabSpreadsheet(
  todos: PersonalTodo[],
  notes: PersonalNote[],
  filenamePrefix: string = 'rekap-produktivitas'
) {
  const wb = XLSX.utils.book_new();

  // Tab 1: Daftar To-Do & Jadwal
  const todoRows = todos.map((t, idx) => ({
    No: idx + 1,
    Tanggal: t.targetDate,
    'Jam Mulai': t.startTime || '-',
    'Jam Selesai': t.endTime || '-',
    Kategori: t.category,
    Prioritas: t.priority,
    'Judul Kegiatan': t.title,
    Deskripsi: t.description || '-',
    'Subtask Selesai': t.subtasks && t.subtasks.length > 0
      ? `${t.subtasks.filter(s => s.isCompleted).length}/${t.subtasks.length}`
      : '-',
    Status: t.isCompleted ? 'SELESAI' : 'BELUM',
  }));
  const wsTodos = XLSX.utils.json_to_sheet(todoRows);
  // Set column widths
  wsTodos['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 32 },
    { wch: 30 },
    { wch: 16 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTodos, 'Daftar To-Do & Jadwal');

  // Tab 2: Catatan Harian (Logbook)
  const noteRows = notes.map((n, idx) => ({
    No: idx + 1,
    'Tanggal Tertaut': n.linkedDate || '-',
    'Judul Catatan': n.title,
    Tags: (n.tags || []).join(', '),
    'Ringkasan Catatan': (n.contentMarkdown || '')
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 250),
    'Terakhir Diperbarui': n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('id-ID') : '-',
  }));
  const wsNotes = XLSX.utils.json_to_sheet(noteRows);
  wsNotes['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 30 },
    { wch: 20 },
    { wch: 50 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Catatan Harian');

  // Tab 3: Ringkasan Produktivitas (KPI)
  const completedCount = todos.filter(t => t.isCompleted).length;
  const pendingCount = todos.filter(t => !t.isCompleted).length;
  const totalCount = todos.length;
  const rate = totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '0%';

  const kpiRows = [
    { Metrik: 'Total Agenda / To-Do', Nilai: totalCount },
    { Metrik: 'Agenda Selesai', Nilai: completedCount },
    { Metrik: 'Agenda Tertunda / Belum Selesai', Nilai: pendingCount },
    { Metrik: 'Tingkat Penyelesaian (Completion Rate)', Nilai: rate },
    { Metrik: 'Total Catatan Terhubung', Nilai: notes.length },
    { Metrik: 'Tanggal Diekspor', Nilai: new Date().toLocaleDateString('id-ID') },
  ];
  const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
  wsKpi['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Ringkasan KPI');

  const todayIso = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}-${todayIso}.xlsx`);
}
