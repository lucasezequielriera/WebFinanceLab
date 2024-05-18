import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import ExpenseList from '../components/ExpenseList';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const ExpensesPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qExpenses = query(expensesRef);

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
    };
  }, [currentUser]);

  if (loading) {
    return <Spin tip="Loading..." size="large" />;
  }

  return (
    <div>
      <h1>Expense List</h1>
      <ExpenseList expenses={expenses} />
    </div>
  );
};

export default ExpensesPage;
