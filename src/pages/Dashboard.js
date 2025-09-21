import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card }       from 'antd';
import { SmileOutlined }              from '@ant-design/icons';
import { useAuth }                    from '../contexts/AuthContext';
import { useDashboardConfig }         from '../contexts/DashboardConfigContext';
import { db }                         from '../firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { useTranslation }             from 'react-i18next';
import useMonthlyMovements            from '../hooks/useMonthlyMovements';
// Components
import PesoIncomeCounter              from '../components/PesoIncomeCounter';
import DollarIncomeCounter            from '../components/DollarIncomeCounter';
import DollarExpenseCounter           from '../components/DollarExpenseCounter';
import PesoExpenseCounter             from '../components/PesoExpenseCounter';
import BalancePesosCounter            from '../components/BalancePesosCounter';
import BalanceDollarsCounter          from '../components/BalanceDollarsCounter';
import FixedExpensesPesosCounter      from '../components/FixedExpensesPesosCounter';
import FixedExpensesDollarsCounter    from '../components/FixedExpensesDollarsCounter';
import UnifiedExpensesDollarsCounter  from '../components/UnifiedExpensesDollarsCounter';
import SimpleUnifiedExpensesDollarsCounter from '../components/SimpleUnifiedExpensesDollarsCounter';
import UnifiedExpensesPesosCounter from '../components/UnifiedExpensesPesosCounter';
import SimpleUnifiedExpensesPesosCounter from '../components/SimpleUnifiedExpensesPesosCounter';
import DailyExpensesChart             from '../components/DailyExpensesChart';
import MonthlySummaryTable            from '../components/MonthlySummaryTable';
import RecentMovements                from '../components/RecentMovements';
import MiniMonthlyTimeline           from '../components/MiniMonthlyTimeline';
// Styles //
import '../styles/Dashboard.css';
import '../components/MiniMonthlyTimeline.css';

const Dashboard = () => {
  const [loading, setLoading]               = useState(true);
  const [hasPesosIncome, setHasPesosIncome] = useState(false);
  const [hasUsdIncome, setHasUsdIncome]     = useState(false);
  const [hasPesosExpenses, setHasPesosExpenses] = useState(false);
  const [hasDollarsExpenses, setHasDollarsExpenses] = useState(false);
  const [expensesByMonth, setExpensesByMonth] = useState({});

  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { hasIncomes, hasExpenses } = useMonthlyMovements();
  const { expenseViewMode, loading: configLoading } = useDashboardConfig();

  useEffect(() => {
    if (!currentUser) return;
  
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);
  
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);

    const unsubIncomes = onSnapshot(
      query(
        incomesRef,
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<', endTimestamp)
      ),
      snap => {
      const currencies = snap.docs.map(d => d.data().currency);
      setHasPesosIncome(currencies.includes('ARS'));
      setHasUsdIncome(currencies.includes('USD'));
      setLoading(false);
      }
    );

    const unsubExpenses = onSnapshot(
      query(
        expensesRef,
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<', endTimestamp)
      ),
      snap => {
        const currencies = snap.docs.map(d => d.data().currency);
        setHasPesosExpenses(currencies.includes('ARS'));
        setHasDollarsExpenses(currencies.includes('USD'));
      }
    );
  
    return () => {
      unsubIncomes();
      unsubExpenses();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const q = query(
      expensesRef,
      where('timestamp', '>=', startOfYear),
      where('timestamp', '<', endOfYear)
    );

    const unsub = onSnapshot(q, snap => {
      const byMonth = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!d.timestamp) return;
        const date = d.timestamp.seconds ? new Date(d.timestamp.seconds * 1000) : new Date(d.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[monthKey]) byMonth[monthKey] = { ARS: 0, USD: 0 };
        if (d.currency === 'ARS') byMonth[monthKey].ARS += Number(d.amount) || 0;
        if (d.currency === 'USD') byMonth[monthKey].USD += Number(d.amount) || 0;
      });
      setExpensesByMonth(byMonth);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <div className='container-page'>
      <Spin spinning={loading || configLoading}>
        <div className="dashboard-container margin-top-small">
          {(hasIncomes || hasExpenses) ? (

            // WITH INCOMES || EXPENSES
            <div>
              {console.log(hasPesosIncome, hasPesosExpenses)}
              {console.log(hasIncomes, hasExpenses)}

              {/* PESOS CARDS */}
              {(hasPesosIncome || hasPesosExpenses) && (
                <Row className="expenses-counters margin-bottom-medium" gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={8}>
                    <Card className="equal-height-card balance-counter">
                      <BalancePesosCounter />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={6}>
                    <Card className="equal-height-card">
                      <PesoIncomeCounter />
                    </Card>
                  </Col>
                  
                  {/* Render expense cards based on configuration */}
                  {expenseViewMode === 'separated' && (
                    <>
                      <Col xs={24} sm={24} md={12} lg={5}>
                        <Card className="equal-height-card">
                          <FixedExpensesPesosCounter />
                        </Card>
                      </Col>
                      <Col xs={24} sm={24} md={12} lg={5}>
                        <Card className="equal-height-card">
                          <PesoExpenseCounter />
                        </Card>
                      </Col>
                    </>
                  )}
                  
                  {expenseViewMode === 'unified' && (
                    <Col xs={24} sm={24} md={12} lg={10}>
                      <Card className="equal-height-card">
                        <SimpleUnifiedExpensesPesosCounter />
                      </Card>
                    </Col>
                  )}
                  
                  {expenseViewMode === 'hybrid' && (
                    <Col xs={24} sm={24} md={12} lg={10}>
                      <Card className="equal-height-card">
                        <UnifiedExpensesPesosCounter />
                      </Card>
                    </Col>
                  )}
                </Row>
              )}
              
              {/* DOLLAR CARDS */}
              {(hasUsdIncome || hasDollarsExpenses) && (
                <Row className="remainings-counters margin-bottom-medium" gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={8}>
                    <Card className="equal-height-card balance-counter">
                      <BalanceDollarsCounter />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={6}>
                    <Card className="equal-height-card">
                      <DollarIncomeCounter />
                    </Card>
                  </Col>
                  
                  {/* Render expense cards based on configuration */}
                  {expenseViewMode === 'separated' && (
                    <>
                      <Col xs={24} sm={24} md={12} lg={5}>
                        <Card className="equal-height-card">
                          <FixedExpensesDollarsCounter />
                        </Card>
                      </Col>
                      <Col xs={24} sm={24} md={12} lg={5}>
                        <Card className="equal-height-card">
                          <DollarExpenseCounter />
                        </Card>
                      </Col>
                    </>
                  )}
                  
                  {expenseViewMode === 'unified' && (
                    <Col xs={24} sm={24} md={12} lg={10}>
                      <Card className="equal-height-card">
                        <SimpleUnifiedExpensesDollarsCounter />
                      </Card>
                    </Col>
                  )}
                  
                  {expenseViewMode === 'hybrid' && (
                    <Col xs={24} sm={24} md={12} lg={10}>
                      <Card className="equal-height-card">
                        <UnifiedExpensesDollarsCounter />
                      </Card>
                    </Col>
                  )}
                </Row>
              )}
              {/* GRAPH + MONTHLY SUMMARY + RECENT MOVEMENTS */}
              <Row className="dashboard-chart" gutter={[16, 16]} style={{ marginTop: 0, marginBottom: 30 }}>
                <Col xs={24} sm={24} md={24} lg={16}>
                  <DailyExpensesChart userId={currentUser?.uid} />
                  <div style={{ marginTop: 16 }}>
                    <MiniMonthlyTimeline
                      expensesByMonth={expensesByMonth}
                      onMonthClick={monthKey => console.log('Seleccionaste', monthKey)}
                      selectedMonth={null}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={24} md={24} lg={8}>
                  <RecentMovements />
                </Col>
              </Row>

            </div>)
          :

          // EMPTY DATA MESSAGE
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <SmileOutlined style={{ fontSize: 48, color: 'rgb(0, 126, 222)', marginBottom: 20 }} />
            <h2>{t("userProfile.dashboard.welcome")}</h2>
            <p>{t("userProfile.dashboard.welcomeText")}</p>
          </div>
          }

        </div>
      </Spin>
    </div>
  );
};

export default Dashboard;
