import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from "firebase/auth"; 
import { db } from '../firebase'; // Importa db
import { setDoc, doc } from "firebase/firestore"; // Importa Firestore
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import '../styles/Auth.css';

const { Title } = Typography;

export default function Signup() {
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado de carga
  const navigate = useNavigate();

  async function handleSubmit(values) {
    try {
      setError('');
      setLoading(true); // Iniciar la carga
      const { firstName, lastName, email, password } = values;

      const userCredential = await signup(email, password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        language: 'en',
        age: '',
        city: '',
        gender: '',
        jobs: [],
        displayBalance: 'USD'
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error during signup:', err);
      setError('Failed to create an account');
      setLoading(false); // Terminar la carga en caso de error
    }
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-avatar">
          <img src={require('../assets/transparent-logo.png')} alt="Web Finance" style={{ width: 100 }} />
        </div>
        <Title level={3} className="auth-title">Sign Up</Title>
        {error && <Alert message={error} type="error" showIcon />}
        <Form onFinish={handleSubmit} className="auth-form">
          <Form.Item name="firstName" rules={[{ required: true, message: 'Please input your first name!' }]}>
            <Input prefix={<UserOutlined />} placeholder="First Name" />
          </Form.Item>
          <Form.Item name="lastName" rules={[{ required: true, message: 'Please input your last name!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Last Name" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading}>
              Sign Up
            </Button>
          </Form.Item>
        </Form>
        {/* <div className="auth-links">
          <Text>Already have an account? <Link to="/login">Log In</Link></Text>
        </div> */}
      </Card>
    </div>
  );
}
