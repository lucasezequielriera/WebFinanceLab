import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MailOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
// Styles
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const { resetPassword } = useAuth();
  const { Title } = Typography;
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  useEffect(() => {
    // Reset animation state when component mounts
    setIsExiting(false);
  }, []);

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500); // Match this with the animation duration
  };

  async function handleSubmit(values) {
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(values.email);
      setMessage(t('forgotPassword.message'));
      setTimeout(() => {
        handleNavigation('/login');
      }, 2000);
    } catch (err) {
      console.error('Error during password reset:', err);
      setError(t('forgotPassword.errors.resetFailed'));
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <Card className={`auth-card ${isExiting ? 'slide-out' : ''}`}>
        <div className="auth-avatar">
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </div>

        <Title level={3} className="auth-title">{t('forgotPassword.title')}</Title>

        {error && <Alert style={{ marginBottom: '16px' }} message={error} type="error" showIcon />}
        {message && <Alert style={{ marginBottom: '16px' }} message={message} type="success" showIcon />}

        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="email" rules={[{ required: true, message: t('forgotPassword.errors.requiredEmail') }]}>
            <Input prefix={<MailOutlined />} placeholder={t('forgotPassword.email')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading}>
              {t('forgotPassword.resetButton')}
            </Button>
          </Form.Item>
        </Form>
        
        <div className="auth-links">
          <Link to="/login" onClick={(e) => {
            e.preventDefault();
            handleNavigation('/login');
          }}>{t('forgotPassword.backToLogin')}</Link>
        </div>
      </Card>
    </div>
  );
}

export default ForgotPassword;