import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, Timestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Progress } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const RemainingPesosCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0); // Nuevo estado para el ingreso total
  const progressPercent = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(0) : 0;
  const conicColors = {
    '0%': '#87d068',
    '50%': '#ffe58f',
    '100%': '#ffccc7',
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

  // Show numbers with US format
  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  return (
    <Card loading={loading}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexFlow: 'column' }}>
          <Statistic
            title={t('userProfile.remaining.ars')}
            value={remaining}
            precision={2}
            valueStyle={{ color: remaining < 50000 ? '#cf1322' : '#3f8600' }}
            prefix={<DollarOutlined />}
            suffix={<span style={{ fontSize: 12 }}>ARS</span>}
          />
          <span style={{ fontWeight: 600, fontSize: 13 }}>/ ${formatNumber(totalIncome)}</span>
        </div>
        <Progress type="circle" percent={progressPercent} strokeColor={conicColors} size="small" style={{ marginLeft: 30 }} />
      </div>
    </Card>
  );
};

export default RemainingPesosCounter;
