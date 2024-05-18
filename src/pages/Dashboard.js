import React, { useState, useEffect } from 'react';
import { Spin, Row, Col } from 'antd';
import AddExpense from '../components/AddExpense';
import MonthlyChart from '../components/MonthlyChart';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);

    const qExpenses = query(expensesRef);
    const qIncomes = query(incomesRef);

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesData);
    });

    const unsubscribeIncomes = onSnapshot(qIncomes, (snapshot) => {
      const incomesData = [];
      snapshot.forEach((doc) => {
        incomesData.push({ id: doc.id, ...doc.data() });
      });
      setIncomes(incomesData);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
    };
  }, [currentUser]);

  if (loading) {
    return <Spin tip="Loading..." size="large" />;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <Row className="margin-top-large margin-bottom-large" gutter={16}>
        <Col span={12}>
          <PesoExpenseCounter expenses={expenses} />
        </Col>
        <Col span={12}>
          <DollarExpenseCounter expenses={expenses} />
        </Col>
      </Row>
      <Row className="margin-bottom-large" gutter={16}>
        <Col span={24}>
          <AddExpense />
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
