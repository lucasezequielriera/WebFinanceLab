import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const DollarExpenseCounter = () => {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    const qExpenses = query(expensesRef, where('currency', '==', 'USD'), where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

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
        className='statics-card'
        title={t('userProfile.totalExpenses.usd')}
        value={total}
        precision={2}
        prefix={'$'}
        suffix={<span style={{ fontSize: 12 }}>U$D</span>}
      />
      <p style={{ margin: 0, marginTop: 5, fontWeight: 500 }}>
        <RiseOutlined style={{ fontSize: 18, marginRight: 5, color: 'rgb(0, 163, 137)' }}/>
        <FallOutlined style={{ fontSize: 18, marginRight: 5, color: 'rgb(207, 0, 0)' }}/>
        <span style={{ color: 'rgb(0, 163, 137)', fontWeight: 800, marginRight: 5 }}>12%</span>
        this month
      </p>
    </Card>
  );
};

export default DollarExpenseCounter;