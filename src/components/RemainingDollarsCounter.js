import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Progress } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const RemainingDollarsCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const remaining = totalIncome - totalExpenses;
  const progressPercent = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(0) : 0;
  const conicColors = {
    '0%': '#87d068',
    '50%': '#ffe58f',
    '100%': '#ffccc7',
  };

  useEffect(() => {
    if (!currentUser) return;

    // Obtener ingresos en dólares desde el array jobs dentro del documento del usuario
    const userDocRef = doc(db, "users", currentUser.uid);

    getDoc(userDocRef).then((docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        let income = 0;
        if (userData.jobs) {
          userData.jobs.forEach((job) => {
            if (job.currency === 'USD') {
              income += Number(job.salary);
            }
          });
        }
        console.log('Total Income (Dollars):', income);
        setTotalIncome(income);
      }
    });

    // Calcular fechas de inicio y fin del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    // Obtener expenses en dólares del mes actual
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qExpenses = query(expensesRef, where('currency', '==', 'USD'), where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      let expenses = 0;
      snapshot.forEach((doc) => {
        console.log('Expense Document Data:', doc.data());
        expenses += Number(doc.data().amount);
      });
      console.log('Total Expenses (Dollars) for Current Month:', expenses);
      setTotalExpenses(expenses);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
    };
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
            title="Remaining in USD"
            value={remaining}
            precision={2}
            valueStyle={{ color: remaining < 50 ? '#cf1322' : '#3f8600' }}
            prefix={<DollarOutlined />}
            suffix="USD"
          />
          <span style={{ fontWeight: 600, fontSize: 13 }}>/ ${formatNumber(totalIncome)}</span>
        </div>
        <Progress type="circle" percent={progressPercent} strokeColor={conicColors} size="small" style={{ marginLeft: 30 }} />
      </div>
    </Card>
  );
};

export default RemainingDollarsCounter;
