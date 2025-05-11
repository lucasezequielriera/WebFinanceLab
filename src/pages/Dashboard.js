import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card }       from 'antd';
import { SmileOutlined }              from '@ant-design/icons';
import { useAuth }                    from '../contexts/AuthContext';
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
import DailyExpensesChart             from '../components/DailyExpensesChart';
import MonthlySummaryTable            from '../components/MonthlySummaryTable';
import RecentMovements                from '../components/RecentMovements';
// Styles //
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading]               = useState(true);
  const [hasPesosIncome, setHasPesosIncome] = useState(false);
  const [hasUsdIncome, setHasUsdIncome]     = useState(false);
  const [hasPesosExpenses, setHasPesosExpenses] = useState(false);
  const [hasDollarsExpenses, setHasDollarsExpenses] = useState(false);

  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { hasIncomes, hasExpenses } = useMonthlyMovements();

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

  return (
    <div className='container-page'>
      <Spin spinning={loading}>
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
                </Row>
              )}
              {/* GRAPH + MONTHLY SUMMARY + RECENT MOVEMENTS */}
              <Row className="dashboard-chart" gutter={[16, 16]} style={{ marginTop: 0, marginBottom: 30 }}>
                <Col xs={24} sm={24} md={24} lg={16}>
                  <Card>
                    <DailyExpensesChart userId={currentUser?.uid} />
                  </Card>
                  {/* <Card style={{ marginTop: 16 }}>
                    <MonthlySummaryTable />
                  </Card> */}
                </Col>
                <Col xs={24} sm={24} md={24} lg={8}>
                  <Card
                    className="equal-height-card"
                    style={{ marginLeft: 0, justifyContent: 'flex-start' }}
                    id="recent-movements-card"
                  >
                    <RecentMovements />
                  </Card>
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
