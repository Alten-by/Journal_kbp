import { Form, Input, Button, Card, Typography, message, Grid } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  async function onFinish(values: LoginForm) {
    try {
      const data = await authApi.login(values.email, values.password);
      login(data.token, data.user);
      navigate(data.user.role === 'teacher' ? '/teacher/journal' : '/schedule');
    } catch {
      messageApi.error('Неверный email или пароль');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', background: '#f0f2f5', padding: isMobile ? '32px 16px' : 0 }}>
      {contextHolder}
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Электронный журнал</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="teacher1@test.com" />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
            <Input.Password placeholder="password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Войти</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
