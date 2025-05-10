import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const DollarIncomeCounter = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalPayments, setTotalPayments] = useState(0);
  const [prevTotalPayments, setPrevTotalPayments] = useState(0);

  // Utility para calcular rango de mes
  const getRange = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end   = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return [Timestamp.fromDate(start), Timestamp.fromDate(end)];
  };

  useEffect(() => {
    if (!currentUser) return;
    const now = new Date();

    // Mes actual
    const [startCur, endCur] = getRange(now);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const qCurrent = query(
      collection(db, `users/${currentUser.uid}/incomes`),
      where('currency', '==', 'USD'),
      where('timestamp', '>=', startCur),
      where('timestamp', '<', endCur)
    );
    const unsubCur = onSnapshot(qCurrent, snap => {
      const sum = snap.docs.reduce((s, d) => s + parseFloat(d.data().amount), 0);
      setTotal(sum);
      console.log('[DollarIncomeCounter] Ingresos USD mes actual:', sum);
    });

    // Mes anterior
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [startPrev, endPrev] = getRange(prevDate);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const qPrev = query(
      collection(db, `users/${currentUser.uid}/incomes`),
      where('currency', '==', 'USD'),
      where('timestamp', '>=', startPrev),
      where('timestamp', '<', endPrev)
    );
    const unsubPrev = onSnapshot(qPrev, snap => {
      const sum = snap.docs.reduce((s, d) => s + parseFloat(d.data().amount), 0);
      setPrevTotal(sum);
      console.log('[DollarIncomeCounter] Ingresos USD mes anterior:', sum);
    });

    // Pagos mensuales en USD del mes actual
    const paymentsRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
    const unsubPayments = onSnapshot(paymentsRef, snap => {
      const payments = snap.exists() ? snap.data().payments || [] : [];
      const sum = payments.reduce((acc, p) => acc + (Number(p.amountUSD) || 0), 0);
      setTotalPayments(sum);
      console.log('[DollarIncomeCounter] Pagos mensuales USD mes actual:', sum);
    });

    // Pagos mensuales en USD del mes anterior
    const prevPaymentsRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, prevMonthKey);
    const unsubPrevPayments = onSnapshot(prevPaymentsRef, snap => {
      const payments = snap.exists() ? snap.data().payments || [] : [];
      const sum = payments.reduce((acc, p) => acc + (Number(p.amountUSD) || 0), 0);
      setPrevTotalPayments(sum);
      console.log('[DollarIncomeCounter] Pagos mensuales USD mes anterior:', sum);
    });

    // Cuando se suscriben ambos, quitamos loading
    Promise.all([unsubCur, unsubPrev]).then(() => setLoading(false));

    return () => {
      unsubCur();
      unsubPrev();
      unsubPayments();
      unsubPrevPayments();
    };
  }, [currentUser]);

  // Log resultado mostrado en card cuando ambos valores están actualizados
  useEffect(() => {
    const currentNetIncome = total - totalPayments;
    console.log('[DollarIncomeCounter] Resultado mostrado en card:', currentNetIncome);
  }, [total, totalPayments]);

  // Cálculo de variación
  const currentNetIncome = total - totalPayments;
  const prevNetIncome = prevTotal - prevTotalPayments;
  const pct = prevNetIncome > 0
    ? Math.round(((currentNetIncome - prevNetIncome) / prevNetIncome) * 100)
    : currentNetIncome > 0
      ? 100
      : 0;
  const isIncrease = currentNetIncome >= prevNetIncome;

  return (
    <Card loading={loading}>
      <Statistic
        className='statics-card'
        title={t('userProfile.dashboard.card.incomes.usd')}
        value={currentNetIncome}
        precision={2}
        prefix={'$'}
      />
      <p style={{ margin: 0, marginTop: 5, display: 'flex', alignItems: 'center' }}>
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

export default DollarIncomeCounter;