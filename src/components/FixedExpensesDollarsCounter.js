import React, { useState, useEffect } from 'react';
import { Statistic, Card } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const FixedExpensesDollarsCounter = () => {
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;
    const currentMonthKey = dayjs().format('YYYY-MM');
    const prevMonthKey = dayjs().subtract(1, 'month').format('YYYY-MM');
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
    const prevRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, prevMonthKey);

    // Mes actual
    const unsub = onSnapshot(ref, snap => {
      const payments = snap.exists() ? snap.data().payments || [] : [];
      const totalUSD = payments.reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0);
      setTotal(totalUSD);
      setLoading(false);
    });

    // Mes anterior (solo una vez)
    (async () => {
      const prevSnap = await getDoc(prevRef);
      const prevPayments = prevSnap.exists() ? prevSnap.data().payments || [] : [];
      const prevTotalUSD = prevPayments.reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0);
      setPrevTotal(prevTotalUSD);
    })();

    return () => unsub();
  }, [currentUser]);

  // Cálculo del porcentaje de variación
  const pct = prevTotal > 0
    ? Math.round(((total - prevTotal) / prevTotal) * 100)
    : total > 0
      ? 100
      : 0;
  const isIncrease = total >= prevTotal;

  return (
    <Card loading={loading}>
      <Statistic
        className='statics-card'
        title={'Gastos fijos (USD)'}
        value={total}
        precision={2}
        prefix={'$'}
      />
      <p style={{ margin: 0, marginTop: 5, display: 'flex', alignItems: 'center' }}>
        {isIncrease
          ? <RiseOutlined style={{ fontSize: 18, marginRight: 5, color: isIncrease ? 'rgb(207,0,0)' : 'rgb(0,163,137)' }} />
          : <FallOutlined style={{ fontSize: 18, marginRight: 5, color: isIncrease ? 'rgb(207,0,0)' : 'rgb(0,163,137)' }} />
        }
        <span style={{
          color: isIncrease ? 'rgb(207,0,0)' : 'rgb(0,163,137)',
          fontWeight: 800,
          marginRight: 5
        }}>
          {isIncrease ? "+" : "-"}{Math.abs(pct)}%
        </span>
        {t('userProfile.dashboard.card.vsLastMonth')}
      </p>
    </Card>
  );
};

export default FixedExpensesDollarsCounter; 