import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { UserOutlined, DashboardOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, UnorderedListOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import UserProfile from './pages/UserProfile';
import ExpensesPage from './pages/ExpensesPage'; // Importa la nueva página ExpensesPage
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const { currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      console.error('Failed to logout');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="user-greeting" style={{ color: 'white', padding: '16px', textAlign: 'center' }}>
          {collapsed ? <UserOutlined /> : currentUser ? `Hi, ${currentUser.displayName || 'User'}` : 'Hi, User'}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            <Link to="/dashboard">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<UnorderedListOutlined />}>
            <Link to="/expenses">Expenses</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />}>
            <Link to="/profile">Profile</Link>
          </Menu.Item>
          {currentUser && (
            <Menu.Item key="4" icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Menu.Item>
          )}
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggle,
          })}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/expenses" element={<PrivateRoute><ExpensesPage /></PrivateRoute>} /> {/* Añadir ruta para ExpensesPage */}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
