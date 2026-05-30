import type { ReactNode } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarOutlined,
  BookOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;
const { Text } = Typography;

const studentItems = [
  { key: '/schedule', icon: <CalendarOutlined />, label: 'Расписание' },
  { key: '/journal', icon: <BookOutlined />, label: 'Журнал' },
];

const teacherItems = [
  { key: '/schedule', icon: <CalendarOutlined />, label: 'Расписание' },
  { key: '/teacher/journal', icon: <BookOutlined />, label: 'Журнал' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = user?.role === 'teacher' ? teacherItems : studentItems;
  const selectedKey = menuItems.find(i => location.pathname.startsWith(i.key))?.key ?? '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={220}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '18px 16px 14px', fontWeight: 700, fontSize: 16, borderBottom: '1px solid #f0f0f0' }}>
          Журнал КБП
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', flex: 1 }}
        />
        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <Text style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </Text>
          <Button
            block
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => { logout(); navigate('/login'); }}
          >
            Выйти
          </Button>
        </div>
      </Sider>
      <Layout>
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
