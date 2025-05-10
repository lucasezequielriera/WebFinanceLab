import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, Timestamp, getDocs, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Progress } from 'antd';
import { useTranslation } from 'react-i18next';

const BalancePesosCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
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
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Obtener ingresos en pesos
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
      console.log('[BalancePesosCounter] Ingresos ARS mes actual:', income);

      // Obtener pagos mensuales en ARS
      const paymentsRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
      let paymentsSum = 0;
      const unsubPayments = onSnapshot(paymentsRef, snap => {
        const payments = snap.exists() ? snap.data().payments || [] : [];
        paymentsSum = payments.reduce((acc, p) => acc + (Number(p.amountARS) || 0), 0);
        setTotalPayments(paymentsSum);
        // Obtener gastos diarios en ARS
        const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
        const qExpenses = query(
          expensesRef,
          where('currency', '==', 'ARS'),
          where('timestamp', '>=', startTimestamp),
          where('timestamp', '<', endTimestamp)
        );
        const unsubExpenses = onSnapshot(qExpenses, snap => {
          const expensesSum = snap.docs.reduce((acc, d) => acc + Number(d.data().amount), 0);
          setTotalExpenses(expensesSum);
          const result = income - paymentsSum - expensesSum;
          setRemaining(result);
          setLoading(false);
          console.log('[BalancePesosCounter] Pagos mensuales ARS mes actual:', paymentsSum);
          console.log('[BalancePesosCounter] Gastos diarios ARS mes actual:', expensesSum);
          console.log('[BalancePesosCounter] Resultado mostrado en card:', result);
        });
        // Limpiar expenses listener al desmontar
        return () => unsubExpenses();
      });
      // Limpiar payments listener al desmontar
      return () => unsubPayments();
    };
    fetchData();
  }, [currentUser]);

  return (
    (() => {
      console.log('[BalancePesosCounter] Render: ingresos ARS:', totalIncome, '- pagos mensuales ARS:', totalPayments, '- gastos diarios ARS:', totalExpenses, '=', remaining);
    })(),
    <Card loading={loading}>
      <div>
          <Statistic
            className='statics-card'
            title={t('userProfile.dashboard.card.balance.ars')}
            value={remaining}
            precision={2}
            prefix={'$'}
          />
          <Progress showInfo={false} percent={progressPercent} strokeColor={twoColors} status='active' />
      </div>
    </Card>
  );
};

export default BalancePesosCounter;
