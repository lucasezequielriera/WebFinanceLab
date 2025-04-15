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
  const [expenseLimits, setExpenseLimits] = useState([]);

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
        ars: Number((groupedByDay[i + 1]?.ars || 0).toFixed(2)),
        usd: Number((groupedByDay[i + 1]?.usd || 0).toFixed(2))
      }));

      setData(chartData);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const fetchUserLimits = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const limits = userData.expenseLimits || [];
          setExpenseLimits(limits);
        }
      } catch (error) {
        console.error("Failed to fetch expense limits:", error);
      }
    };
  
    if (userId) fetchUserLimits();
  }, [userId]);  

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const today = dayjs().date();
      const approxScroll = (today - 4) * 60;
      scrollRef.current.scrollLeft = Math.max(approxScroll, 0);
    }
  }, [data, isMobile]);

  const chartWidth = Math.max(600, data.length * 60);

  const formatShortNumber = (num) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}k`;
    return `$${Number(num).toFixed(2)}`;
  };  

  return (
    <div style={{ position: 'relative' }}>
      <h3 style={{ marginBottom: 16, marginTop: 8, textAlign: 'center', fontWeight: 600 }}>
        Daily Expenses ({currentMonth})
      </h3>

      {isMobile ? (
        <div ref={scrollRef} style={{ overflowX: 'auto', width: '100%', paddingBottom: 12 }}>
          <LineChart width={chartWidth} height={300} data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} // ⬅️ más espacio arriba
          >
            <CartesianGrid strokeDasharray="3 3" />
            {expenseLimits.map((limit, index) => {
              const amount = Number(Number(limit.amount).toFixed(2));
              return (
                <ReferenceLine
                  key={index}
                  y={amount}
                  label={{
                    value: `${limit.label || `Limit ${index + 1}`} $${amount}`,
                    position: 'top',
                    fill: limit.color || 'red',
                    fontSize: 12,
                  }}
                  stroke={limit.color || 'red'}
                  strokeDasharray="3 3"
                  
                />
              );
            })}
            <XAxis dataKey="day" style={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis
              style={{ fontSize: 10, fontWeight: 600 }}
              tickFormatter={formatShortNumber}
              domain={
                expenseLimits.length > 0
                  ? [0, Math.max(...expenseLimits.map(limit => Number(Number(limit.amount).toFixed(2))))]
                  : ['auto', 'auto']
              }
            />
            <Tooltip formatter={(value, dataKey) => [formatShortNumber(value), dataKey]} />
            <Line type="monotone" dataKey="ars" stroke="#1890ff" name="Expenses ($)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="usd" name="Expenses (USD)" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} // ⬅️ más espacio arriba
          >
            <CartesianGrid strokeDasharray="3 3" />
            {expenseLimits.map((limit, index) => {
              const amount = Number(Number(limit.amount).toFixed(2));
              return (
                <ReferenceLine
                  key={index}
                  y={amount}
                  label={{
                    value: `${limit.label || `Limit ${index + 1}`} $${amount}`,
                    position: 'top',
                    fill: limit.color || 'red',
                    fontSize: 12,
                  }}
                  stroke={limit.color || 'red'}
                  strokeDasharray="3 3"
                />
              );
            })}
            <XAxis dataKey="day" style={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis
              style={{ fontSize: 12, fontWeight: 600 }}
              tickFormatter={formatShortNumber}
              domain={
                expenseLimits.length > 0
                  ? [0, Math.max(...expenseLimits.map(limit => Number(Number(limit.amount).toFixed(2))))]
                  : ['auto', 'auto']
              }
            />
            <Tooltip formatter={(value, dataKey) => [formatShortNumber(value), dataKey]} />
            <Line type="monotone" dataKey="ars" stroke="#1890ff" name="Expenses ($)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="usd" name="Expenses (USD)" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DailyExpensesChart;
