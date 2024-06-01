import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Spin, Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const RemainingPesosCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);

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

      // Obtener ingresos en pesos desde el array jobs dentro del documento del usuario
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      let totalIncome = 0;
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        if (userData.jobs) {
          userData.jobs.forEach((job) => {
            if (job.currency === 'ARS') {
              totalIncome += Number(job.salary);
            }
          });
        }
      }

      // Obtener expenses en pesos del mes actual
      const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
      const qExpenses = query(expensesRef, where('currency', '==', 'ARS'), where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

      let totalExpenses = 0;
      const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
        totalExpenses = 0;
        snapshot.forEach((doc) => {
          totalExpenses += Number(doc.data().amount);
        });

        const newRemaining = totalIncome - totalExpenses;
        setRemaining(newRemaining);

        setLoading(false);
      });

      return () => {
        unsubscribeExpenses();
      };
    };

    fetchData();
  }, [currentUser]);

  // if (loading) {
  //   return (
  //     <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  //       <div style={{ height: '100vh' }} />
  //     </Spin>
  //   );
  // }

  return (
    <Card loading={loading}>
      <Statistic
        title="Remaining in ARS"
        value={remaining}
        precision={2}
        valueStyle={{ color: remaining < 50000 ? '#cf1322' : '#3f8600' }}
        prefix={<DollarOutlined />}
        suffix="ARS"
      />
    </Card>
  );
};

export default RemainingPesosCounter;
