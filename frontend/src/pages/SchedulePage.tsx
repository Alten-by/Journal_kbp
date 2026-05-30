import { useEffect, useState } from 'react';
import { Card, Spin, Tag, Typography, Empty } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { scheduleApi } from '../api/schedule';
import type { ScheduleSlot } from '../types';

const { Title, Text } = Typography;

const DAY_NAMES: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scheduleApi.getMySchedule()
      .then(setSchedule)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const days = [1, 2, 3, 4, 5, 6]
    .map((d) => ({
      day: d,
      name: DAY_NAMES[d],
      slots: schedule
        .filter((s) => s.dayOfWeek === d)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((d) => d.slots.length > 0);

  if (days.length === 0) {
    return (
      <>
        <Title level={3}>Расписание</Title>
        <Empty description="Расписание не найдено" />
      </>
    );
  }

  return (
    <>
      <Title level={3}>Расписание</Title>
      {days.map(({ day, name, slots }) => (
        <Card
          key={day}
          title={<Text strong>{name}</Text>}
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: '8px 0' }}
        >
          {slots.map((slot, idx) => (
            <div
              key={slot.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '10px 20px',
                borderBottom: idx < slots.length - 1 ? '1px solid #f0f0f0' : undefined,
              }}
            >
              <div style={{ minWidth: 110, display: 'flex', alignItems: 'center', gap: 6, color: '#888' }}>
                <ClockCircleOutlined />
                <span style={{ fontSize: 13 }}>{slot.startTime} – {slot.endTime}</span>
              </div>
              <Text strong style={{ flex: 1 }}>{slot.subjectName}</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888' }}>
                <TeamOutlined />
                <Text style={{ fontSize: 13 }}>{slot.groupName}</Text>
              </div>
              {slot.room && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EnvironmentOutlined style={{ color: '#888' }} />
                  <Tag style={{ margin: 0 }}>{slot.room}</Tag>
                </div>
              )}
              {slot.teacherName && (
                <Text type="secondary" style={{ fontSize: 13 }}>{slot.teacherName}</Text>
              )}
            </div>
          ))}
        </Card>
      ))}
    </>
  );
}
