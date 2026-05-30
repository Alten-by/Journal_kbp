import { useEffect, useState } from 'react';
import { Spin, Typography, Empty, Tooltip } from 'antd';
import { journalApi, type MyJournalEntry } from '../api/journal';
import { studentApi, type StudentSubject } from '../api/student';
import type { AttendanceStatus } from '../types';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface JournalRow {
  subjectId: number;
  subjectName: string;
  cells: MyJournalEntry['cells'];
}

function gradeColor(grade: number): string {
  if (grade >= 9) return '#389e0d';
  if (grade >= 7) return '#096dd9';
  if (grade >= 5) return '#d48806';
  return '#cf1322';
}

function cellBg(grade: number | null, attendance: AttendanceStatus | null): string | undefined {
  if (attendance === 'absent') return '#fff1f0';
  if (attendance === 'late') return '#fffbe6';
  if (grade === null) return undefined;
  if (grade >= 9) return '#f6ffed';
  if (grade >= 7) return '#e6f7ff';
  if (grade >= 5) return '#fffbe6';
  return '#fff1f0';
}

function cellText(grade: number | null, attendance: AttendanceStatus | null): string {
  const att = attendance === 'absent' ? 'Н' : attendance === 'late' ? 'О' : null;
  if (att && grade !== null) return `${att}/${grade}`;
  if (att) return att;
  if (grade !== null) return String(grade);
  return '';
}

function cellTooltip(grade: number | null, attendance: AttendanceStatus | null): string {
  const parts: string[] = [];
  if (attendance === 'absent') parts.push('Пропуск');
  if (attendance === 'late') parts.push('Опоздание');
  if (grade !== null) parts.push(`Оценка: ${grade}`);
  return parts.join(', ');
}

const HOVER_BG = '#bae0ff';
const HEADER_HOVER_BG = '#91caff';

const tdBase: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  transition: 'background 0.1s',
  userSelect: 'none',
};

export default function JournalPage() {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<{ ri: number; ci: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([journalApi.getMyJournal(), studentApi.getSubjects()])
      .then(([journal, subjects]: [MyJournalEntry[], StudentSubject[]]) => {
        const nameMap = new Map(subjects.map((s) => [s.subjectId, s.subjectName]));
        setRows(
          journal.map((j) => ({
            subjectId: j.subjectId,
            subjectName: nameMap.get(j.subjectId) ?? `Предмет ${j.subjectId}`,
            cells: j.cells,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (rows.length === 0) return <><Title level={3}>Журнал</Title><Empty description="Данные отсутствуют" /></>;

  const allDates = Array.from(
    new Set(rows.flatMap((r) => r.cells.map((c) => c.date))),
  ).sort();

  return (
    <>
      <Title level={3}>Журнал</Title>
      <div style={{ overflowX: 'auto', borderRadius: 8, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th
                style={{
                  ...tdBase,
                  padding: '10px 16px',
                  background: '#fafafa',
                  textAlign: 'left',
                  minWidth: 180,
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                }}
              >
                Предмет
              </th>
              {allDates.map((date, ci) => (
                <th
                  key={date}
                  style={{
                    ...tdBase,
                    padding: '6px 4px',
                    background: hovered?.ci === ci ? HEADER_HOVER_BG : '#fafafa',
                    textAlign: 'center',
                    minWidth: 52,
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {date.slice(5).replace('-', '.')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.subjectId}>
                <td
                  style={{
                    ...tdBase,
                    padding: '9px 16px',
                    background: hovered?.ri === ri ? HOVER_BG : 'white',
                    fontWeight: 500,
                    cursor: 'pointer',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                  }}
                  onClick={() => navigate(`/subjects/${row.subjectId}`)}
                >
                  {row.subjectName}
                </td>
                {allDates.map((date, ci) => {
                  const cell = row.cells.find((c) => c.date === date);
                  const isHigh = hovered?.ri === ri || hovered?.ci === ci;
                  const bg = isHigh
                    ? HOVER_BG
                    : cell
                      ? (cellBg(cell.grade, cell.attendance) ?? 'white')
                      : 'white';
                  const text = cell ? cellText(cell.grade, cell.attendance) : '';
                  const tip = cell ? cellTooltip(cell.grade, cell.attendance) : '';
                  const color = cell?.grade !== null && cell?.grade !== undefined
                    ? gradeColor(cell.grade)
                    : cell?.attendance === 'absent'
                      ? '#cf1322'
                      : cell?.attendance === 'late'
                        ? '#d48806'
                        : '#333';

                  return (
                    <Tooltip key={date} title={tip || undefined}>
                      <td
                        style={{
                          ...tdBase,
                          padding: '6px 4px',
                          background: bg,
                          textAlign: 'center',
                          fontSize: 13,
                          fontWeight: text ? 600 : 400,
                          color,
                          cursor: 'default',
                        }}
                        onMouseEnter={() => setHovered({ ri, ci })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {text}
                      </td>
                    </Tooltip>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
