// RemainingPesosCounter.js
import React, { useState, useEffect } from 'react';
import { Card, Statistic, Spin } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const RemainingPesosCounter = () => {
  const { currentUser } = useAuth();
  const [remainingPesos, setRemainingPesos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);

    const qExpenses = query(expensesRef, where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp), where('currency', '==', 'ARS'));
    const qIncomes = query(incomesRef, where('currency', '==', 'ARS'));

    let totalExpenses = 0;
    let totalIncomes = 0;

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      totalExpenses = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setRemainingPesos(totalIncomes - totalExpenses);
      setLoading(false);
    });

    const unsubscribeIncomes = onSnapshot(qIncomes, (snapshot) => {
      totalIncomes = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setRemainingPesos(totalIncomes - totalExpenses);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
    };
  }, [currentUser]);

  if (loading) {
    return <Spin spinning={loading} />;
  }

  return (
    <Card>
      <Statistic
        title="Remaining Pesos"
        value={remainingPesos}
        precision={2}
        valueStyle={{ color: '#3f8600' }}
        prefix={<DollarOutlined />}
        suffix="ARS"
      />
    </Card>
  );
};

export default RemainingPesosCounter;
