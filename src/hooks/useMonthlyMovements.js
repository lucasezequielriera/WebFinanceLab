import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

/**
 * Hook to determine if the current user has any incomes or expenses
 * in the current month.
 *
 * @returns {{ hasIncomes: boolean, hasExpenses: boolean, loading: boolean }}
 */
export default function useMonthlyMovements() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasIncomes, setHasIncomes] = useState(false);
  const [hasExpenses, setHasExpenses] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchMovements = async () => {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const startTs = Timestamp.fromDate(startOfMonth);
      const endTs = Timestamp.fromDate(endOfMonth);

      // Query incomes
      const incQ = query(
        collection(db, `users/${currentUser.uid}/incomes`),
        where('timestamp', '>=', startTs),
        where('timestamp', '<', endTs)
      );
      const incSnap = await getDocs(incQ);

      // Query expenses
      const expQ = query(
        collection(db, `users/${currentUser.uid}/expenses`),
        where('timestamp', '>=', startTs),
        where('timestamp', '<', endTs)
      );
      const expSnap = await getDocs(expQ);

      setHasIncomes(!incSnap.empty);
      setHasExpenses(!expSnap.empty);
      setLoading(false);
    };

    fetchMovements();
  }, [currentUser]);

  return { hasIncomes, hasExpenses, loading };
}