import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const DollarExpenseCounter = () => {
  const [total, setTotal] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const q = query(expensesRef, where('currency', '==', 'USD'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sum = 0;
      snapshot.forEach((doc) => {
        sum += doc.data().amount;
      });
      setTotal(sum);
    });

    return () => unsubscribe();
  }, [currentUser]);

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
