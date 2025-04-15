import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, notification } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import '../styles/Auth.css';

const { Title } = Typography;

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openNotificationWithIcon = (type, message, description) => {
    notification[type]({
        message: message,
        description: description,
    });
  };

  async function handleSubmit(values) {
    try {
      setLoading(true);
      const { email, password } = values;
      await login(email, password );
      navigate('/dashboard');
    } catch {
      openNotificationWithIcon('error', 'Error', 'Failed to log in');
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-avatar">
          <img src={require('../assets/transparent-logo.png')} alt="Web Finance" style={{ width: 100 }} />
        </div>
        <Title level={3} className="auth-title">Log In</Title>
        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading}>
              Log In
            </Button>
          </Form.Item>
        </Form>
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </Card>
    </div>
  );
}
