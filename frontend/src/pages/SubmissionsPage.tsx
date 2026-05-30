import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Typography, Card, Table, Button, Tag, Modal, Form,
  InputNumber, Input, message, Space, Empty, Grid,
} from 'antd';

const { useBreakpoint } = Grid;
import {
  ArrowLeftOutlined, CheckOutlined, FileOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { labsApi } from '../api/labs';
import type { LabSubmission, LabWork } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const labId = Number(id);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [lab, setLab] = useState<LabWork | null>(null);
  const [submissions, setSubmissions] = useState<LabSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // review modal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<LabSubmission | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    Promise.all([
      labsApi.getSubmissions(labId),
      // Get lab info through detail endpoint
      labsApi.getLabDetail(labId),
    ])
      .then(([subs, detail]) => {
        setSubmissions(subs);
        setLab(detail as LabWork);
      })
      .finally(() => setLoading(false));
  }, [labId]);

  function openReview(sub: LabSubmission) {
    setReviewTarget(sub);
    form.setFieldsValue({ grade: sub.grade ?? undefined, comment: sub.comment ?? '' });
    setReviewOpen(true);
  }

  async function handleReview() {
    const values = await form.validateFields();
    if (!reviewTarget) return;
    setSaving(true);
    try {
      await labsApi.reviewSubmission(reviewTarget.id, values.grade, values.comment ?? '');
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === reviewTarget.id
            ? { ...s, grade: values.grade, comment: values.comment ?? null, checkedAt: new Date().toISOString() }
            : s,
        ),
      );
      messageApi.success('Оценка выставлена');
      setReviewOpen(false);
    } catch {
      messageApi.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<LabSubmission> = [
    {
      title: 'Студент',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Дата сдачи',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (val: string | null) =>
        val ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#888' }} />
            {new Date(val).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Space>
        ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Файл',
      dataIndex: 'filePath',
      key: 'filePath',
      render: (path: string | null) =>
        path ? (
          <Button
            type="link"
            icon={<FileOutlined />}
            href={`${import.meta.env.VITE_API_URL}${path}`}
            target="_blank"
            style={{ padding: 0 }}
          >
            Скачать
          </Button>
        ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Оценка',
      dataIndex: 'grade',
      key: 'grade',
      align: 'center',
      render: (grade: number | null, record) => {
        if (grade !== null) {
          const color = grade >= 10 ? 'success' : grade >= 7 ? 'processing' : grade >= 4 ? 'warning' : 'error';
          return (
            <Space direction="vertical" size={2} style={{ alignItems: 'center' }}>
              <Tag color={color} style={{ fontWeight: 700, fontSize: 14 }}>{grade}</Tag>
              {record.checkedAt && (
                <Text style={{ fontSize: 11, color: '#888' }}>
                  {new Date(record.checkedAt).toLocaleDateString('ru-RU')}
                </Text>
              )}
            </Space>
          );
        }
        return <Tag>Не проверено</Tag>;
      },
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
      render: (c: string | null) => c ? <Text style={{ fontSize: 13 }}>{c}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          type={record.grade === null ? 'primary' : 'default'}
          size="small"
          icon={<CheckOutlined />}
          onClick={() => openReview(record)}
        >
          {record.grade === null ? 'Проверить' : 'Изменить'}
        </Button>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const checkedCount = submissions.filter((s) => s.grade !== null).length;

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <Title level={3} style={{ margin: 0 }}>{lab?.title ?? 'Лабораторная'}</Title>
        <Tag color="blue">{`${checkedCount} / ${submissions.length} проверено`}</Tag>
      </div>

      {submissions.length === 0 ? (
        <Empty description="Работы ещё не сданы" />
      ) : (
        <Card>
          <Table
            dataSource={submissions}
            columns={isMobile ? columns.filter((c) => ['studentName', 'grade', 'action'].includes(String(c.key))) : columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: isMobile ? undefined : 700 }}
            rowClassName={(record) => record.grade !== null ? '' : 'submission-unchecked'}
          />
        </Card>
      )}

      {/* Review modal */}
      <Modal
        title={`Проверка работы — ${reviewTarget?.studentName}`}
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={handleReview}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={saving}
      >
        {reviewTarget?.filePath && (
          <div style={{ marginBottom: 16 }}>
            <Button
              type="link"
              icon={<FileOutlined />}
              href={`${import.meta.env.VITE_API_URL}${reviewTarget.filePath}`}
              target="_blank"
              style={{ padding: 0 }}
            >
              Открыть работу студента
            </Button>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="grade"
            label="Оценка (1–10)"
            rules={[{ required: true, message: 'Введите оценку' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="comment" label="Комментарий">
            <TextArea rows={3} placeholder="Хорошая работа! Обратите внимание на..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
