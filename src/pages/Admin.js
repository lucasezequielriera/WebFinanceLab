import React, { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import {
  CheckSquareOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const adminMenuItems = [
  {
    key: '/admin/tasks',
    icon: <CheckSquareOutlined />,
    label: 'Tasks',
  },
  {
    key: '/admin/users',
    icon: <UserOutlined />,
    label: 'Users',
  },
  {
    key: '/admin/configuration',
    icon: <SettingOutlined />,
    label: 'Configuration',
  },
];

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/tasks');
    }
  }, [location.pathname, navigate]);

  return (
    <div style={{ display: 'flex', maxHeight: '100vh' }}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ width: 220, height: 'calc(100vh - 80px)', paddingTop: 32 }}
        items={adminMenuItems}
        onClick={({ key }) => navigate(key)}
      />
      <div style={{ flex: 1, padding: 10, height: 'calc(100vh - 80px)' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Admin; 