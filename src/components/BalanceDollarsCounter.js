import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Progress } from 'antd';
import { useTranslation } from 'react-i18next';

const BalanceDollarsCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const remaining = totalIncome - totalExpenses;
  const progressPercent = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(0) : 0;
  const twoColors = {
    '0%': 'rgb(0, 143, 226)',
    '50%': 'rgb(0, 201, 167)',
    '100%': 'rgb(0, 191, 145)',
  };

    const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    // Calcular fechas de inicio y fin del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    // ── ingresos en USD del mes actual (colección incomes) ──
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const qIncomes = query(
      incomesRef,
      where('currency', '==', 'USD'),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<',  endTimestamp)
    );

    const unsubscribeIncomes = onSnapshot(qIncomes, (snap) => {
      let income = 0;
      snap.forEach((d) => {
        income += Number(d.data().amount);     // ← usa amount, no salary
      });
      setTotalIncome(income);
    });

    // Obtener expenses en dólares del mes actual
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qExpenses = query(expensesRef, where('currency', '==', 'USD'), where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      let expenses = 0;
      snapshot.forEach((doc) => expenses += Number(doc.data().amount));

      setTotalExpenses(expenses);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
    };
  }, [currentUser]);

  return (
    <Card loading={loading}>
      <div>
          <Statistic
            className='statics-card'
            title={t('userProfile.dashboard.card.balance.usd')}
            value={remaining}
            precision={2}
            prefix={'$'}
          />
          <Progress showInfo={false} percent={progressPercent} strokeColor={twoColors} status='active' />
      </div>
    </Card>
  );
};

export default BalanceDollarsCounter;
