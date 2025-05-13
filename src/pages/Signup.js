import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from "firebase/auth"; 
import { db } from '../firebase';
import { setDoc, doc } from "firebase/firestore";
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
// Styles
import '../styles/Auth.css';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const { signup } = useAuth();
  const { selectedLanguage } = useLanguage();
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
      setError('');
      setLoading(true);

      const { firstName, lastName, email, password } = values;
      const userCredential = await signup(email, password);

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        language: selectedLanguage,
        age: '',
        city: '',
        gender: '',
        displayBalance: 'USD',
        user_access_level: 1
      });

      handleNavigation('/dashboard');
    } catch (err) {
      console.error('Error during signup:', err);
      setError(t('signup.errors.signupFailed'));
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <Card className={`auth-card ${isExiting ? 'slide-out' : ''}`}>
        <div className="auth-avatar">
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </div>

        <Title level={3} className="auth-title">{t('signup.title')}</Title>

        {error && <Alert style={{ marginBottom: '16px' }} message={error} type="error" showIcon />}

        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="firstName" rules={[{ required: true, message: t('signup.errors.requiredFirstName') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('signup.firstName')} />
          </Form.Item>
          <Form.Item name="lastName" rules={[{ required: true, message: t('signup.errors.requiredLastName') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('signup.lastName')}/>
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: t('signup.errors.requiredEmail') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('signup.email')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('signup.errors.requiredPassword') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('signup.password')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading}>
              {t('signup.signupButton')}
            </Button>
          </Form.Item>
        </Form>
        
        <div className="auth-links">
          <Link to="/login" onClick={(e) => {
            e.preventDefault();
            handleNavigation('/login');
          }}>{t('signup.haveAccount')}</Link>
        </div>
      </Card>
    </div>
  );
}

export default Signup;