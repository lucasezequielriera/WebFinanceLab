import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, notification } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
// Styles
import '../styles/Auth.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const { login } = useAuth();
  const { Title } = Typography;
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  useEffect(() => {
    // Reset animation state when component mounts
    setIsExiting(false);
  }, []);

  const openNotificationWithIcon = (type, message, description) => {
    notification[type]({
        message: message,
        description: description,
    });
  };

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500); // Match this with the animation duration
  };

  async function handleSubmit(values) {
    try {
      setLoading(true);
      const { email, password } = values;
      await login(email, password);
      handleNavigation('/dashboard');
    } catch {
      openNotificationWithIcon('error', t('login.errors.loginFailed'));
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <Card className={`auth-card ${isExiting ? 'slide-out' : ''}`}>
        <div className="auth-avatar">
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </div>
        <Title level={3} className="auth-title">{t('login.title')}</Title>
        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="email" rules={[{ required: true, message: t('login.errors.requiredEmail') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('login.email')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('login.errors.requiredPassword')}]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('login.password')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading}>
              {t('login.loginButton')}
            </Button>
          </Form.Item>
        </Form>
        <div className="auth-links">
          <Link to="/forgot-password" onClick={(e) => {
            e.preventDefault();
            handleNavigation('/forgot-password');
          }}>{t('login.forgotPassword')}</Link>
          <Link to="/signup" onClick={(e) => {
            e.preventDefault();
            handleNavigation('/signup');
          }}>{t('login.signupLink')}</Link>
        </div>
      </Card>
    </div>
  );
}

export default Login;