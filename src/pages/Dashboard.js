import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card, Progress, Flex } from 'antd';
import MonthlyChart from '../components/MonthlyChart';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import RemainingPesosCounter from '../components/RemainingPesosCounter';
import RemainingDollarsCounter from '../components/RemainingDollarsCounter';
import '../styles/Dashboard.css'; // Importa el archivo CSS para los estilos

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [progressData, setProgressData] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (!currentUser) return;

    const incomesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qIncomes = query(incomesRef);

    const unsubscribeIncomes = onSnapshot(qIncomes, (snapshot) => {
      const incomesData = [];
      snapshot.forEach((doc) => {
        incomesData.push({ id: doc.id, ...doc.data() });
      });
      setIncomes(incomesData);
      setLoading(false);
    });

    return () => {
      unsubscribeIncomes();
    };
  }, [currentUser]);

  useEffect(() => {
    setTimeout(() => {
      const randomProgressData = [
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100)
      ];
      setProgressData(randomProgressData);
      setLoadingCards(false);
    }, 3000);
  }, []);

  if (loading) {
    return (
      <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
      </Spin>
    );
  }

  console.log(incomes)

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Hi, {currentUser?.displayName || 'User'}!</h1>
      <Row className="expenses-counters margin-bottom-large" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <RemainingPesosCounter />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <RemainingDollarsCounter />
          </Card>
        </Col>
      </Row>
      <Row className="remainings-counters margin-bottom-large" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <PesoExpenseCounter />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <DollarExpenseCounter />
          </Card>
        </Col>
      </Row>
      <Row className="loading-cards margin-bottom-large" gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="equal-height-card" loading={loadingCards}>
            <h2>Ingresos en Pesos</h2>
            <Flex gap="small" vertical>
              <Progress percent={progressData[0]} status="active" />
              <span>$500.000 / $1.200.000</span>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="equal-height-card" loading={loadingCards}>
            <h2>Ingresos en Dólares</h2>
            <Flex gap="small" vertical>
              <Progress percent={progressData[1]} status="active" />
              <span>$500 / $800</span>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="equal-height-card" loading={loadingCards}>
            <h2>Total Gastos en Pesos</h2>
            <Flex gap="small" vertical>
              <Progress percent={progressData[2]} status="active" />
              <span>$245.000 / $1.200.000</span>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="equal-height-card" loading={loadingCards}>
            <h2>Total Gastos en Dólares</h2>
            <Flex gap="small" vertical>
              <Progress percent={progressData[3]} status="active" />
              <span>$200 / $800</span>
            </Flex>
          </Card>
        </Col>
      </Row>
      <Row className="dashboard-chart" gutter={[0, 0]}>
        <Col span={24}>
          <MonthlyChart incomes={incomes} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
