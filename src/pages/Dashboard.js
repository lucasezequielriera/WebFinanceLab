import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import MonthlyChart from '../components/MonthlyChart';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

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
    <div>
      <h1>Hi, {currentUser?.displayName || 'User'}!</h1>
      <Row className="margin-bottom-large" gutter={16}>
        <Col span={12}>
          <PesoExpenseCounter />
        </Col>
        <Col span={12}>
          <DollarExpenseCounter />
        </Col>
      </Row>
      <Row className="margin-bottom-large" gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Remaining Pesos"
              value={0}  // Este valor se actualizará con la lógica adecuada
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="ARS"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Remaining Dollars"
              value={0}  // Este valor se actualizará con la lógica adecuada
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <MonthlyChart incomes={incomes} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
