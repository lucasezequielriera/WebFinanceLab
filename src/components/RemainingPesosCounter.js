import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, Timestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Progress } from 'antd';
import { useTranslation } from 'react-i18next';

const RemainingPesosCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0); // Nuevo estado para el ingreso total
  const progressPercent = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(0) : 0;
  const twoColors = {
    '0%': 'rgb(0, 143, 226)',
    '50%': 'rgb(0, 201, 167)',
    '100%': 'rgb(0, 191, 145)',
  };

  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoading(true);

      // Calcular fechas de inicio y fin del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const startTimestamp = Timestamp.fromDate(startOfMonth);
      const endTimestamp = Timestamp.fromDate(endOfMonth);

      // Obtener ingresos en pesos desde el array incomes dentro del documento del usuario
      const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
      const qIncomes = query(
        incomesRef,
        where('currency', '==', 'ARS'),
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<',  endTimestamp)
      );

      let income = 0;
      const snapIncomes = await getDocs(qIncomes);
      snapIncomes.forEach(d => {
        income += Number(d.data().amount);
      });
      setTotalIncome(income);

      // Obtener expenses en pesos del mes actual
      const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
      const qExpenses = query(expensesRef, where('currency', '==', 'ARS'), where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

      let totalExpenses = 0;
      const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
        totalExpenses = 0;
        snapshot.forEach((doc) => {
          totalExpenses += Number(doc.data().amount);
        });

        const newRemaining = income - totalExpenses;
        setRemaining(newRemaining);

        setLoading(false);
      });

      return () => {
        unsubscribeExpenses();
      };
    };

    fetchData();
  }, [currentUser]);

  return (
    <Card loading={loading}>
      <div>
          <Statistic
            className='statics-card'
            title={t('userProfile.dasboard.card.balance.ars')}
            value={remaining}
            precision={2}
            prefix={'$'}
          />
          <Progress showInfo={false} percent={progressPercent} strokeColor={twoColors} status='active' />
      </div>
    </Card>
  );
};

export default RemainingPesosCounter;
