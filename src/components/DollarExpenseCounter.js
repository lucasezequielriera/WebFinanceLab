import React, { useState, useEffect } from 'react';
import { Card, Statistic, Spin } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const DollarExpenseCounter = () => {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qExpenses = query(expensesRef, where('currency', '==', 'USD'));

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const totalExpenses = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setTotal(totalExpenses);
      setLoading(false);
    });

    return () => unsubscribeExpenses();
  }, [currentUser]);

  if (loading) {
    return <Spin spinning={loading} />;
  }

  return (
    <Card>
      <Statistic
        title="Total Expenses in USD"
        value={total}
        precision={2}
        valueStyle={{ color: '#3f8600' }}
        prefix={<DollarOutlined />}
        suffix="USD"
      />
    </Card>
  );
};

export default DollarExpenseCounter;
