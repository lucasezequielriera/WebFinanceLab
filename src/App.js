import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Tag, Modal, Tooltip, Button } from 'antd';
import { UserOutlined, DashboardOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, PlusOutlined, LoginOutlined, CreditCardOutlined, FlagOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';
import UserProfile from './pages/UserProfile';
import DetailedExpenses from './pages/DetailedExpenses';
import GeneralExpenses from './pages/GeneralExpenses';
import MonthlyExpensesPage from './pages/MonthlyExpensesPage';
import AddExpense from './components/AddExpense';
import AddTarget from './components/AddTarget';
import Expenses from './pages/Expenses'; // Importa el nuevo componente
import AboutUs from './pages/AboutUs';
import FinancialGoals from './pages/FinancialGoals';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';
// Importaciones de AntD
import { Typography } from 'antd';

const { Title } = Typography;
const { Header, Sider, Content } = Layout;

const RedirectIfAuthenticated = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const AppLayout = () => {
  const { currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('1');

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      setSelectedKey('1');
    } else if (path.startsWith('/expenses')) {
      setSelectedKey('5');
    } else if (path.startsWith('/detailed-expenses')) {
      setSelectedKey('detailed-expenses');
    } else if (path.startsWith('/general-expenses')) {
      setSelectedKey('general-expenses');
    } else if (path.startsWith('/profile')) {
      setSelectedKey('2');
    } else if (path.startsWith('/financial-goals')) {
      setSelectedKey('7');
    } else if (path.startsWith('/about-us')) {
      setSelectedKey('6');
    } else if (path.startsWith('/signup')) {
      setSelectedKey('signup');
    } else if (path.startsWith('/login')) {
      setSelectedKey('login');
    } else {
      setSelectedKey('');
    }
  }, [location]);

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

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleExpenseAdded = (newExpense) => {
    setExpenses((prevExpenses) => {
      const updatedExpenses = [...prevExpenses, newExpense];
      const uniqueExpenses = updatedExpenses.reduce((acc, expense) => {
        if (!acc.find(e => e.id === expense.id)) {
          acc.push(expense);
        }
        return acc;
      }, []);
      return uniqueExpenses;
    });
    setIsModalVisible(false);
  };

  const menuItems = currentUser ? [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>
    },
    {
      key: '5',
      icon: <CreditCardOutlined />,
      label: <Link to="/expenses">Expenses</Link>
    },
    {
      key: '7',
      icon: <FlagOutlined />,
      label: <Link to="/financial-goals">Financial Goals</Link>
    },
    {
      key: '6',
      icon: <InfoCircleOutlined />,
      label: <Link to="/about-us">About Us</Link>
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>
    },
    {
      key: '4',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ] : [
    {
      key: 'signup',
      icon: <UserOutlined />,
      label: <Link to="/signup">Sign Up</Link>,
      hidden: location.pathname === '/signup',
    },
    {
      key: 'login',
      icon: <LoginOutlined />,
      label: <Link to="/login">Log In</Link>,
      hidden: location.pathname === '/login',
    }
  ];

  const filteredMenuItems = menuItems.filter(item => !item.hidden);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider className="desktop-sider" trigger={null} collapsible collapsed={collapsed} breakpoint="md" collapsedWidth="0">
        <div className="user-greeting" style={{ color: 'white', padding: '16px', textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            <Link to="/" style={{ color: 'white' }}>
              WebFinance<span style={{ fontSize: 13, verticalAlign: 'text-top' }}>®</span>
            </Link>
          </Title>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={filteredMenuItems} />
        {currentUser && (
          <div className="sidebar-tags">
            <Tag color="red" className="sidebar-tag" onClick={showModal}>
              Add Expense
            </Tag>
            <AddTarget /> {/* Añadir el nuevo componente aquí */}
            <Tooltip title="Coming Soon" placement="right" style={{ marginRight: '30px' }}>
              <Tag color="blue" className="sidebar-tag disabled-tag" style={{ marginTop: '10px' }}>
                Add Stock
              </Tag>
            </Tooltip>
          </div>
        )}
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggle,
          })}
        </Header>
        <Content style={{ padding: isAuthPage ? '0' : '24px', background: isAuthPage ? 'linear-gradient(135deg, #001123, #4094e9)' : 'transparent', minHeight: 280, paddingBottom: 50 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard expenses={expenses} handleExpenseAdded={handleExpenseAdded} /></PrivateRoute>} />
            <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} /> {/* Añadir nueva ruta */}
            <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />
            <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/financial-goals" element={<PrivateRoute><FinancialGoals /></PrivateRoute>} />
            <Route path="/about-us" element={<PrivateRoute><AboutUs /></PrivateRoute>} />
            <Route path="/detailed-expenses" element={<PrivateRoute><DetailedExpenses /></PrivateRoute>} />
            <Route path="/general-expenses" element={<PrivateRoute><GeneralExpenses /></PrivateRoute>} />
            <Route path="/monthly-expenses/:month" element={<PrivateRoute><MonthlyExpensesPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" />} /> {/* Catch-all route */}
          </Routes>
        </Content>
        <Modal title="Add Expense" open={isModalVisible} onCancel={handleCancel} footer={null}>
          <AddExpense onExpenseAdded={handleExpenseAdded} />
        </Modal>
        {currentUser ? (
          <div className="mobile-nav">
            <Button type="link" icon={<DashboardOutlined />}><Link to="/dashboard"></Link>Dashboard</Button>
            <Button type="link" icon={<CreditCardOutlined />}><Link to="/expenses"></Link>Expenses</Button>
            <div className="add-expense-button-mobile">
              <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={showModal} />
            </div>
            {/* <Button type="link" icon={<FlagOutlined />}><Link to="/financial-goals"></Link>Financial Goals</Button>
            <Button type="link" icon={<InfoCircleOutlined />}><Link to="/about-us"></Link>About Us</Button> */}
            <Button type="link" icon={<UserOutlined />}><Link to="/profile"></Link>Profile</Button>
            <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout} size="large" className="logout">Logout</Button>
          </div>
        ) :
          <div className="mobile-nav">
            {location.pathname === '/signup' ? (
                <Button type="link" icon={<UserOutlined />}><Link to="/login"></Link>Login</Button>
            ) : (
              <Button type="link" icon={<UserOutlined />}><Link to="/signup"></Link>Sign up</Button>
            )}
          </div>}
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
