import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Typography } from 'antd';
import type { JournalResponse } from '../types';

const { Title } = Typography;

const PIE_COLORS = ['#52c41a', '#ff4d4f', '#faad14'];

interface Props {
  journal: JournalResponse;
}

export default function JournalCharts({ journal }: Props) {
  // 1. Средняя оценка по студентам
  const avgByStudent = journal.students.map((s) => {
    const graded = s.cells.filter((c) => c.grade !== null);
    const avg = graded.length > 0
      ? graded.reduce((sum, c) => sum + c.grade!, 0) / graded.length
      : 0;
    return {
      name: s.name.split(' ').slice(0, 2).join(' '), // Фамилия Имя
      avg: Math.round(avg * 10) / 10,
    };
  }).filter((s) => s.avg > 0).sort((a, b) => b.avg - a.avg);

  // 2. Посещаемость: сколько всего present/absent/late
  let present = 0, absent = 0, late = 0;
  for (const s of journal.students) {
    for (const c of s.cells) {
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

  // 3. Средняя оценка по датам (динамика)
  const avgByDate = journal.lessons.map((lesson) => {
    const graded = journal.students
      .map((s) => s.cells.find((c) => c.lessonId === lesson.id))
      .filter((c) => c?.grade != null);
    const avg = graded.length > 0
      ? graded.reduce((sum, c) => sum + c!.grade!, 0) / graded.length
      : null;
    return {
      date: lesson.date.slice(5).replace('-', '.'),
      avg: avg !== null ? Math.round(avg * 10) / 10 : null,
    };
  }).filter((d) => d.avg !== null);

  if (avgByStudent.length === 0 && attData.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <Title level={4}>Аналитика</Title>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* Средние оценки студентов */}
        {avgByStudent.length > 0 && (
          <div style={{ flex: '1 1 380px', background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Средняя оценка</Title>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avgByStudent} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Средняя оценка']} />
                <Bar dataKey="avg" fill="#1677ff" radius={[4, 4, 0, 0]} />
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
                <Tooltip formatter={(v) => [v, 'Записей']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Динамика средней оценки */}
        {avgByDate.length > 1 && (
          <div style={{ flex: '1 1 380px', background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Title level={5} style={{ marginTop: 0 }}>Динамика оценок</Title>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={avgByDate} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, 'Средняя оценка']} />
                <Line type="monotone" dataKey="avg" stroke="#1677ff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}
