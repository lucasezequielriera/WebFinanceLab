import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Tag, Modal, Tooltip, Button } from 'antd';
import { UserOutlined, DashboardOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, PlusOutlined, LoginOutlined, CreditCardOutlined, FlagOutlined, InfoCircleOutlined, LeftOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';
import UserProfile from './pages/UserProfile';
import DetailedExpenses from './pages/DetailedExpenses';
import GeneralExpenses from './pages/GeneralExpenses';
import AddExpense from './components/AddExpense';
import AddTarget from './components/AddTarget';
import Expenses from './pages/Expenses'; // Importa el nuevo componente
import AboutUs from './pages/AboutUs';
import FinancialGoals from './pages/FinancialGoals';
import AccountTypeBadge from './components/AccountTypeBadge';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';
import { Typography } from 'antd';
import logo from './assets/transparent-logo.png';
import { useTranslation } from 'react-i18next';
import useIsMobile from './hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';

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
  const {currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('1');
  const [userData, setUserData] = useState();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
  
    const fetchUserData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
  
          if (!isMounted) return;
  
          setUserData(data);
        }
      }
    };
  
    fetchUserData();
  
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

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
      label: <Link to="/dashboard">{t('userProfile.navbar.dashboard')}</Link>
    },
    {
      key: '5',
      icon: <CreditCardOutlined />,
      label: <Link to="/expenses">{t('userProfile.navbar.expenses')}</Link>
    },
    {
      key: '7',
      icon: <FlagOutlined />,
      label: <Link to="/financial-goals">{t('userProfile.navbar.financialGoals')}</Link>
    },
    {
      key: '6',
      icon: <InfoCircleOutlined />,
      label: <Link to="/about-us">{t('userProfile.navbar.aboutUs')}</Link>
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: <Link to="/profile">{t('userProfile.navbar.profile')}</Link>
    },
    {
      key: '4',
      icon: <LogoutOutlined />,
      label: t('userProfile.navbar.logout'),
      onClick: handleLogout
    }
  ] : [
    {
      key: 'signup',
      icon: <UserOutlined />,
      label: <Link to="/signup">{t('userProfile.navbar.signup')}</Link>,
      hidden: location.pathname === '/signup',
    },
    {
      key: 'login',
      icon: <LoginOutlined />,
      label: <Link to="/login">{t('userProfile.navbar.login')}</Link>,
      hidden: location.pathname === '/login',
    }
  ];

  const getPageIcon = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard'))       return <DashboardOutlined />;
    if (path.startsWith('/expenses'))        return <CreditCardOutlined />;
    if (path.startsWith('/financial-goals')) return <FlagOutlined />;
    if (path.startsWith('/about-us'))        return <InfoCircleOutlined />;
    if (path.startsWith('/profile'))         return <UserOutlined />;
    if (path.startsWith('/detailed-expenses')) return <LeftOutlined onClick={() => navigate(-1)}/>;
    if (path.startsWith('/general-expenses'))  return <LeftOutlined onClick={() => navigate(-1)}/>;
    return null;
  };

  // --- título según la ruta ---
  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard'))        return t('userProfile.navbar.dashboard');
    if (location.pathname.startsWith('/expenses'))         return t('userProfile.navbar.expenses');
    if (location.pathname.startsWith('/financial-goals'))  return t('userProfile.navbar.financialGoals');
    if (location.pathname.startsWith('/about-us'))         return t('userProfile.navbar.aboutUs');
    if (location.pathname.startsWith('/profile'))          return t('userProfile.navbar.profile');
    if (location.pathname.startsWith('/detailed-expenses'))return t('userProfile.navbar.detailedExpenses');
    if (location.pathname.startsWith('/general-expenses')) return t('userProfile.navbar.generalExpenses');
    return '';
  };

  const filteredMenuItems = menuItems.filter(item => !item.hidden);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider className="desktop-sider" trigger={null} collapsible collapsed={collapsed} breakpoint="md" collapsedWidth="0">

        {/* App Logo */}
        <div className="user-greeting" style={{ display: 'flex', color: 'white', padding: '10px', textAlign: 'center' }}>
          <img src={logo} alt="#" style={{ width: 60 }}/>
          <Title level={3} style={{ display: 'grid', margin: 0, fontSize: 20, lineHeight: '18px', textAlign: 'left', alignContent: 'center' }}>
            <Link to="/" style={{ color: 'white' }}>
              Web
              FinanceLab
            </Link>
          </Title>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={filteredMenuItems} />
        {currentUser && (
          <div className="sidebar-tags">
            <Tag color="green" className="sidebar-tag" onClick={showModal}>
              {t('userProfile.navbar.addExpense')}
            </Tag>
            <AddTarget />
            <Tooltip title={t('userProfile.comingSoon')} placement="right" style={{ marginRight: '30px' }}>
              <Tag color="blue" className="sidebar-tag disabled-tag" style={{ marginTop: '10px' }}>
              {t('userProfile.navbar.addStock')}
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
        <Content style={{ padding: 0, background: isAuthPage ? 'linear-gradient(135deg, #001123, #4094e9)' : 'transparent', maxHeight: '100vh', paddingBottom: 50 }}>
          { !isAuthPage &&
          <div className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 80, background: 'linear-gradient(90deg, rgb(0 68 121), rgb(0 163 137), rgb(0, 191, 145))', padding: '0px 20px' }}>
            <span style={{ fontSize: '20px', fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center' }}>

              {/* Title Navbar Mobile */}
              {isMobile ?
                (location.pathname.startsWith('/detailed-expenses') || location.pathname.startsWith('/general-expenses'))
                ? <span style={{ display: 'flex', alignItems: 'center' }}>
                    {React.cloneElement(getPageIcon(), { style: { fontSize: 24, marginRight: 10 } })}
                    {getPageTitle()}
                  </span>
                : <div className="user-greeting" style={{ display: 'flex', color: 'white', textAlign: 'center', marginLeft: "-10px" }}>
                    <img src={logo} alt="#" style={{ width: 60 }}/>
                    <Title level={3} style={{ display: 'grid', margin: 0, fontSize: 20, lineHeight: '18px', textAlign: 'left', alignContent: 'center', width: 110 }}>
                      <Link to="/" style={{ color: 'white' }}>
                        Web
                        FinanceLab
                      </Link>
                    </Title>
                  </div>
              : (location.pathname.startsWith('/detailed-expenses') || location.pathname.startsWith('/general-expenses'))
                ? <span style={{ display: 'flex', alignItems: 'center' }}>
                    {React.cloneElement(getPageIcon(), { style: { fontSize: 24, marginRight: 10 } })}
                    {getPageTitle()}
                  </span>
                : getPageTitle()
              }
            </span>
            <AccountTypeBadge type={userData?.user_access_level === 0 ? 'admin'
            : userData?.user_access_level === 2 ? 'premium'
            : userData?.user_access_level === 3 ? 'gold'
            : 'free'} />
          </div> }
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
            <Route path="*" element={<Navigate to="/dashboard" />} /> {/* Catch-all route */}
          </Routes>
        </Content>
        <Modal open={isModalVisible} onCancel={handleCancel} footer={null}>
          <AddExpense onExpenseAdded={handleExpenseAdded} />
        </Modal>
        {currentUser ? (
          <div className="mobile-nav">

            {/* NAVBAR LOGUED */}
            <Button type="link" icon={<CreditCardOutlined />}><Link to="/dashboard"></Link>{t("userProfile.navbar.dashboard")}</Button>
            <Button type="link" icon={<DashboardOutlined />}><Link to="/expenses"></Link>{t("userProfile.navbar.expenses")}</Button>
            <div className="add-expense-button-mobile">
              <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={showModal} />
            </div>
            <Button type="link" icon={<UserOutlined />}><Link to="/profile"></Link>{t("userProfile.navbar.profile")}</Button>
            <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout} size="large" className="logout">{t("userProfile.navbar.logout")}</Button>
          </div>
        ) :
          <div className="mobile-nav">
            {/* NAVBAR NO LOGUED */}
            {location.pathname === '/signup' ? (
              <Button type="link" icon={<UserOutlined />}><Link to="/login"></Link>{t("userProfile.navbar.login")}</Button>
            ) : (
              <Button type="link" icon={<UserOutlined />}><Link to="/signup"></Link>{t("userProfile.navbar.signup")}</Button>
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
