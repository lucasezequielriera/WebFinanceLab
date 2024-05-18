import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const PesoExpenseCounter = () => {
  const [total, setTotal] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const q = query(expensesRef, where('currency', '==', 'PESOS'));

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
        title="Total Expenses in PESOS"
        value={total}
        precision={2}
        valueStyle={{ color: '#cf1322' }}
        prefix={<DollarOutlined />}
        suffix="PESOS"
      />
    </Card>
  );
};

export default PesoExpenseCounter;
