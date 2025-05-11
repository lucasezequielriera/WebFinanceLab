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

const { Title, Paragraph } = Typography;
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

              {/* TITLE NAVBAR UP MOBILE */}
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

            {/* User Badge & Dropdown in Mobile*/}
            <AccountTypeBadge type={userData?.user_access_level === 0 ? 'admin'
            : userData?.user_access_level === 2 ? 'premium'
            : userData?.user_access_level === 3 ? 'gold'
            : 'free'} />
            
          </div> }
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard expenses={expenses} handleExpenseAdded={handleExpenseAdded} /></PrivateRoute>} />
            <Route path="/summary" element={<PrivateRoute><Summary /></PrivateRoute>} />
            <Route path="/fixed-expenses" element={<PrivateRoute><FixedExpenses /></PrivateRoute>} />
            <Route path="/incomes" element={<PrivateRoute><Incomes /></PrivateRoute>}/>
            <Route path="/debts" element={<PrivateRoute><Debts /></PrivateRoute>}/>
            <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />
            <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/financial-goals" element={<PrivateRoute><FinancialGoals /></PrivateRoute>} />
            <Route path="/about-us" element={<PrivateRoute><AboutUs /></PrivateRoute>} />
            <Route path="/daily-expenses" element={<PrivateRoute><DailyExpenses /></PrivateRoute>} />
            <Route path="/general-expenses" element={<PrivateRoute><GeneralExpenses /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>}>
              <Route path="tasks" element={<Tasks />} />
              <Route path="users" element={<Users />} />
              <Route path="configuration" element={<Configuration />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>

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
          {/* NAVBAR DOWN MOBILE NO LOGUED */}
          {location.pathname === '/signup' ? (
            <Button type="link" icon={<UserOutlined />}><Link to="/login"></Link>{t("userProfile.navbar.login")}</Button>
          ) : (
            <Button type="link" icon={<UserOutlined />}><Link to="/signup"></Link>{t("userProfile.navbar.signup")}</Button>
          )}
        </div>
        )}


        {/* MENU ADD INCOME AND EXPENSE BUTTON */}

        {/* SHADOW SCREEN */}
        <div
          className={`actions-overlay ${actionsVisible ? 'visible' : ''}`}
          onClick={() => setActionsVisible(false)}
        />
        {/* ADD INCOME & EXPENSE BUTTON */}
        {currentUser && isMobile && (<div className={`fab-container ${actionsVisible ? 'open' : ''}`}>
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
        </div>)}

        {/* ——— Modal para Agregar Ingreso ——— */}
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
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
