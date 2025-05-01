// src/hooks/useMonthlyMovements.js
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

export default function useMonthlyMovements() {
  const { currentUser } = useAuth();
  const [hasIncomes, setHasIncomes] = useState(false);
  const [hasExpenses, setHasExpenses] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const now = new Date();
    const startOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const startOfNextMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));

    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);

    const qIncomes = query(
      incomesRef,
      where('timestamp', '>=', startOfMonth),
      where('timestamp', '<', startOfNextMonth)
    );
    const qExpenses = query(
      expensesRef,
      where('timestamp', '>=', startOfMonth),
      where('timestamp', '<', startOfNextMonth)
    );

    const unsubIncomes = onSnapshot(qIncomes, snap => {
      setHasIncomes(snap.size > 0);
    });
    const unsubExpenses = onSnapshot(qExpenses, snap => {
      setHasExpenses(snap.size > 0);
    });

    return () => {
      unsubIncomes();
      unsubExpenses();
    };
  }, [currentUser]);

  return { hasIncomes, hasExpenses };
}