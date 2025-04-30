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
import { useTranslation } from 'react-i18next';
import { calcHastaHoy } from '../utils/finance';
import { getDailyLimit } from '../utils/limits';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

const DailyExpensesChart = ({ userId }) => {
  const [data, setData] = useState([]);
  const scrollRef = useRef(null);
  const chartRef = useRef(null); // <-- nuevo ref al chart
  const isMobile = useIsMobile();
  const [expenseLimits, setExpenseLimits] = useState([]);
  const [stats, setStats] = useState(null); // monthly status

  const { i18n } = useTranslation();
  const { t } = useTranslation();

  const currentMonth = dayjs().format('MMMM');

  dayjs.locale(i18n.language); // sincroniza el idioma

  useEffect(() => {
    if (!userId) return;

    const now = new Date();
    const startOfMonth = dayjs(now).startOf('month').toDate();
    const endOfMonth = dayjs(now).endOf('month').toDate();

    const expensesRef = collection(db, `users/${userId}/expenses`);
    const q = query(
      expensesRef,
      where('timestamp', '>=', startOfMonth),
      where('timestamp', '<', endOfMonth)
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
  }, [data, isMobile]);        // se recalcula cada vez que llegan nuevos gastos  

  const chartWidth = Math.max(600, data.length * 60);

  const formatShortNumber = (num) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}k`;
    return `$${Number(num).toFixed(2)}`;
  };

  useEffect(() => {
    if (!data.length) return;
  
    (async () => {
      const dailyLimit = await getDailyLimit(userId); // 🔹 llamada a Firebase
      const found = data.find(d => (d.ars || 0) + (d.usd || 0) > 0);
      if (!found) return;  

      if (!dailyLimit) return;
  
      const { spent, allowed } = calcHastaHoy(data, dailyLimit);
      const today = dayjs().date();

      // Cálculo //
      const limiteUntilToday = (dailyLimit * (today - found.day));
      const totalExpendedUntilToday = Number(spent.toFixed(2));
      const balanced = Number((limiteUntilToday - totalExpendedUntilToday).toFixed(2))

      setStats({ spent, allowed, balance: balanced });
    })();
  }, [data, userId]);

  return (
    <div style={{ position: 'relative' }}>
      <h3 style={{ marginBottom: 16, marginTop: 10, marginLeft: 15, textAlign: 'left', fontWeight: 700, fontSize: 18 }}>
        {t('userProfile.dashboard.dailyExpenses.title')} ({currentMonth})
        <sup> { stats ? (stats.balance >= 0
            ? <span style={{ fontSize: 12, color: 'green', fontWeight: 700 }}>+${stats.balance}</span>
            : <span style={{ fontSize: 12, color: 'red', fontWeight: 700 }}>-${Math.abs(stats.balance)}</span>
        ) : null }
        </sup>
      </h3>

      {isMobile ? (
        <div ref={scrollRef} style={{ overflowX: 'auto', width: '100%', paddingBottom: 12 }}>
          {/* MOBILE */}
          <LineChart ref={chartRef} width={chartWidth} height={300} data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} // ⬅️ más espacio arriba
          >
            {/* Definimos el gradiente */}
            <defs>
              <linearGradient id="gradientARS" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(0, 142, 251)" />
                <stop offset="50%" stopColor="rgb(0, 117, 209)" />
                <stop offset="100%" stopColor="rgb(0, 145, 255)" />
              </linearGradient>
              <linearGradient id="gradientUSD" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(0, 202, 169)" />
                <stop offset="50%" stopColor="rgb(0, 191, 145)" />
                <stop offset="100%" stopColor="rgb(0, 202, 169)" />
              </linearGradient>
            </defs>

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
            <Line type="monotone" dataKey="ars" stroke="url(#gradientARS)" name={t('userProfile.dashboard.dailyExpenses.tooltip') + ' ($)'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="usd" name={t('userProfile.dashboard.dailyExpenses.tooltip') + ' (USD)'} stroke="url(#gradientUSD)" strokeWidth={2} />
          </LineChart>
        </div>
      ) :
      (
        <ResponsiveContainer width="100%" height={300}>
          {/* DESKTOP */}
          <LineChart ref={chartRef} data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} // ⬅️ más espacio arriba
          >
            {/* Definimos el gradiente */}
            <defs>
              <linearGradient id="gradientARS" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(0, 142, 251)" />
                <stop offset="50%" stopColor="rgb(0, 117, 209)" />
                <stop offset="100%" stopColor="rgb(0, 145, 255)" />
              </linearGradient>
              <linearGradient id="gradientUSD" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(0, 202, 169)" />
                <stop offset="50%" stopColor="rgb(0, 191, 145)" />
                <stop offset="100%" stopColor="rgb(0, 202, 169)" />
              </linearGradient>
            </defs>

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
            <Line type="monotone" dataKey="ars" stroke="url(#gradientARS)" name={t('userProfile.dashboard.dailyExpenses.tooltip') + ' ($)'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="usd" name={t('userProfile.dashboard.dailyExpenses.tooltip') + ' (USD)'} stroke="url(#gradientUSD)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}

    </div>
  );
};

export default DailyExpensesChart;
