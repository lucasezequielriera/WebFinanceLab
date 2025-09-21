import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, Timestamp, getDocs, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Card, Statistic, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import { DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const BalanceDollarsCounter = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const progressPercent = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(0) : 0;
  const twoColors = {
    '0%': 'rgb(0, 143, 226)',
    '50%': 'rgb(0, 201, 167)',
    '100%': 'rgb(0, 191, 145)',
  };

    const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    // Calcular fechas de inicio y fin del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // ── ingresos en USD del mes actual (colección incomes) ──
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const qIncomes = query(
      incomesRef,
      where('currency', '==', 'USD'),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<',  endTimestamp)
    );

      let income = 0;
    getDocs(qIncomes).then(snapIncomes => {
      snapIncomes.forEach((d) => {
        income += Number(d.data().amount);
      });
      setTotalIncome(income);
      console.log('[BalanceDollarsCounter] Ingresos USD mes actual:', income);

      // Obtener pagos mensuales en USD
      const paymentsRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
      let paymentsSum = 0;
      const unsubPayments = onSnapshot(paymentsRef, snap => {
        const payments = snap.exists() ? snap.data().payments || [] : [];
        paymentsSum = payments.reduce((acc, p) => acc + (Number(p.amountUSD) || 0), 0);
        setTotalPayments(paymentsSum);
        // Obtener gastos diarios en USD
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
        const qExpenses = query(
          expensesRef,
          where('currency', '==', 'USD'),
          where('timestamp', '>=', startTimestamp),
          where('timestamp', '<', endTimestamp)
        );
        const unsubExpenses = onSnapshot(qExpenses, snap => {
          const expensesSum = snap.docs.reduce((acc, d) => acc + Number(d.data().amount), 0);
          setTotalExpenses(expensesSum);
          const result = income - paymentsSum - expensesSum;
          setRemaining(result);
      setLoading(false);
          console.log('[BalanceDollarsCounter] Pagos mensuales USD mes actual:', paymentsSum);
          console.log('[BalanceDollarsCounter] Gastos diarios USD mes actual:', expensesSum);
          console.log('[BalanceDollarsCounter] Resultado mostrado en card:', result);
    });
        // Limpiar expenses listener al desmontar
        return () => unsubExpenses();
      });
      // Limpiar payments listener al desmontar
      return () => unsubPayments();
    });
  }, [currentUser]);

  return (
    (() => {
      console.log('[BalanceDollarsCounter] Render: ingresos USD:', totalIncome, '- pagos mensuales USD:', totalPayments, '- gastos diarios USD:', totalExpenses, '=', remaining);
    })(),
    <Card 
      loading={loading}
      style={{ 
        marginBottom: 0,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: 'none',
        background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(0)',
        cursor: 'pointer'
      }}
      bodyStyle={{ 
        padding: 0,
        position: 'relative',
        zIndex: 2,
        background: 'transparent'
      }}
      className="custom-balance-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
      }}
    >
      {/* Decorative background element */}
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        borderRadius: '50%',
        zIndex: 1,
        opacity: 0.1
      }} />
      
      {/* Content container with padding */}
      <div style={{
        padding: '32px 28px 24px 28px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Header section */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
          position: 'relative',
          zIndex: 3
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            boxShadow: '0 4px 16px rgba(251, 191, 36, 0.3)'
          }}>
            <DollarOutlined style={{ color: 'white', fontSize: '20px' }} />
          </div>
          <div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#ffffff',
              marginBottom: 4,
              lineHeight: 1.2
            }}>
              {t('userProfile.dashboard.card.balance.usd')}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#a0aec0',
              fontWeight: '500'
            }}>
              Balance Total
            </div>
          </div>
        </div>
        
        {/* Amount section */}
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 3 }}>
          <div style={{
            fontSize: '13px',
            color: '#a0aec0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8
          }}>
            Disponible
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#ffffff',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
            gap: 6
          }}>
            <DollarOutlined style={{ fontSize: '24px', color: '#fbbf24' }} />
            {formatCompactNumber(remaining)}
            <span style={{ 
              fontSize: '16px', 
              color: '#a0aec0',
              fontWeight: '600',
              marginLeft: 4
            }}>
              USD
            </span>
          </div>
        </div>
        
        {/* Progress section */}
        <div style={{ position: 'relative', zIndex: 3 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <span style={{
              fontSize: '12px',
              color: '#a0aec0',
              fontWeight: '600'
            }}>
              Progreso del mes
            </span>
            <span style={{
              fontSize: '12px',
              color: '#fbbf24',
              fontWeight: '700'
            }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{
            height: 8,
            background: 'rgba(160, 174, 192, 0.2)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(progressPercent, 100)}%`,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              borderRadius: 4,
              transition: 'width 0.3s ease',
              boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
            }} />
          </div>
        </div>
        
        {/* Summary section */}
        <div style={{
          marginTop: 20,
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 3
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiseOutlined style={{ color: '#10b981', fontSize: '12px' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                Ingresos
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>
              ${formatCompactNumber(totalIncome)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FallOutlined style={{ color: '#ef4444', fontSize: '12px' }} />
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>
                Gastos
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>
              ${formatCompactNumber(totalExpenses + totalPayments)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BalanceDollarsCounter;

// Estilos CSS para eliminar el fondo blanco del Card
const style = document.createElement('style');
style.textContent = `
  .custom-balance-card .ant-card {
    background: transparent !important;
  }
  .custom-balance-card .ant-card-body {
    background: transparent !important;
  }
  .custom-balance-card .ant-card-content {
    background: transparent !important;
  }
`;
document.head.appendChild(style);
