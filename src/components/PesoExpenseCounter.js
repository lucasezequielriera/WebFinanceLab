import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const PesoExpenseCounter = () => {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    const qExpenses = query(expensesRef, where('currency', '==', 'ARS'), where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const totalExpenses = snapshot.docs.reduce((sum, doc) => sum + parseFloat(doc.data().amount), 0);
      setTotal(totalExpenses);
      setLoading(false);
    });

    return () => unsubscribeExpenses();
  }, [currentUser]);

  return (
    <Card loading={loading}>
      <Statistic
        title="Total Expenses in ARS"
        value={total}
        precision={2}
        valueStyle={{ color: '#cf1322' }}
        prefix={<DollarOutlined />}
        suffix="ARS"
      />
    </Card>
  );
};

export default PesoExpenseCounter;