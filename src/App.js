import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Form, Layout, Modal, Button, notification, Space, DatePicker, Input, Col, Row } from 'antd';
import { UserOutlined, DashboardOutlined, LogoutOutlined, LoginOutlined, CreditCardOutlined, FlagOutlined, InfoCircleOutlined, DollarOutlined, RiseOutlined, FallOutlined, FileTextOutlined, StockOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import CustomDatePicker from './components/CustomDatePicker';
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
import Configuration from './pages/Configuration';
import DashboardConfig from './pages/DashboardConfig';
import ProfileConfig from './pages/ProfileConfig';
import LanguageConfig from './pages/LanguageConfig';
import Summary from './pages/Summary';
import Debts from './pages/Debts';
import DailyExpenses from './pages/DailyExpenses';
import FixedExpenses from './pages/FixedExpenses';
import Landing from './pages/Landing';
import Legal from './pages/Legal';
import { LanguageProvider } from './contexts/LanguageContext';
import { DashboardConfigProvider } from './contexts/DashboardConfigContext';
import PublicRoute from './components/PublicRoute';
import { Dropdown } from 'antd';

const { Title, Paragraph } = Typography;
const { Header, Content } = Layout;


const AppLayout = ({ children }) => {
  const {currentUser, logout } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userData, setUserData] = useState();
  const [actionsVisible, setActionsVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);

  const [incomeForm] = Form.useForm();

  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navigate = useNavigate();

  const { t } = useTranslation();

  // Hooks for keyboard navigation
  const openExpense = useCallback(() => {
    setActionModalVisible(false);
    setIsModalVisible(true);
  }, []);

  const openIncome = useCallback(() => {
    setActionModalVisible(false);
    setIncomeModalVisible(true);
    incomeForm.setFieldsValue({ date: dayjs() });
  }, [incomeForm]);

  const openActionModal = useCallback(() => {
    setActionModalVisible(true);
    setSelectedActionIndex(0); // Reset selection when opening
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (!actionModalVisible) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedActionIndex(prev => (prev + 1) % 2);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedActionIndex(prev => (prev - 1 + 2) % 2);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedActionIndex === 0) {
          openIncome();
        } else {
          openExpense();
        }
        break;
      case 'Escape':
        event.preventDefault();
        setActionModalVisible(false);
        break;
      default:
        break;
    }
  }, [actionModalVisible, selectedActionIndex, openIncome, openExpense]);

  useEffect(() => {
    if (actionModalVisible && !isMobile) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [actionModalVisible, handleKeyDown, isMobile]);

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

    console.log('Current path:', path);
  
    fetchUserData();
  
    return () => {
      isMounted = false;
    };
  }, [currentUser, location]);

  // Si estamos en la landing page, no mostramos el layout de la app
  if (location.pathname === '/') {
    return <Landing />;
  }


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      console.error('Failed to logout');
    }
  };


  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleExpenseAdded = () => {
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
      key: '15',
      icon: <SettingOutlined />,
      label: <Link to="/configuration">Configuración</Link>
    },
    { type: 'divider' },
    {
      key: '4',
      icon: <LogoutOutlined />,
      label: <span style={{ color: '#69c0ff', fontWeight: 700 }}>{t('userProfile.navbar.logout')}</span>,
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
      {/* Sin Sider: navegación arriba */}

      <Layout className="site-layout">
        {!isMobile && (
          <Header className="site-layout-background" style={{ padding: 0 }}>
            <div className="app-header-content">
              <div className="app-header-left">
                <img src={logo} alt="#" style={{ width: 50, marginRight: 0 }}/>
                <Title level={3} style={{ display: 'grid', margin: 0, fontSize: 20, lineHeight: '18px', textAlign: 'left', alignContent: 'center', whiteSpace: 'nowrap' }}>
                  {currentUser ? (
                    userData?.user_access_level === 0 ? (
                      <Link to="/admin" style={{ color: 'white' }}>WebFinanceLab</Link>
                    ) : (
                      <Link to="/dashboard" style={{ color: 'white' }}>WebFinanceLab</Link>
                    )
                  ) : (
                    <span style={{ color: 'white' }}>WebFinanceLab</span>
                  )}
                </Title>
              </div>
              <div className="app-header-center">
                <span className="app-header-page-title">{getPageTitle()}</span>
              </div>
              <div className="app-header-right">
                {/* Action Button */}
                <Button
                  className="action-btn add-action-btn"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openActionModal}
                  size="middle"
                  shape="circle"
                />
                
                <Dropdown
                  placement="bottomRight"
                  trigger={["click"]}
                  menu={{ items: filteredMenuItems, className: 'app-nav-dropdown-menu' }}
                  overlayClassName="app-nav-dropdown"
                >
                  <div style={{ cursor: 'pointer' }}>
                    <AccountTypeBadge type={userData?.user_access_level === 0 ? 'admin'
                      : userData?.user_access_level === 2 ? 'premium'
                      : userData?.user_access_level === 3 ? 'gold'
                      : 'free'} />
                  </div>
                </Dropdown>
              </div>
            </div>
          </Header>
        )}

        <Content style={{ padding: 0, background: isAuthPage ? 'linear-gradient(135deg, #001123, #4094e9)' : 'transparent', paddingBottom: 50 }}>
          { !isAuthPage && isMobile && (
          <div className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 80, background: 'linear-gradient(90deg, rgb(0 68 121), rgb(0 163 137), rgb(0, 191, 145))', padding: '0px 20px' }}>
            <span style={{ fontSize: '20px', fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center' }}>
              { isMobile ?
                <div className="user-greeting" style={{ display: 'flex', color: 'white', textAlign: 'center', marginLeft: "-10px" }}>
                  <img src={logo} alt="#" style={{ width: 60 }}/>
                </div> :
                <span style={{ display: 'flex', alignItems: 'center' }}>{getPageTitle()}</span>
              }
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AccountTypeBadge type={userData?.user_access_level === 0 ? 'admin'
              : userData?.user_access_level === 2 ? 'premium'
              : userData?.user_access_level === 3 ? 'gold'
              : 'free'} />
            </div>
          </div> )}

          {children}

          {/* Mobile Floating Action Button */}
          {currentUser && isMobile && (
            <div className="mobile-fab-container">
              <Button
                className="mobile-fab-button"
                type="primary"
                icon={<PlusOutlined />}
                onClick={openActionModal}
                shape="circle"
              />
            </div>
          )}

          {actionsVisible && (
            <Space>
              <div
                className="actions-overlay visible"
                onClick={() => setActionsVisible(false)}
              />
            </Space>
          )}
        </Content>

        <Modal 
          className="add-expense-modal"
          open={isModalVisible} 
          onCancel={handleCancel} 
          footer={null}
          centered
          width={480}
        >
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


        <Modal 
          className="add-income-modal"
          open={incomeModalVisible}
          onCancel={() => setIncomeModalVisible(false)}
          footer={null}
          centered
          width={480}
        >
          <div className="income-modal-content">
            <div className="modal-header">
              <div className="modal-icon-container income-icon">
                <RiseOutlined />
              </div>
              <div className="modal-title-section">
                <Title level={3} className="modal-title">
                  {t('userProfile.addNewIncome.title')}
                </Title>
                <Paragraph className="modal-subtitle">
                  {t('userProfile.addNewIncome.subtitle')}
                </Paragraph>
              </div>
            </div>

            <Form
              form={incomeForm}
              layout="vertical"
              onFinish={handleIncomeSubmit}
              initialValues={{ date: dayjs(), currency: 'USD' }}
              className="income-form"
            >
              <Form.Item
                name="date"
                label={t('userProfile.addNewIncome.date') || "Fecha"}
                rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages') || "Seleccione una fecha" }]}
                className="form-item-modern"
              >
                <CustomDatePicker
                  value={incomeForm.getFieldValue('date')}
                  onChange={(date) => incomeForm.setFieldsValue({ date })}
                  placeholder={t('userProfile.addNewIncome.date') || "Seleccionar fecha"}
                />
              </Form.Item>

              <Form.Item
                name="title"
                label={t('userProfile.addNewIncome.description') || "Título"}
                rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages.descriptionRequired') }]}
                className="form-item-modern"
              >
                <Input 
                  className="modern-input"
                  prefix={<FileTextOutlined className="input-icon" />} 
                />
              </Form.Item>
              
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Form.Item
                    name="amount"
                    label={t('userProfile.addNewIncome.amount') || "Monto"}
                    rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages.amountRequired') }]}
                    className="form-item-modern"
                  >
                    <Input
                      className="modern-input"
                      type="number"
                      prefix={<DollarOutlined className="input-icon" />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={12}>
                  <Form.Item 
                    name="currency" 
                    label={t('userProfile.addNewIncome.currency') || "Moneda"} 
                    rules={[{ required: true, message: t('userProfile.addNewIncome.errorMessages.currencyRequired') }]}
                    className="form-item-modern"
                  >
                    <CurrencyTagPicker />
                  </Form.Item>
                </Col>
              </Row>

              <Button 
                className="modern-submit-btn income-submit"
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
              >
                <RiseOutlined />
                {t('userProfile.addNewIncome.saveButton')}
              </Button>
            </Form>
          </div>
        </Modal>

        {/* Action Selection Modal */}
        <Modal
          open={actionModalVisible}
          onCancel={() => setActionModalVisible(false)}
          footer={null}
          className="action-selection-modal"
          centered
        >
          <div className="action-modal-content">
            <Title level={3} style={{ textAlign: 'center', marginBottom: 24, color: 'white' }}>
              {t('userProfile.navbar.addAction.title') || 'Agregar Nuevo'}
            </Title>
            <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 16, color: 'rgba(255,255,255,0.7)' }}>
              {t('userProfile.navbar.addAction.subtitle') || 'Selecciona qué quieres agregar'}
            </Paragraph>
            {!isMobile && (
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 32, 
                padding: '8px 16px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)'
              }}>
                💡 Usa ↑↓ para navegar • Enter para seleccionar • Esc para cerrar
              </div>
            )}
            
            <div className="action-options">
              <Button
                className={`action-option-btn income-option ${selectedActionIndex === 0 ? 'selected' : ''}`}
                type="primary"
                icon={<RiseOutlined />}
                onClick={openIncome}
                size="large"
                block
              >
                <div className="action-option-content">
                  <div className="action-option-title">
                    {t('userProfile.navbar.addIncome')}
                  </div>
                  <div className="action-option-subtitle">
                    {t('userProfile.navbar.addAction.incomeDescription') || 'Registrar un ingreso'}
                  </div>
                </div>
              </Button>
              
              <Button
                className={`action-option-btn expense-option ${selectedActionIndex === 1 ? 'selected' : ''}`}
                type="primary"
                icon={<FallOutlined />}
                onClick={openExpense}
                size="large"
                block
              >
                <div className="action-option-content">
                  <div className="action-option-title">
                    {t('userProfile.navbar.addExpense')}
                  </div>
                  <div className="action-option-subtitle">
                    {t('userProfile.navbar.addAction.expenseDescription') || 'Registrar un gasto'}
                  </div>
                </div>
              </Button>
            </div>
          </div>
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
          <DashboardConfigProvider>
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
                      <Route path="configuration" element={<Configuration />} />
                      <Route path="configuration/dashboard" element={<DashboardConfig />} />
                      <Route path="configuration/profile" element={<ProfileConfig />} />
                      <Route path="configuration/language" element={<LanguageConfig />} />
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
          </DashboardConfigProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
