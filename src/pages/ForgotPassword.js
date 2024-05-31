import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, notification } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import '../styles/Auth.css';

const { Title } = Typography;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
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
      await resetPassword(values.email);
      openNotificationWithIcon('success', 'Success', 'Check your inbox for further instructions');
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirige a la página de inicio de sesión después de 3 segundos
    } catch {
        openNotificationWithIcon('error', 'Error', 'Failed to reset password');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-avatar">
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </div>
        <Title level={3} className="auth-title">Password Reset</Title>
        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading}>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
