import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Typography, Card, Tag, Button, Upload, message, Alert,
  Descriptions, Avatar, List, Divider, Space, Grid,
} from 'antd';

const { useBreakpoint } = Grid;
import {
  ArrowLeftOutlined, UploadOutlined, UserOutlined,
  CheckCircleOutlined, ClockCircleOutlined, TeamOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { labsApi, type LabDetail, type MySubmission } from '../api/labs';
import type { LabType } from '../types';

const { Title, Text, Paragraph } = Typography;

const LAB_TYPE_LABELS: Record<LabType, string> = {
  lab: 'Лабораторная работа',
  practical: 'Практическая работа',
  test: 'Контрольная работа',
  theory: 'Тест / Опрос',
};

const TYPE_COLORS: Record<LabType, string> = {
  lab: 'blue',
  practical: 'green',
  test: 'orange',
  theory: 'purple',
};

export default function LabPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [submission, setSubmission] = useState<MySubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const labId = Number(id);

  useEffect(() => {
    Promise.all([
      labsApi.getLabDetail(labId),
      labsApi.getMySubmissions(),
    ])
      .then(([detail, subs]) => {
        setLab(detail);
        setSubmission(subs.find((s) => s.labWorkId === labId) ?? null);
      })
      .finally(() => setLoading(false));
  }, [labId]);

  async function handleUpload() {
    if (fileList.length === 0) {
      messageApi.warning('Выберите файл для загрузки');
      return;
    }
    const fd = new FormData();
    fd.append('file', fileList[0].originFileObj as File);
    setUploading(true);
    try {
      await labsApi.submitLab(labId, fd);
      messageApi.success('Работа успешно сдана!');
      const subs = await labsApi.getMySubmissions();
      setSubmission(subs.find((s) => s.labWorkId === labId) ?? null);
      setFileList([]);
    } catch {
      messageApi.error('Ошибка при отправке файла');
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (!lab) return null;

  const isDeadlinePast = lab.deadline ? new Date(lab.deadline) < new Date() : false;

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Tag color={TYPE_COLORS[lab.type as LabType]}>{LAB_TYPE_LABELS[lab.type as LabType]}</Tag>
            {lab.isTeam && <Tag color="purple" icon={<TeamOutlined />}>Командная работа</Tag>}
            <Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>{lab.title}</Title>
          </div>
        </div>

        <Descriptions column={isMobile ? 1 : 2} size="small">
          {lab.startDate && (
            <Descriptions.Item label="Дата выдачи">
              {new Date(lab.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Descriptions.Item>
          )}
          {lab.deadline && (
            <Descriptions.Item label="Дедлайн">
              <Space>
                <ClockCircleOutlined style={{ color: isDeadlinePast ? '#cf1322' : '#d48806' }} />
                <Text type={isDeadlinePast ? 'danger' : undefined}>
                  {new Date(lab.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                {isDeadlinePast && <Tag color="error">Просрочено</Tag>}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>

        {lab.description && (
          <>
            <Divider />
            <Paragraph>{lab.description}</Paragraph>
          </>
        )}

        {lab.taskFilePath && (
          <Button
            type="link"
            href={`${import.meta.env.VITE_API_URL}${lab.taskFilePath}`}
            target="_blank"
            style={{ paddingLeft: 0 }}
          >
            Скачать задание
          </Button>
        )}
      </Card>

      {/* Участники команды */}
      {lab.isTeam && lab.teamMembers.length > 0 && (
        <Card title={<><TeamOutlined /> Команда</>} style={{ marginBottom: 16 }}>
          <List
            dataSource={lab.teamMembers}
            renderItem={(member) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={member.name}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Статус сдачи */}
      {submission ? (
        <Card title="Моя работа" style={{ marginBottom: 16 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Дата сдачи">
              {submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString('ru-RU')
                : '—'}
            </Descriptions.Item>
            {submission.filePath && (
              <Descriptions.Item label="Файл">
                <Button
                  type="link"
                  href={`${import.meta.env.VITE_API_URL}${submission.filePath}`}
                  target="_blank"
                  style={{ padding: 0 }}
                >
                  Скачать
                </Button>
              </Descriptions.Item>
            )}
            {submission.grade !== null && (
              <Descriptions.Item label="Оценка">
                <Tag color="success" style={{ fontWeight: 700, fontSize: 15 }}>
                  {submission.grade}
                </Tag>
              </Descriptions.Item>
            )}
            {submission.comment && (
              <Descriptions.Item label="Комментарий преподавателя">
                <Alert title={submission.comment} type="info" showIcon />
              </Descriptions.Item>
            )}
            {submission.checkedAt && (
              <Descriptions.Item label="Проверено">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  {new Date(submission.checkedAt).toLocaleString('ru-RU')}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Разрешить повторную сдачу если не проверено */}
          {!submission.checkedAt && (
            <>
              <Divider />
              <Text type="secondary">Вы можете пересдать работу, пока она не проверена</Text>
              <div style={{ marginTop: 12 }}>
                <Upload
                  beforeUpload={() => false}
                  fileList={fileList}
                  onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Выбрать файл</Button>
                </Upload>
                {fileList.length > 0 && (
                  <Button
                    type="primary"
                    onClick={handleUpload}
                    loading={uploading}
                    style={{ marginTop: 8 }}
                  >
                    Пересдать
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card title="Сдать работу">
          {isDeadlinePast && (
            <Alert
              title="Дедлайн пропущен"
              description="Вы всё ещё можете сдать работу, но она будет помечена как просроченная."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Upload
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Выбрать файл</Button>
          </Upload>
          {fileList.length > 0 && (
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              style={{ marginTop: 12 }}
            >
              Отправить работу
            </Button>
          )}
        </Card>
      )}
    </>
  );
}
