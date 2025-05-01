import React, { useState, useEffect }           from 'react';
import { Spin, Row, Col, Card }                 from 'antd';
import { SmileOutlined }                        from '@ant-design/icons';
import PesoIncomeCounter                        from '../components/PesoIncomeCounter';
import DollarIncomeCounter                      from '../components/DollarIncomeCounter';
import DollarExpenseCounter                     from '../components/DollarExpenseCounter';
import PesoExpenseCounter                       from '../components/PesoExpenseCounter';
import { useAuth }                              from '../contexts/AuthContext';
import { db }                                   from '../firebase';
import { collection, onSnapshot, doc, getDoc }  from 'firebase/firestore';
import BalancePesosCounter                      from '../components/BalancePesosCounter';
import BalanceDollarsCounter                    from '../components/BalanceDollarsCounter';
import DailyExpensesChart                       from '../components/DailyExpensesChart';
import { useTranslation }                       from 'react-i18next';
import useMonthlyMovements                      from '../hooks/useMonthlyMovements';
// Styles //
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState();
  const [hasPesosIncome, setHasPesosIncome] = useState(false);
  const [hasUsdIncome, setHasUsdIncome]     = useState(false);

  const { t } = useTranslation();
  const { hasIncomes, hasExpenses } = useMonthlyMovements();

  useEffect(() => {
    let isMounted = true;
  
    const fetchUserData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log(userData)
  
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
    if (!currentUser) return;
  
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);

    const unsub = onSnapshot(incomesRef, snap => {
      const currencies = snap.docs.map(d => d.data().currency);
      setHasPesosIncome(currencies.includes('ARS'));
      setHasUsdIncome(currencies.includes('USD'));
    });
  
    return () => {
      setLoading(false);
      unsub();
    }

  }, [currentUser]);

  return (
    <div className='container-page'>
      <Spin spinning={loading}>
        <div className="dashboard-container margin-top-small">
          {(hasIncomes || hasExpenses) ? (

            // WITH INCOMES || EXPENSES
            <div>

              {/* PESOS CARDS */}
              {hasPesosIncome && (
                <Row className="expenses-counters margin-bottom-medium" gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={8}>
                    <Card className="equal-height-card balance-counter">
                      <BalancePesosCounter />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <Card className="equal-height-card">
                      <PesoIncomeCounter />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <Card className="equal-height-card">
                      <PesoExpenseCounter />
                    </Card>
                  </Col>
                </Row>
              )}
              
              {/* DOLLAR CARDS */}
              {hasUsdIncome && (
                <Row className="remainings-counters margin-bottom-medium" gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={8}>
                    <Card className="equal-height-card balance-counter">
                      <BalanceDollarsCounter />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <Card className="equal-height-card">
                      <DollarIncomeCounter />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <Card className="equal-height-card">
                      <DollarExpenseCounter />
                    </Card>
                  </Col>
                </Row>
              )}

              {/* GRAPH */}
              <Row className="dashboard-chart" gutter={[12, 12]} style={{ marginTop: 0, marginBottom: 30, marginRight: 0, marginLeft: 0 }}>
                <Col span={24} style={{ padding: 0 }}>
                  <Card>
                    <DailyExpensesChart userId={currentUser?.uid} />
                  </Card>
                </Col>
              </Row>

            </div>) :

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
