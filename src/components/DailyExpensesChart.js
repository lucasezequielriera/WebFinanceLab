import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc, 
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import dayjs from 'dayjs';
import useIsMobile from '../hooks/useIsMobile';

const DailyExpensesChart = ({ userId }) => {
  const [data, setData] = useState([]);
  const scrollRef = useRef(null);
  const isMobile = useIsMobile();
  const currentMonth = dayjs().format('MMMM').charAt(0).toUpperCase() + dayjs().format('MMMM').slice(1);
  const [expenseLimit, setExpenseLimit] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const now = new Date();
    const startOfMonth = dayjs(now).startOf('month').toDate();
    const endOfMonth = dayjs(now).endOf('month').toDate();

    const expensesRef = collection(db, `users/${userId}/expenses`);
    const q = query(
      expensesRef,
      where('timestamp', '>=', startOfMonth),
      where('timestamp', '<=', endOfMonth)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => doc.data());

      const groupedByDay = {};

      expenses.forEach(expense => {
        const day = dayjs(expense.timestamp.toDate()).date();
        const currency = expense.currency || 'ARS';
        const amount = Number(expense.amount);
      
        if (!groupedByDay[day]) {
          groupedByDay[day] = { ars: 0, usd: 0 };
        }
      
        if (currency === 'ARS') {
          groupedByDay[day].ars += amount;
        } else if (currency === 'USD') {
          groupedByDay[day].usd += amount;
        }
      });

      const daysInMonth = dayjs().daysInMonth();
      const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        ars: groupedByDay[i + 1]?.ars || 0,
        usd: groupedByDay[i + 1]?.usd || 0
      }));

      setData(chartData);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const fetchUserLimit = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setExpenseLimit(userData.expenseLimit || null);
        }
      } catch (error) {
        console.error("Failed to fetch expense limit:", error);
      }
    };
  
    if (userId) fetchUserLimit();
  }, [userId]);

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const today = dayjs().date();
      const approxScroll = (today - 4) * 60;
      scrollRef.current.scrollLeft = Math.max(approxScroll, 0);
    }
  }, [data, isMobile]);

  const chartWidth = Math.max(600, data.length * 60);

  return (
    <div style={{ position: 'relative' }}>
      <h3 style={{ marginBottom: 16, marginTop: 8, textAlign: 'center', fontWeight: 600 }}>Daily Expenses ({currentMonth})</h3>

      {isMobile ? (
        <div ref={scrollRef} style={{ overflowX: 'auto', width: '100%', paddingBottom: 12 }}>
          <LineChart width={chartWidth} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            {expenseLimit && (
              <ReferenceLine
                y={expenseLimit}
                label={{ value: `Limit: $${expenseLimit}`, position: 'top', fill: 'red', fontSize: 12 }}
                stroke="red"
                strokeDasharray="3 3"
              />
            )}
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value, dataKey) => [`$${Number(value).toLocaleString('es-AR')}`, dataKey] } />
            <Line type="monotone" dataKey="ars" stroke="#1890ff" name="Expenses ($)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="usd" name="Expenses (USD)" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </div>
        
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            {expenseLimit && (
              <ReferenceLine
                y={expenseLimit}
                label={{ value: `Limit: $${expenseLimit}`, position: 'top', fill: 'red', fontSize: 12 }}
                stroke="red"
                strokeDasharray="3 3"
              />
            )}
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value, dataKey) => [`$${Number(value).toLocaleString('es-AR')}`, dataKey] } />
            <Line type="monotone" dataKey="ars" stroke="#1890ff" name="Expenses ($)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="usd" name="Expenses (USD)" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DailyExpensesChart;
