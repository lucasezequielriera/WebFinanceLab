import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const PesoIncomeCounter = () => {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const now = new Date();

    // Mes actual
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp   = Timestamp.fromDate(end);

    // Mes anterior
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrev   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevTs = Timestamp.fromDate(startPrev);
    const endPrevTs   = Timestamp.fromDate(endPrev);

    // 1) Consultar mes anterior (una sola vez)
    (async () => {
      const qPrev = query(
        incomesRef,
        where('currency', '==', 'ARS'),
        where('timestamp', '>=', startPrevTs),
        where('timestamp', '<',  endPrevTs)
      );
      const snapPrev = await getDocs(qPrev);
      const sumPrev = snapPrev.docs.reduce((sum, d) => sum + parseFloat(d.data().amount), 0);
      setPrevTotal(sumPrev);
    })();

    // 2) Subscribir mes actual
    const qCurr = query(
      incomesRef,
      where('currency', '==', 'ARS'),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<',  endTimestamp)
    );
    const unsubscribe = onSnapshot(qCurr, (snapshot) => {
      const sumCurr = snapshot.docs.reduce((sum, d) => sum + parseFloat(d.data().amount), 0);
      setTotal(sumCurr);
      setLoading(false);
    });

    return () => unsubscribe();
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
        contentFontSize={5}
        title={t('userProfile.dashboard.card.incomes.ars')}
        value={total}
        precision={2}
        prefix='$'
      />
      <p style={{ margin: 0, marginTop: 5 }}>
        {isIncrease
          ? <RiseOutlined style={{ fontSize: 18, marginRight: 5, color: 'rgb(0,163,137)' }} />
          : <FallOutlined style={{ fontSize: 18, marginRight: 5, color: 'rgb(207,0,0)' }} />
        }
        <span style={{
          color: isIncrease ? 'rgb(0,163,137)' : 'rgb(207,0,0)',
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

export default PesoIncomeCounter;