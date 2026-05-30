import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Typography, Card, Button, Tag, Modal, Form, Input, Select,
  DatePicker, Switch, Upload, message, List, Empty, Space,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, EditOutlined, UploadOutlined,
  FileOutlined, TeamOutlined, EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';
import { labsApi } from '../api/labs';
import { scheduleApi } from '../api/schedule';
import { studentApi } from '../api/student';
import type { LabWork, LabType } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const LAB_TYPE_OPTIONS = [
  { value: 'lab', label: 'Лабораторная работа' },
  { value: 'practical', label: 'Практическая работа' },
  { value: 'test', label: 'Контрольная работа' },
  { value: 'theory', label: 'Тест / Опрос' },
];

const TYPE_COLORS: Record<LabType, string> = {
  lab: 'blue', practical: 'green', test: 'orange', theory: 'purple',
};

const TYPE_LABELS: Record<LabType, string> = {
  lab: 'Лаба', practical: 'Практика', test: 'Контрольная', theory: 'Тест',
};

interface StudentOption { value: number; label: string }

export default function TeacherSubjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectId = Number(id);

  const [labs, setLabs] = useState<LabWork[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabWork | null>(null);
  const [saving, setSaving] = useState(false);
  const [taskFile, setTaskFile] = useState<UploadFile[]>([]);
  const [isTeam, setIsTeam] = useState(false);
  const [teamStudents, setTeamStudents] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    Promise.all([
      labsApi.getLabs(subjectId),
      scheduleApi.getMySchedule(),
    ]).then(([labList, schedule]) => {
      setLabs(labList);
      const slot = schedule.find((s) => s.subjectId === subjectId);
      setSubjectName(slot?.subjectName ?? 'Предмет');
      setGroupId(slot?.groupId ?? null);
    }).finally(() => setLoading(false));
  }, [subjectId]);

  useEffect(() => {
    if (!groupId) return;
    studentApi.getGroupStudents(groupId).then((students) =>
      setStudentOptions(students.map((s) => ({ value: s.id, label: s.name }))),
    );
  }, [groupId]);

  function openCreate() {
    setEditingLab(null);
    setIsTeam(false);
    setTeamStudents([]);
    setTaskFile([]);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(lab: LabWork) {
    setEditingLab(lab);
    setIsTeam(lab.isTeam);
    setTeamStudents([]);
    setTaskFile([]);
    form.setFieldsValue({
      title: lab.title,
      type: lab.type,
      description: lab.description ?? '',
      startDate: lab.startDate ? dayjs(lab.startDate) : null,
      deadline: lab.deadline ? dayjs(lab.deadline) : null,
      isTeam: lab.isTeam,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('subjectId', String(subjectId));
      fd.append('title', values.title);
      fd.append('type', values.type);
      fd.append('description', values.description ?? '');
      fd.append('isTeam', String(isTeam));
      if (values.startDate) fd.append('startDate', values.startDate.format('YYYY-MM-DD'));
      if (values.deadline) fd.append('deadline', values.deadline.format('YYYY-MM-DD'));
      if (taskFile[0]?.originFileObj) fd.append('taskFile', taskFile[0].originFileObj as File);
      if (isTeam && teamStudents.length > 0) fd.append('teamStudentIds', JSON.stringify(teamStudents));

      if (editingLab) {
        const updated = await labsApi.updateLab(editingLab.id, fd);
        setLabs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        messageApi.success('Работа обновлена');
      } else {
        const created = await labsApi.createLab(fd);
        setLabs((prev) => [...prev, created]);
        messageApi.success('Работа создана');
      }
      setModalOpen(false);
    } catch {
      messageApi.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const grouped: Record<LabType, LabWork[]> = { lab: [], practical: [], test: [], theory: [] };
  for (const lab of labs) {
    if (lab.type in grouped) grouped[lab.type as LabType].push(lab);
  }

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/journal')}>
          Назад к журналу
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{subjectName}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Добавить работу
        </Button>
      </div>

      {labs.length === 0 && <Empty description="Работ ещё нет" />}

      {(Object.entries(grouped) as [LabType, LabWork[]][]).map(([type, list]) => {
        if (list.length === 0) return null;
        return (
          <Card
            key={type}
            title={<><Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Tag>{' '}{LAB_TYPE_OPTIONS.find(o => o.value === type)?.label}</>}
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={list}
              renderItem={(lab) => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/teacher/labs/${lab.id}/submissions`)}
                    >
                      Сдачи
                    </Button>,
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(lab)}
                    >
                      Изменить
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
                    title={
                      <Space>
                        {lab.title}
                        {lab.isTeam && <Tag color="purple" icon={<TeamOutlined />}>Командная</Tag>}
                      </Space>
                    }
                    description={
                      <Space>
                        {lab.deadline && (
                          <Text style={{ fontSize: 12, color: '#888' }}>
                            Дедлайн: {new Date(lab.deadline).toLocaleDateString('ru-RU')}
                          </Text>
                        )}
                        {lab.taskFilePath && (
                          <Button
                            type="link"
                            size="small"
                            href={`${import.meta.env.VITE_API_URL}${lab.taskFilePath}`}
                            target="_blank"
                            style={{ padding: 0, height: 'auto', fontSize: 12 }}
                          >
                            Скачать ТЗ
                          </Button>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        );
      })}

      {/* Create / Edit modal */}
      <Modal
        title={editingLab ? 'Редактировать работу' : 'Новая работа'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingLab ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        confirmLoading={saving}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Лабораторная работа №1" />
          </Form.Item>

          <Form.Item name="type" label="Тип работы" rules={[{ required: true }]}>
            <Select options={LAB_TYPE_OPTIONS} placeholder="Выберите тип" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Описание задания..." />
          </Form.Item>

          <Form.Item name="startDate" label="Дата начала работы">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" placeholder="Когда выдаётся работа" />
          </Form.Item>

          <Form.Item name="deadline" label="Дедлайн">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item label="Командная работа">
            <Switch checked={isTeam} onChange={setIsTeam} />
          </Form.Item>

          {isTeam && studentOptions.length > 0 && (
            <Form.Item label="Участники команды">
              <Select
                mode="multiple"
                options={studentOptions}
                value={teamStudents}
                onChange={setTeamStudents}
                placeholder="Выберите студентов"
              />
            </Form.Item>
          )}

          <Form.Item label="Файл задания (ТЗ)">
            <Upload
              beforeUpload={() => false}
              fileList={taskFile}
              onChange={({ fileList }) => setTaskFile(fileList.slice(-1))}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Выбрать файл</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
