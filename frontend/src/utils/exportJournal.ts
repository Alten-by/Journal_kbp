import * as XLSX from 'xlsx';
import type { JournalResponse } from '../types';

export function exportJournalToExcel(
  journal: JournalResponse,
  subjectName: string,
  groupName: string,
) {
  const dates = journal.lessons.map((l) => l.date.slice(5).replace('-', '.'));

  const header = ['Студент', ...dates];

  const rows = journal.students.map((student) => {
    const cells = journal.lessons.map((lesson) => {
      const cell = student.cells.find((c) => c.lessonId === lesson.id);
      if (!cell) return '';
      const parts: string[] = [];
      if (cell.attendance === 'absent') parts.push('Н');
      else if (cell.attendance === 'late') parts.push(cell.lateMinutes != null ? `О(${cell.lateMinutes}м)` : 'О');
      if (cell.grade !== null) parts.push(String(cell.grade));
      return parts.join('/');
    });
    return [student.name, ...cells];
  });

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // column widths
  ws['!cols'] = [{ wch: 30 }, ...dates.map(() => ({ wch: 10 }))];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Журнал');

  const fileName = `Журнал_${groupName}_${subjectName}_${new Date().toLocaleDateString('ru-RU')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportJournalToCSV(
  journal: JournalResponse,
  subjectName: string,
  groupName: string,
) {
  const dates = journal.lessons.map((l) => l.date.slice(5).replace('-', '.'));
  const header = ['Студент', ...dates].join(';');

  const rows = journal.students.map((student) => {
    const cells = journal.lessons.map((lesson) => {
      const cell = student.cells.find((c) => c.lessonId === lesson.id);
      if (!cell) return '';
      const parts: string[] = [];
      if (cell.attendance === 'absent') parts.push('Н');
      else if (cell.attendance === 'late') parts.push(cell.lateMinutes != null ? `О(${cell.lateMinutes}м)` : 'О');
      if (cell.grade !== null) parts.push(String(cell.grade));
      return parts.join('/');
    });
    return [student.name, ...cells].join(';');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Журнал_${groupName}_${subjectName}_${new Date().toLocaleDateString('ru-RU')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
