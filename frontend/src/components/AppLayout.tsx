import { useState, type ReactNode } from 'react';
import { Layout, Menu, Button, Typography, Drawer, Grid } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarOutlined,
  BookOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const studentItems = [
  { key: '/schedule', icon: <CalendarOutlined />, label: 'Расписание' },
  { key: '/journal', icon: <BookOutlined />, label: 'Журнал' },
];

const teacherItems = [
  { key: '/schedule', icon: <CalendarOutlined />, label: 'Расписание' },
  { key: '/teacher/journal', icon: <BookOutlined />, label: 'Журнал' },
];

function NavMenu({
  selectedKey,
  items,
  onSelect,
  user,
  onLogout,
}: {
  selectedKey: string;
  items: typeof studentItems;
  onSelect: (key: string) => void;
  user: { name: string } | null;
  onLogout: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 16px 14px', fontWeight: 700, fontSize: 16, borderBottom: '1px solid #f0f0f0' }}>
        Журнал КБП
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={({ key }) => onSelect(key)}
        style={{ border: 'none', flex: 1 }}
      />
      <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
        <Text style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name}
        </Text>
        <Button block size="small" icon={<LogoutOutlined />} onClick={onLogout}>
          Выйти
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = !screens.md;
  const menuItems = user?.role === 'teacher' ? teacherItems : studentItems;
  const selectedKey = menuItems.find((i) => location.pathname.startsWith(i.key))?.key ?? '';

  function handleSelect(key: string) {
    navigate(key);
    setDrawerOpen(false);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            background: 'white',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            size="large"
          />
          <Text strong style={{ fontSize: 16 }}>Журнал КБП</Text>
        </Header>

        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ wrapper: { width: 240 }, body: { padding: 0 }, header: { display: 'none' } }}
        >
          <NavMenu
            selectedKey={selectedKey}
            items={menuItems}
            onSelect={handleSelect}
            user={user}
            onLogout={handleLogout}
          />
        </Drawer>

        <Content style={{ padding: 16, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={220}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
      >
        <NavMenu
          selectedKey={selectedKey}
          items={menuItems}
          onSelect={handleSelect}
          user={user}
          onLogout={handleLogout}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
