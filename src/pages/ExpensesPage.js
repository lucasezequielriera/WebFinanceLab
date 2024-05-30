import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spin, List } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ExpensesPage.css';

const ExpensesPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qExpenses = query(expensesRef);

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const monthsSet = new Set();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.timestamp.seconds * 1000);
        const month = format(date, 'MMMM yyyy', { locale: es });
        monthsSet.add(month);
      });
      setMonths(Array.from(monthsSet));
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
    };
  }, [currentUser]);

  if (loading) {
    return (
      <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
      </Spin>
    );
  }

  return (
    <div>
      <h1>Select a Month</h1>
      <List
        bordered
        dataSource={months}
        renderItem={(month) => (
          <List.Item>
            <Link to={`/monthly-expenses/${month}`}>{month}</Link>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ExpensesPage;
