import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const PesoIncomeCounter = () => {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalPayments, setTotalPayments] = useState(0);
  const [prevTotalPayments, setPrevTotalPayments] = useState(0);

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
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Mes anterior
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrev   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevTs = Timestamp.fromDate(startPrev);
    const endPrevTs   = Timestamp.fromDate(endPrev);
    const prevMonthKey = `${startPrev.getFullYear()}-${String(startPrev.getMonth() + 1).padStart(2, '0')}`;

    // 1) Consultar mes anterior (una sola vez)
    (async () => {
      // Ingresos mes anterior
      const qPrev = query(
        incomesRef,
        where('currency', '==', 'ARS'),
        where('timestamp', '>=', startPrevTs),
        where('timestamp', '<',  endPrevTs)
      );
      const snapPrev = await getDocs(qPrev);
      const sumPrev = snapPrev.docs.reduce((sum, d) => sum + parseFloat(d.data().amount), 0);
      setPrevTotal(sumPrev);
      console.log('[PesoIncomeCounter] Ingresos ARS mes anterior:', sumPrev);

      // Pagos mensuales mes anterior
      const prevPaymentsRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, prevMonthKey);
      const prevPaymentsSnap = await getDocs(prevPaymentsRef);
      const prevPayments = prevPaymentsSnap.exists() ? prevPaymentsSnap.data().payments || [] : [];
      const prevPaymentsSum = prevPayments.reduce((acc, p) => acc + (Number(p.amountARS) || 0), 0);
      setPrevTotalPayments(prevPaymentsSum);
      console.log('[PesoIncomeCounter] Pagos mensuales ARS mes anterior:', prevPaymentsSum);
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
      console.log('[PesoIncomeCounter] Ingresos ARS mes actual:', sumCurr);
    });

    // 3) Pagos mensuales en ARS del mes actual
    const paymentsRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
    const unsubPayments = onSnapshot(paymentsRef, snap => {
      const payments = snap.exists() ? snap.data().payments || [] : [];
      const sum = payments.reduce((acc, p) => acc + (Number(p.amountARS) || 0), 0);
      setTotalPayments(sum);
      console.log('[PesoIncomeCounter] Pagos mensuales ARS mes actual:', sum);
      console.log('[PesoIncomeCounter] Resultado mostrado en card:', total - sum);
    });

    return () => {
      unsubscribe();
      unsubPayments();
    };
  }, [currentUser]);

  // Cálculo del porcentaje de variación
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
        contentFontSize={5}
        title={t('userProfile.dashboard.card.incomes.ars')}
        value={currentNetIncome}
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