import { useEffect, useState } from 'react';
import { Spin, Typography, Empty, Select } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { journalApi, type MyJournalEntry } from '../api/journal';
import { studentApi, type StudentSubject } from '../api/student';

const { Title } = Typography;

const PIE_COLORS = ['#52c41a', '#ff4d4f', '#faad14'];

export default function StudentStatsPage() {
  const [journal, setJournal] = useState<MyJournalEntry[]>([]);
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([journalApi.getMyJournal(), studentApi.getSubjects()])
      .then(([j, s]) => {
        setJournal(j);
        setSubjects(s);
        if (s.length > 0) setSelectedSubjectId(s[0].subjectId);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (journal.length === 0) return <><Title level={3}>Успеваемость</Title><Empty description="Данных нет" /></>;

  const subjectName = (id: number) =>
    subjects.find((s) => s.subjectId === id)?.subjectName ?? `Предмет ${id}`;

  // 1. Средняя оценка по предметам
  const avgBySubject = journal.map((entry) => {
    const graded = entry.cells.filter((c) => c.grade !== null);
    const avg = graded.length > 0
      ? Math.round((graded.reduce((s, c) => s + c.grade!, 0) / graded.length) * 10) / 10
      : 0;
    return { name: subjectName(entry.subjectId), avg, subjectId: entry.subjectId };
  }).filter((e) => e.avg > 0);

  // 2. Посещаемость по всем предметам
  let present = 0, absent = 0, late = 0;
  for (const entry of journal) {
    for (const c of entry.cells) {
      if (c.attendance === 'absent') absent++;
      else if (c.attendance === 'late') late++;
      else if (c.attendance !== null) present++;
    }
  }
  const attData = [
    { name: 'Присутствовал', value: present },
    { name: 'Отсутствовал', value: absent },
    { name: 'Опоздал', value: late },
  ].filter((d) => d.value > 0);

  // 3. Динамика оценок по выбранному предмету
  const selectedEntry = journal.find((e) => e.subjectId === selectedSubjectId);
  const gradeDynamics = (selectedEntry?.cells ?? [])
    .filter((c) => c.grade !== null)
    .map((c) => ({
      date: c.date.slice(5).replace('-', '.'),
      grade: c.grade!,
    }));

  return (
    <>
      <Title level={3}>Успеваемость</Title>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* Средняя оценка по предметам */}
        {avgBySubject.length > 0 && (
          <div style={{ flex: '1 1 380px', background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Средняя оценка по предметам</Title>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avgBySubject} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Средняя оценка']} />
                <Bar dataKey="avg" fill="#1677ff" radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fontSize: 11, fill: '#555' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Посещаемость */}
        {attData.length > 0 && (
          <div style={{ flex: '1 1 280px', background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Посещаемость</Title>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={attData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {attData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} />
                <Tooltip formatter={(v) => [v, 'Занятий']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Динамика оценок по предмету */}
        <div style={{ flex: '1 1 380px', background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0 }}>Динамика оценок</Title>
            <Select
              size="small"
              style={{ flex: 1 }}
              value={selectedSubjectId ?? undefined}
              onChange={setSelectedSubjectId}
              options={subjects.map((s) => ({ value: s.subjectId, label: s.subjectName }))}
            />
          </div>
          {gradeDynamics.length < 2 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Недостаточно оценок" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={gradeDynamics} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Оценка']} />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="#1677ff"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </>
  );
}
