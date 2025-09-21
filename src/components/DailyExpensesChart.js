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
import { Card } from 'antd';
import { BarChartOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useIsMobile from '../hooks/useIsMobile';
import { useTranslation } from 'react-i18next';
import { calcHastaHoy } from '../utils/finance';
import { getDailyLimit } from '../utils/limits';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const DailyExpensesChart = ({ userId }) => {
  const [data, setData] = useState([]);
  const scrollRef = useRef(null);
  const chartRef = useRef(null); // <-- nuevo ref al chart
  const isMobile = useIsMobile();
  const [expenseLimits, setExpenseLimits] = useState([]);
  const [stats, setStats] = useState(null); // monthly status
  const [loading, setLoading] = useState(true);

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
    if (!userId) return;
  
    const fetchMonthlyLimits = async () => {
      try {
        const monthKey = dayjs().format('YYYY-MM');
        const limitsDocRef = doc(
          db,
          'users',
          userId,
          'expenseLimitsByMonth',
          monthKey
        );
        const limitsSnap = await getDoc(limitsDocRef);
        if (limitsSnap.exists()) {
          const { limits } = limitsSnap.data();
          setExpenseLimits(Array.isArray(limits) ? limits : []);
        } else {
          setExpenseLimits([]);
        }
      } catch (error) {
        console.error("Failed to fetch monthly expense limits:", error);
      }
    };
  
    fetchMonthlyLimits();
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
    if (!data.length || !userId) return;
  
    const computeStats = async () => {
      try {
        const dailyLimit = await getDailyLimit(userId);
        // Si no hay límite definido, mostramos cero en todo
        if (!dailyLimit) {
          setStats({ spent: 0, allowed: 0, balance: 0 });
          return;
        }
  
        const today = dayjs().date();
  
        // Gasto acumulado hasta hoy
        const spentUntilToday = data
          .filter(d => d.day <= today)
          .reduce((sum, d) => sum + (d.ars || 0) + (d.usd || 0), 0);
  
        // La porción "allowed" es simplemente dailyLimit * días transcurridos
        const allowedUntilToday = Number((dailyLimit * today).toFixed(2));
  
        // Balance restante
        const balance = Number((allowedUntilToday - spentUntilToday).toFixed(2));
  
        setStats({
          spent: Number(spentUntilToday.toFixed(2)),
          allowed: allowedUntilToday,
          balance
        });
      } catch (error) {
        console.error("Error calculando stats:", error);
        setStats({ spent: 0, allowed: 0, balance: 0 });
      }
    };
  
    computeStats();
  }, [data, userId]);  

  const formatShort = num => {
    if (num >= 1e6) return `$${(num/1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num/1e3).toFixed(1)}k`;
    return `$${num.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    const colorMap = {
      ars: 'rgb(0, 105, 185)',
      usd: 'rgb(0, 165, 138)'
    };

    return (
      <div style={{
        background: '#fff',
        border: '1px solid #ccc',
        padding: 8,
        borderRadius: 4
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{t('userProfile.dashboard.dailyExpenses.tooltip.expensesDay')} {label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{
            margin: '4px 0',
            color: colorMap[entry.dataKey] || '#000',
            fontWeight: 600
          }}>
            {entry.name}: {formatShort(entry.value)}
          </p>
        ))}
      </div>
    );
  };
  
  // Inyectar CSS personalizado para el fondo transparente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-daily-expenses-card .ant-card-body {
        background: transparent !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Card
      className="custom-daily-expenses-card"
      style={{
        background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{
        padding: '0',
        background: 'transparent',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '24px 24px 16px 24px',
        background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
            }}>
              <BarChartOutlined style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                color: 'white',
                fontSize: '20px',
                fontWeight: '700',
                lineHeight: '1.2',
              }}>
                {t('userProfile.dashboard.dailyExpenses.title')}
              </h3>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {currentMonth} - {t('userProfile.dashboard.dailyExpenses.subtitle')}
              </p>
            </div>
          </div>
          {stats && (
            <div style={{
              textAlign: 'right',
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: stats.balance >= 0 ? '#52c41a' : '#ff4d4f',
                marginBottom: '4px',
              }}>
                {stats.balance >= 0 ? '+' : ''}${formatCompactNumber(Math.abs(stats.balance))}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '500',
              }}>
                {t('userProfile.dashboard.dailyExpenses.balance')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div style={{ padding: '24px' }}>
        {isMobile ? (
          <div ref={scrollRef} style={{ overflowX: 'auto', width: '100%', paddingBottom: 12 }}>
            {/* MOBILE */}
            <LineChart ref={chartRef} width={chartWidth} height={300} data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
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

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
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
              <XAxis 
                dataKey="day" 
                style={{ fontSize: 12, fontWeight: 600, fill: 'rgba(255, 255, 255, 0.8)' }} 
              />
              <YAxis
                style={{ fontSize: 10, fontWeight: 600, fill: 'rgba(255, 255, 255, 0.8)' }}
                tickFormatter={formatCompactNumber}
                domain={
                  expenseLimits.length > 0
                    ? [0, Math.max(...expenseLimits.map(limit => Number(Number(limit.amount).toFixed(2))))]
                    : ['auto', 'auto']
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ars" stroke="url(#gradientARS)" name={t('userProfile.dashboard.dailyExpenses.tooltip.expensesAmount') + ' ($)'} strokeWidth={3} dot={{ r: 4, fill: 'url(#gradientARS)' }} activeDot={{ r: 6, fill: 'url(#gradientARS)' }} />
              <Line type="monotone" dataKey="usd" name={t('userProfile.dashboard.dailyExpenses.tooltip.expensesAmount') + ' (USD)'} stroke="url(#gradientUSD)" strokeWidth={3} dot={{ r: 4, fill: 'url(#gradientUSD)' }} activeDot={{ r: 6, fill: 'url(#gradientUSD)' }} />
            </LineChart>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {/* DESKTOP */}
            <LineChart ref={chartRef} data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
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

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
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
              <XAxis 
                dataKey="day" 
                style={{ fontSize: 12, fontWeight: 600, fill: 'rgba(255, 255, 255, 0.8)' }} 
              />
              <YAxis
                style={{ fontSize: 12, fontWeight: 600, fill: 'rgba(255, 255, 255, 0.8)' }}
                tickFormatter={formatCompactNumber}
                domain={
                  expenseLimits.length > 0
                    ? [0, Math.max(...expenseLimits.map(limit => Number(Number(limit.amount).toFixed(2))))]
                    : ['auto', 'auto']
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ars" stroke="url(#gradientARS)" name={t('userProfile.dashboard.dailyExpenses.tooltip.expensesAmount') + ' ($)'} strokeWidth={3} dot={{ r: 4, fill: 'url(#gradientARS)' }} activeDot={{ r: 6, fill: 'url(#gradientARS)' }} />
              <Line type="monotone" dataKey="usd" name={t('userProfile.dashboard.dailyExpenses.tooltip.expensesAmount') + ' (USD)'} stroke="url(#gradientUSD)" strokeWidth={3} dot={{ r: 4, fill: 'url(#gradientUSD)' }} activeDot={{ r: 6, fill: 'url(#gradientUSD)' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default DailyExpensesChart;
