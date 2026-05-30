import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Card, Tag, Button, Empty, Badge, Space } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, FileOutlined } from '@ant-design/icons';
import { studentApi, type StudentSubjectDetail, type StudentSubject, type LabEntry } from '../api/student';
import type { LabType, AttendanceStatus } from '../types';

const { Title, Text } = Typography;

const LAB_TYPE_LABELS: Record<LabType, string> = {
  lab: 'Лабораторные работы',
  practical: 'Практические работы',
  test: 'Контрольные работы',
  theory: 'Тесты и опросы',
};

function attendanceBadge(att: AttendanceStatus) {
  if (att === 'absent') return <Tag color="error">Н</Tag>;
  if (att === 'late') return <Tag color="warning">О</Tag>;
  return <Tag color="success">П</Tag>;
}

function gradeTag(value: number) {
  const color = value >= 9 ? 'success' : value >= 7 ? 'processing' : value >= 5 ? 'warning' : 'error';
  return <Tag color={color} style={{ fontWeight: 600, fontSize: 14 }}>{value}</Tag>;
}

function LabCard({ lab }: { lab: LabEntry }) {
  const navigate = useNavigate();
  const isSubmitted = !!lab.submittedAt;
  const isChecked = lab.grade !== null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/labs/${lab.id}`)}
    >
      <FileOutlined style={{ color: '#888', fontSize: 16 }} />
      <div style={{ flex: 1 }}>
        <Text strong>{lab.title}</Text>
        {lab.isTeam && <Tag style={{ marginLeft: 8 }} color="purple">Командная</Tag>}
        {lab.deadline && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            <ClockCircleOutlined /> Дедлайн: {new Date(lab.deadline).toLocaleDateString('ru-RU')}
          </div>
        )}
      </div>
      <Space>
        {isChecked && gradeTag(lab.grade!)}
        {isSubmitted && !isChecked && <Tag color="blue">Сдано</Tag>}
        {!isSubmitted && <Tag>Не сдано</Tag>}
      </Space>
    </div>
  );
}

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<StudentSubjectDetail | null>(null);
  const [subject, setSubject] = useState<StudentSubject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subjectId = Number(id);
    Promise.all([
      studentApi.getSubject(subjectId),
      studentApi.getSubjects(),
    ])
      .then(([d, subjects]) => {
        setDetail(d);
        setSubject(subjects.find((s) => s.subjectId === subjectId) ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (!detail) return <Empty />;

  const labTypes: LabType[] = ['lab', 'practical', 'test', 'theory'];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/journal')}>
          Назад к журналу
        </Button>
      </div>

      <Title level={3}>{subject?.subjectName ?? 'Предмет'}</Title>
      {subject?.teacherName && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          Преподаватель: {subject.teacherName}
        </Text>
      )}

      {/* Оценки за занятия */}
      <Card title="Оценки за занятия" style={{ marginBottom: 16 }}>
        {detail.lessonGrades.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Оценок нет" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {detail.lessonGrades.map((g) => (
                    <th
                      key={g.date}
                      style={{ padding: '6px 10px', textAlign: 'center', background: '#fafafa', border: '1px solid #f0f0f0', fontSize: 12, fontWeight: 500 }}
                    >
                      {new Date(g.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {detail.lessonGrades.map((g) => (
                    <td
                      key={g.date}
                      style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #f0f0f0' }}
                    >
                      <div>{g.value ? gradeTag(g.value) : '—'}</div>
                      <div style={{ marginTop: 2 }}>{attendanceBadge(g.attendance)}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Работы по типам */}
      {labTypes.map((type) => {
        const labs = detail.labs[type] ?? [];
        if (labs.length === 0) return null;
        const done = labs.filter((l) => l.grade !== null).length;
        return (
          <Card
            key={type}
            title={
              <span>
                {LAB_TYPE_LABELS[type]}
                <Badge
                  count={`${done}/${labs.length}`}
                  style={{ marginLeft: 12, background: done === labs.length ? '#52c41a' : '#1677ff' }}
                />
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {labs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </Card>
        );
      })}
    </>
  );
}
