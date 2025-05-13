import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Form, Layout, Menu, Tag, Modal, Button, notification, Space, DatePicker, Input, Col, Row } from 'antd';
import { UserOutlined, DashboardOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined, LoginOutlined, CreditCardOutlined, FlagOutlined, InfoCircleOutlined, AlertOutlined, PlusOutlined, DollarOutlined, RiseOutlined, FallOutlined, FileTextOutlined, StockOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';
import UserProfile from './pages/UserProfile';
import GeneralExpenses from './pages/GeneralExpenses';
import Incomes from './pages/Incomes';
import AddExpense from './components/AddExpense';
import AboutUs from './pages/AboutUs';
import FinancialGoals from './pages/FinancialGoals';
import AccountTypeBadge from './components/AccountTypeBadge';
import { db } from './firebase';
import { doc, getDoc, collection, Timestamp, addDoc, updateDoc } from 'firebase/firestore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Typography } from 'antd';
import logo from './assets/transparent-logo.png';
import { useTranslation } from 'react-i18next';
import useIsMobile from './hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';
import CurrencyTagPicker from './components/CurrencyTagPicker'
import dayjs from 'dayjs';
import './index.css';
import './App.css';
import Admin from './pages/Admin';
import AdminRoute from './components/AdminRoute';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Configuration from './pages/Configuration';
import Summary from './pages/Summary';
import Debts from './pages/Debts';
import DailyExpenses from './pages/DailyExpenses';
import FixedExpenses from './pages/FixedExpenses';
import Landing from './pages/Landing';
import Legal from './pages/Legal';
import { LanguageProvider } from './contexts/LanguageContext';
import PublicRoute from './components/PublicRoute';

const { Title, Paragraph } = Typography;
const { Header, Sider, Content } = Layout;

const RedirectIfAuthenticated = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const AppLayout = ({ children }) => {
  const {currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [selectedKey, setSelectedKey] = useState('1');
  const [userData, setUserData] = useState();
  const [actionsVisible, setActionsVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);

  const [incomeForm] = Form.useForm();

  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    
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

    if (path.startsWith('/dashboard')) {
      setSelectedKey('1');
    } else if (path.startsWith('/incomes')) {
      setSelectedKey('8');
    } else if (path.startsWith('/fixed-expenses')) {
      setSelectedKey('5');
    } else if (path.startsWith('/summary')) {
      setSelectedKey('12');
    } else if (path.startsWith('/daily-expenses')) {
      setSelectedKey('9');
    } else if (path.startsWith('/general-expenses')) {
      setSelectedKey('10');
    } else if (path.startsWith('/debts')) {
      setSelectedKey('13');
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
  
    fetchUserData();
  
    return () => {
      isMounted = false;
    };
  }, [currentUser, location]);

  // Si estamos en la landing page, no mostramos el layout de la app
  if (location.pathname === '/') {
    return <Landing />;
  }

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
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
      key: '8',
      icon: <StockOutlined />,
      label: <Link to="/incomes">{t('userProfile.navbar.incomes')}</Link>
    },
    {
      key: 'dropdown',
      icon: <CreditCardOutlined />,
      label: t('userProfile.navbar.expenses.dropdown'),
      children: [
        {
          key: '12',
          label: <Link to="/summary">{t('userProfile.navbar.expenses.summary')}</Link>
        },
        {
          key: '9',
          label: <Link to="/daily-expenses">{t('userProfile.navbar.expenses.dailyExpenses')}</Link>
        },
        {
          key: '5',
          label: <Link to="/fixed-expenses">{t('userProfile.navbar.expenses.payments')}</Link>
        },
      ],
    },
    // {
    //   key: '13',
    //   icon: <AlertOutlined />,
    //   label: <Link to="/debts">{t('userProfile.navbar.debts')}</Link>
    // },
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

  // Title in Up Navbar
  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard'))         return t('userProfile.navbar.dashboard');
    if (location.pathname.startsWith('/incomes'))           return t('userProfile.navbar.incomes');
    if (location.pathname.startsWith('/fixed-expenses'))    return t('userProfile.navbar.expenses.payments');
    if (location.pathname.startsWith('/summary'))           return t('userProfile.expenses.summary.title');
    if (location.pathname.startsWith('/financial-goals'))   return t('userProfile.navbar.financialGoals');
    if (location.pathname.startsWith('/about-us'))          return t('userProfile.navbar.aboutUs');
    if (location.pathname.startsWith('/profile'))           return t('userProfile.navbar.profile');
    if (location.pathname.startsWith('/daily-expenses'))    return t('userProfile.typeOfAccount.dropdown.dailyExpenses');
    if (location.pathname.startsWith('/debts'))             return t('userProfile.navbar.debts');
    return '';
  };

  const filteredMenuItems = menuItems.filter(item => !item.hidden);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';

  const closeActions = () => setActionsVisible(false);
  const toggleActions = () => setActionsVisible(v => !v);

  const openExpense = () => {
    closeActions();
    setIsModalVisible(true);
  };
  
  const openIncome = () => {
    closeActions();
    setIncomeModalVisible(true);
    incomeForm.setFieldsValue({ date: dayjs() });
  };
  
  const handleIncomeSubmit = async (values) => {
    try {
      await addDoc(
        collection(db, `users/${currentUser.uid}/incomes`),
        {
          title:    values.title,
          amount:   Number(values.amount),
          currency: values.currency,
          timestamp: Timestamp.now(),
          date:     values.date.toDate()
        }
      );
      await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
      notification.success({ message: 'Ingreso agregado' });
      setIncomeModalVisible(false);
      incomeForm.resetFields();
    } catch (e) {
      notification.error({ message: 'Error al agregar ingreso' });
    }
  };

  return (
    <Layout className="main-container" style={{ minHeight: '100vh' }}>
      <Sider className="desktop-sider" trigger={null} collapsible collapsed={collapsed} breakpoint="md" collapsedWidth="0">
        {/* APP LOGO NAVBAR DESKTOP */}
        <div className="user-greeting" style={{ display: 'flex', color: 'white', padding: '10px', textAlign: 'center' }}>
          <img src={logo} alt="#" style={{ width: 60 }}/>
          <Title level={3} style={{ display: 'grid', margin: 0, fontSize: 20, lineHeight: '18px', textAlign: 'left', alignContent: 'center' }}>
            {currentUser ? (
              userData?.user_access_level === 0 ? (
                <Link to="/admin" style={{ color: 'white' }}>
                  Web
                  FinanceLab
                </Link>
              ) : (
                <Link to="/dashboard" style={{ color: 'white' }}>
                  Web
                  FinanceLab
                </Link>
              )
            ) : (
              <span style={{ color: 'white' }}>
                Web
                FinanceLab
              </span>
            )}
          </Title>
        </div>

        {/* LOGUED VERTICAL NAVBAR */}
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={filteredMenuItems} />

        {/* IF I'M LOGUED */}
        {currentUser && (
          <div className="sidebar-tags">
            <Tag color="red" className="sidebar-tag" onClick={showModal} style={{ fontSize: 14, color: 'white', fontWeight: 500,
              background: 'linear-gradient(90deg, rgb(0, 163, 137), rgb(0, 191, 145))', border: '1px solid white !important', borderColor: '#344e6d', textShadow: '0 0 16px black', marginBottom: 10 }}>
              {t('userProfile.navbar.addExpense')}
            </Tag>
            <Tag color="green" className="sidebar-tag" onClick={() => {
                setActionsVisible(false);
                openIncome();
              }} style={{ fontSize: 14, color: 'white', fontWeight: 500, background: 'transparent',
              border: '1px solid white !important', textShadow: '0 0 16px black', borderColor: '#344e6d' }}>
              {t('userProfile.navbar.addIncome')}
            </Tag>
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
              { isMobile ?
                <div className="user-greeting" style={{ display: 'flex', color: 'white', textAlign: 'center', marginLeft: "-10px" }}>
                  <img src={logo} alt="#" style={{ width: 60 }}/>
                  <Title level={3} style={{ display: 'grid', margin: 0, fontSize: 20, lineHeight: '18px', textAlign: 'left', alignContent: 'center', width: 110 }}>
                    {currentUser ? (
                      userData?.user_access_level === 0 ? (
                        <Link to="/admin" style={{ color: 'white' }}>
                          Web
                          FinanceLab
                        </Link>
                      ) : (
                        <Link to="/dashboard" style={{ color: 'white' }}>
                          Web
                          FinanceLab
                        </Link>
                      )
                    ) : (
                      <span style={{ color: 'white' }}>
                        Web
                        FinanceLab
                      </span>
                    )}
                  </Title>
                </div> :
                <span style={{ display: 'flex', alignItems: 'center' }}>{getPageTitle()}</span>
              }
            </span>

            <AccountTypeBadge type={userData?.user_access_level === 0 ? 'admin'
            : userData?.user_access_level === 2 ? 'premium'
            : userData?.user_access_level === 3 ? 'gold'
            : 'free'} />
          </div> }

          {children}

          {actionsVisible && (
            <Space>
              <div
                className="actions-overlay visible"
                onClick={() => setActionsVisible(false)}
              />
            </Space>
          )}
        </Content>

        <Modal open={isModalVisible} onCancel={handleCancel} footer={null}>
          <AddExpense onExpenseAdded={handleExpenseAdded} />
        </Modal>

        {!currentUser && (
          <div className="mobile-nav">
            {location.pathname === '/signup' ? (
              <Button type="link" icon={<UserOutlined />}><Link to="/login"></Link>{t("userProfile.navbar.login")}</Button>
            ) : (
              <Button type="link" icon={<UserOutlined />}><Link to="/signup"></Link>{t("userProfile.navbar.signup")}</Button>
            )}
          </div>
        )}

        <div
          className={`actions-overlay ${actionsVisible ? 'visible' : ''}`}
          onClick={() => setActionsVisible(false)}
        />

        {currentUser && isMobile && (
          <div className={`fab-container ${actionsVisible ? 'open' : ''}`}>
            <div className="fab-main" onClick={toggleActions}>
              <PlusOutlined />
            </div>
            <Button
              className="fab-action expense"
              type="primary"
              icon={<RiseOutlined style={{ fontSize: 18 }}/>}
              onClick={() => {
                setActionsVisible(false);
                openIncome();
              }}
              style={{ width: 100 }}
            > Ingreso</Button>
            <Button
              className="fab-action income"
              type="primary"
              shape="circle"
              icon={<FallOutlined />}
              onClick={() => {
                setActionsVisible(false);
                openExpense()
              }}
            > Gasto</Button>
          </div>
        )}

        <Modal className="add-expense-modal"
          open={incomeModalVisible}
          onCancel={() => setIncomeModalVisible(false)}
          footer={null}
        >
          <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
            {t('userProfile.addNewIncome.title')}
          </Title>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
            {t('userProfile.addNewIncome.subtitle')}
          </Paragraph>

          <Form
            form={incomeForm}
            layout="vertical"
            onFinish={handleIncomeSubmit}
            initialValues={{ date: dayjs(), currency: 'USD' }}
          >
            <Form.Item
              name="date"
              label={t('userProfile.addNewIncome.date') || "Fecha"}
              rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages') || "Seleccione una fecha" }]}
            >
              <DatePicker style={{ width: '100%' }}
                format={(val) =>
                  dayjs().isSame(val, 'day')
                    ? t('userProfile.addNewExpense.defaultDataInputDate')
                    : val.format('DD/MM/YYYY')
                } />
            </Form.Item>

            <Form.Item
              name="title"
              label={t('userProfile.addNewIncome.description') || "Título"}
              rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages.descriptionRequired') }]}
            >
              <Input prefix={<FileTextOutlined />} placeholder={'Salary'} />
            </Form.Item>
            
            <Row gutter={[16, 16]}>
              <Col xs={12} style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Item
                  name="amount"
                  label={t('userProfile.addNewIncome.amount') || "Monto"}
                  rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages.amountRequired') }]}
                >
                  <Input
                    type="number"
                    prefix={<DollarOutlined />}
                    placeholder={'125.50'}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="currency" label={t('userProfile.addNewIncome.currency') || "Moneda"} rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages.currencyRequired') }]}>
                  <CurrencyTagPicker />
                </Form.Item>
              </Col>
            </Row>

            <Button type="primary" htmlType="submit" size="large" block style={{ marginTop: 10 }}>
              {t('userProfile.addNewIncome.saveButton')}
            </Button>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />
            <Route path="/legal" element={<Legal />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="profile" element={<UserProfile />} />
                      <Route path="incomes" element={<Incomes />} />
                      <Route path="fixed-expenses" element={<FixedExpenses />} />
                      <Route path="daily-expenses" element={<DailyExpenses />} />
                      <Route path="general-expenses" element={<GeneralExpenses />} />
                      <Route path="summary" element={<Summary />} />
                      <Route path="financial-goals" element={<FinancialGoals />} />
                      <Route path="about-us" element={<AboutUs />} />
                      <Route path="debts" element={<Debts />} />
                      <Route
                        path="admin/*"
                        element={
                          <AdminRoute>
                            <Admin />
                          </AdminRoute>
                        }
                      />
                    </Routes>
                  </AppLayout>
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
