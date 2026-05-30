import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select, Button, Spin, Typography, Empty, Modal,
  InputNumber, message, DatePicker, Tooltip, Space, Grid,
} from 'antd';

const { useBreakpoint } = Grid;
import { PlusOutlined, BookOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleApi } from '../api/schedule';
import { journalApi } from '../api/journal';
import type { ScheduleSlot, JournalResponse, JournalStudent, AttendanceStatus } from '../types';

const { Title, Text } = Typography;

const HOVER_BG = '#bae0ff';
const HEADER_HOVER = '#91caff';

// ─── helpers ────────────────────────────────────────────────────────────────

function cellBg(
  _grade: number | null,
  attendance: AttendanceStatus | null,
  isHigh: boolean,
): string {
  if (isHigh) return HOVER_BG;
  if (attendance === 'absent') return '#fff1f0';
  if (attendance === 'late') return '#fffbe6';
  return 'white';
}

function cellText(grade: number | null, attendance: AttendanceStatus | null): string {
  const att = attendance === 'absent' ? 'Н' : attendance === 'late' ? 'О' : null;
  if (att && grade !== null) return `${grade}`;
  if (att) return att;
  if (grade !== null) return String(grade);
  return '';
}

function cellFg(grade: number | null, attendance: AttendanceStatus | null): string {
  if (attendance === 'absent') return '#cf1322';
  if (attendance === 'late') return '#d48806';
  if (grade === null) return '#333';
  if (grade >= 10) return '#389e0d';
  if (grade >= 7) return '#096dd9';
  if (grade >= 4) return '#d48806';
  return '#cf1322';
}

function rowStyle(student: JournalStudent): React.CSSProperties {
  if (student.isExpelled) return { opacity: 0.45, background: '#f5f5f5' };
  if (student.isNew) return { background: '#f6ffed' };
  return {};
}

// ─── unique subject+group pairs from schedule ────────────────────────────────

interface Pair { subjectId: number; subjectName: string; groupId: number; groupName: string; slots: ScheduleSlot[] }

function buildPairs(schedule: ScheduleSlot[]): Pair[] {
  const map = new Map<string, Pair>();
  for (const s of schedule) {
    const key = `${s.subjectId}-${s.groupId}`;
    if (!map.has(key)) {
      map.set(key, { subjectId: s.subjectId, subjectName: s.subjectName, groupId: s.groupId, groupName: s.groupName, slots: [] });
    }
    map.get(key)!.slots.push(s);
  }
  return [...map.values()];
}

// ─── component ───────────────────────────────────────────────────────────────

export default function TeacherJournalPage() {
  const navigate = useNavigate();
  const [, setSchedule] = useState<ScheduleSlot[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [selectedPair, setSelectedPair] = useState<Pair | null>(null);
  const [journal, setJournal] = useState<JournalResponse | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingJournal, setLoadingJournal] = useState(false);

  // hover state
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  // grade input popup
  const [editCell, setEditCell] = useState<{ studentId: number; lessonId: number } | null>(null);
  const [gradeValue, setGradeValue] = useState<number | null>(null);

  // mobile action picker
  const [mobileCell, setMobileCell] = useState<{ studentId: number; lessonId: number } | null>(null);

  // add lesson modal
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [lessonDate, setLessonDate] = useState<dayjs.Dayjs | null>(null);
  const [lessonSlotId, setLessonSlotId] = useState<number | null>(null);
  const [addingLesson, setAddingLesson] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    scheduleApi.getMySchedule()
      .then((slots) => {
        setSchedule(slots);
        const p = buildPairs(slots);
        setPairs(p);
        if (p.length === 1) setSelectedPair(p[0]);
      })
      .finally(() => setLoadingSchedule(false));
  }, []);

  const loadJournal = useCallback(async (pair: Pair) => {
    setLoadingJournal(true);
    try {
      const data = await journalApi.getTeacherJournal(pair.subjectId, pair.groupId);
      setJournal(data);
    } finally {
      setLoadingJournal(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPair) loadJournal(selectedPair);
  }, [selectedPair, loadJournal]);

  // ── cell interactions ──────────────────────────────────────────────────────

  function handleCellClick(studentId: number, lessonId: number) {
    const cell = journal!.students
      .find((s) => s.id === studentId)
      ?.cells.find((c) => c.lessonId === lessonId);
    setGradeValue(cell?.grade ?? null);
    setEditCell({ studentId, lessonId });
  }

  function handleCellRightClick(e: React.MouseEvent, studentId: number, lessonId: number) {
    e.preventDefault();
    saveAttendance(studentId, lessonId, 'absent');
  }

  function handleCellMiddleClick(e: React.MouseEvent, studentId: number, lessonId: number) {
    if (e.button !== 1) return;
    e.preventDefault();
    saveAttendance(studentId, lessonId, 'late');
  }

  async function saveAttendance(studentId: number, lessonId: number, status: AttendanceStatus) {
    try {
      await journalApi.setAttendance(studentId, lessonId, status);
      applyAttendance(studentId, lessonId, status);
    } catch {
      messageApi.error('Ошибка сохранения');
    }
  }

  async function confirmGrade() {
    if (!editCell) return;
    const { studentId, lessonId } = editCell;
    try {
      if (gradeValue !== null) {
        await journalApi.setGrade(studentId, lessonId, gradeValue);
        applyGrade(studentId, lessonId, gradeValue);
      }
      setEditCell(null);
    } catch {
      messageApi.error('Ошибка сохранения оценки');
    }
  }

  // optimistic update helpers
  function applyGrade(studentId: number, lessonId: number, value: number) {
    setJournal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.id !== studentId ? s : {
            ...s,
            cells: s.cells.map((c) => c.lessonId !== lessonId ? c : { ...c, grade: value }),
          },
        ),
      };
    });
  }

  function applyAttendance(studentId: number, lessonId: number, status: AttendanceStatus) {
    setJournal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.id !== studentId ? s : {
            ...s,
            cells: s.cells.map((c) => c.lessonId !== lessonId ? c : { ...c, attendance: status }),
          },
        ),
      };
    });
  }

  // ── add lesson ─────────────────────────────────────────────────────────────

  async function handleAddLesson() {
    if (!lessonDate || !lessonSlotId) return;
    setAddingLesson(true);
    try {
      await journalApi.addLesson(lessonSlotId, lessonDate.format('YYYY-MM-DD'));
      messageApi.success('Урок добавлен');
      setAddLessonOpen(false);
      setLessonDate(null);
      if (selectedPair) loadJournal(selectedPair);
    } catch {
      messageApi.error('Ошибка при добавлении урока');
    } finally {
      setAddingLesson(false);
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (loadingSchedule) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const tdBase: React.CSSProperties = {
    border: '1px solid #e8e8e8',
    transition: 'background 0.08s',
    userSelect: 'none',
  };

  return (
    <>
      {contextHolder}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Title level={3} style={{ margin: 0 }}>Журнал</Title>
        <Select
          style={{ minWidth: 260 }}
          placeholder="Выберите предмет и группу"
          value={selectedPair ? `${selectedPair.subjectId}-${selectedPair.groupId}` : undefined}
          onChange={(val) => {
            const [sid, gid] = val.split('-').map(Number);
            const pair = pairs.find((p) => p.subjectId === sid && p.groupId === gid) ?? null;
            setSelectedPair(pair);
          }}
          options={pairs.map((p) => ({
            value: `${p.subjectId}-${p.groupId}`,
            label: `${p.subjectName} — ${p.groupName}`,
          }))}
        />
        {selectedPair && (
          <>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setLessonSlotId(selectedPair.slots[0]?.id ?? null);
                setAddLessonOpen(true);
              }}
            >
              Добавить урок
            </Button>
            <Button
              icon={<BookOutlined />}
              onClick={() => navigate(`/teacher/subjects/${selectedPair.subjectId}`)}
            >
              Программа предмета
            </Button>
          </>
        )}
      </div>

      {!selectedPair && <Empty description="Выберите предмет и группу" />}

      {selectedPair && loadingJournal && <Spin />}

      {selectedPair && !loadingJournal && journal && (
        <>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            {isMobile
              ? 'Нажмите на ячейку — выберите действие'
              : 'ЛКМ — оценка  |  ПКМ — Н (пропуск)  |  СКМ — О (опоздание)'}
          </Text>
          <div style={{ overflowX: 'auto', borderRadius: 8, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...tdBase, padding: '10px 14px', background: '#fafafa', textAlign: 'left', minWidth: 160, fontWeight: 600, position: 'sticky', left: 0, zIndex: 2 }}>
                    Студент
                  </th>
                  {journal.lessons.map((lesson, ci) => (
                    <th
                      key={lesson.id}
                      style={{
                        ...tdBase,
                        padding: '6px 4px',
                        background: hoveredCol === ci ? HEADER_HOVER : '#fafafa',
                        textAlign: 'center',
                        minWidth: 50,
                        fontSize: 11,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lesson.date.slice(5).replace('-', '.')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {journal.students.map((student, ri) => (
                  <tr key={student.id} style={rowStyle(student)}>
                    <td
                      style={{
                        ...tdBase,
                        padding: '8px 14px',
                        background: hoveredRow === ri ? HOVER_BG : (student.isNew ? '#f6ffed' : student.isExpelled ? '#f5f5f5' : 'white'),
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        fontSize: 13,
                      }}
                    >
                      <Space size={6}>
                        {student.name}
                        {student.isNew && <Text type="success" style={{ fontSize: 11 }}>новый</Text>}
                        {student.isExpelled && <Text type="secondary" style={{ fontSize: 11 }}>отчислен</Text>}
                      </Space>
                    </td>
                    {journal.lessons.map((lesson, ci) => {
                      const cell = student.cells.find((c) => c.lessonId === lesson.id);
                      const isHigh = hoveredRow === ri || hoveredCol === ci;
                      const bg = cellBg(cell?.grade ?? null, cell?.attendance ?? null, isHigh);
                      const txt = cell ? cellText(cell.grade, cell.attendance) : '';
                      const fg = cell ? cellFg(cell.grade, cell.attendance) : '#333';
                      const isEditing = editCell?.studentId === student.id && editCell?.lessonId === lesson.id;

                      return (
                        <td
                          key={lesson.id}
                          style={{
                            ...tdBase,
                            background: bg,
                            textAlign: 'center',
                            fontSize: 13,
                            fontWeight: txt ? 600 : 400,
                            color: fg,
                            cursor: student.isExpelled ? 'not-allowed' : 'pointer',
                            padding: '4px 2px',
                            minWidth: 50,
                            position: 'relative',
                          }}
                          onMouseEnter={() => { if (!isMobile) { setHoveredRow(ri); setHoveredCol(ci); } }}
                          onMouseLeave={() => { if (!isMobile) { setHoveredRow(null); setHoveredCol(null); } }}
                          onClick={() => {
                            if (student.isExpelled) return;
                            if (isMobile) setMobileCell({ studentId: student.id, lessonId: lesson.id });
                            else handleCellClick(student.id, lesson.id);
                          }}
                          onContextMenu={(e) => !isMobile && !student.isExpelled && handleCellRightClick(e, student.id, lesson.id)}
                          onMouseDown={(e) => !isMobile && !student.isExpelled && handleCellMiddleClick(e, student.id, lesson.id)}
                        >
                          {isEditing ? (
                            <InputNumber
                              autoFocus
                              min={1}
                              max={12}
                              value={gradeValue}
                              onChange={(v) => setGradeValue(v)}
                              onPressEnter={confirmGrade}
                              onBlur={confirmGrade}
                              size="small"
                              style={{ width: 46 }}
                              controls={false}
                            />
                          ) : (
                            <Tooltip title={cell?.attendance === 'absent' ? 'Пропуск' : cell?.attendance === 'late' ? 'Опоздание' : undefined} placement="top">
                              <span>{txt || ' '}</span>
                            </Tooltip>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mobile action picker */}
      <Modal
        title="Действие"
        open={!!mobileCell}
        onCancel={() => setMobileCell(null)}
        footer={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
          <Button
            block
            onClick={() => {
              if (mobileCell) { handleCellClick(mobileCell.studentId, mobileCell.lessonId); setMobileCell(null); }
            }}
          >
            Выставить оценку
          </Button>
          <Button
            block
            danger
            onClick={() => {
              if (mobileCell) { saveAttendance(mobileCell.studentId, mobileCell.lessonId, 'absent'); setMobileCell(null); }
            }}
          >
            Н — пропуск
          </Button>
          <Button
            block
            onClick={() => {
              if (mobileCell) { saveAttendance(mobileCell.studentId, mobileCell.lessonId, 'late'); setMobileCell(null); }
            }}
          >
            О — опоздание
          </Button>
        </div>
      </Modal>

      {/* Add lesson modal */}
      <Modal
        title="Добавить урок"
        open={addLessonOpen}
        onCancel={() => setAddLessonOpen(false)}
        onOk={handleAddLesson}
        okText="Добавить"
        cancelText="Отмена"
        confirmLoading={addingLesson}
        okButtonProps={{ disabled: !lessonDate || !lessonSlotId }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {selectedPair && selectedPair.slots.length > 1 && (
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>Занятие (день/время):</Text>
              <Select
                style={{ width: '100%' }}
                value={lessonSlotId}
                onChange={setLessonSlotId}
                options={selectedPair.slots.map((s) => ({
                  value: s.id,
                  label: `${['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][s.dayOfWeek]} ${s.startTime}–${s.endTime}`,
                }))}
              />
            </div>
          )}
          <div>
            <Text style={{ display: 'block', marginBottom: 4 }}>Дата урока:</Text>
            <DatePicker
              style={{ width: '100%' }}
              value={lessonDate}
              onChange={setLessonDate}
              format="DD.MM.YYYY"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
