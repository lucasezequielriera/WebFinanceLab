import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card } from 'antd';
import MonthlyChart from '../components/MonthlyChart';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import RemainingPesosCounter from '../components/RemainingPesosCounter';
import RemainingDollarsCounter from '../components/RemainingDollarsCounter';
import '../styles/Dashboard.css'; // Importa el archivo CSS para los estilos

const Dashboard = ({ expenses, handleExpenseAdded }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
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

  if (loading) {
    return (
      <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
      </Spin>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Hi, {currentUser?.displayName || 'User'}!</h1>
      <Row className="margin-bottom-large" gutter={[16, 16]}>
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
      <Row className="margin-bottom-large" gutter={[16, 16]}>
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
      <Row className="dashboard-chart" gutter={[0, 0]}>
        <Col span={24}>
          <MonthlyChart incomes={incomes} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
