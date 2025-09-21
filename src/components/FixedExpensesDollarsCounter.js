import React, { useState, useEffect } from 'react';
import { Statistic, Card } from 'antd';
import { RiseOutlined, FallOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined, CreditCardOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const FixedExpensesDollarsCounter = () => {
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;
    const currentMonthKey = dayjs().format('YYYY-MM');
    const prevMonthKey = dayjs().subtract(1, 'month').format('YYYY-MM');
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
    const prevRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, prevMonthKey);

    // Mes actual
    const unsub = onSnapshot(ref, snap => {
      const payments = snap.exists() ? snap.data().payments || [] : [];
      const totalUSD = payments.reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0);
      setTotal(totalUSD);
      setLoading(false);
    });

    // Mes anterior (solo una vez)
    (async () => {
      const prevSnap = await getDoc(prevRef);
      const prevPayments = prevSnap.exists() ? prevSnap.data().payments || [] : [];
      const prevTotalUSD = prevPayments.reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0);
      setPrevTotal(prevTotalUSD);
    })();

    return () => unsub();
  }, [currentUser]);

  // Cálculo del porcentaje de variación
  const pct = prevTotal > 0
    ? Math.round(((total - prevTotal) / prevTotal) * 100)
    : total > 0
      ? 100
      : 0;
  const isIncrease = total >= prevTotal;

  return (
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
      className="custom-fixed-expenses-card"
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
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        borderRadius: '50%',
        zIndex: 1,
        opacity: 0.1
      }} />
      
      {/* Content container with padding */}
      <div style={{ padding: '32px 28px 24px 28px' }}>
        {/* Header section with icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
          }}>
            <CreditCardOutlined style={{ 
              color: 'white', 
              fontSize: '20px' 
            }} />
          </div>
          <div>
            <h3 style={{
              color: '#e2e8f0',
              fontSize: '16px',
              fontWeight: 600,
              margin: 0,
              marginBottom: 4
            }}>
              {t('userProfile.dashboard.card.fixedExpenses.usd')}
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '12px',
              margin: 0
            }}>
              Gastos fijos del mes
            </p>
          </div>
        </div>

        {/* Amount section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Total fijo
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8
          }}>
            <DollarOutlined style={{ 
              color: '#f59e0b', 
              fontSize: '24px' 
            }} />
            <span style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: 1
            }}>
              {formatCompactNumber(total)}
            </span>
            <span style={{
              color: '#94a3b8',
              fontSize: '16px',
              fontWeight: 500
            }}>
              USD
            </span>
          </div>
        </div>

        {/* Progress section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Variación mensual
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {isIncrease ? (
              <ArrowUpOutlined style={{ 
                color: '#ef4444', 
                fontSize: '16px' 
              }} />
            ) : (
              <ArrowDownOutlined style={{ 
                color: '#10b981', 
                fontSize: '16px' 
              }} />
            )}
            <span style={{
              color: isIncrease ? '#ef4444' : '#10b981',
              fontSize: '18px',
              fontWeight: 600
            }}>
              {isIncrease ? "+" : "-"}{Math.abs(pct)}%
            </span>
            <span style={{
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              vs mes anterior
            </span>
          </div>
        </div>

        {/* Summary section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCardOutlined style={{ 
                color: '#f59e0b', 
                fontSize: '14px' 
              }} />
              <span style={{
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 500
              }}>
                Mes actual
              </span>
            </div>
            <span style={{
              color: '#f59e0b',
              fontSize: '14px',
              fontWeight: 600
            }}>
              ${formatCompactNumber(total)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCardOutlined style={{ 
                color: '#94a3b8', 
                fontSize: '14px' 
              }} />
              <span style={{
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500
              }}>
                Mes anterior
              </span>
            </div>
            <span style={{
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 500
            }}>
              ${formatCompactNumber(prevTotal)}
            </span>
          </div>
        </div>
      </div>

    </Card>
  );
};

// Inject custom CSS to ensure transparent background
const style = document.createElement('style');
style.textContent = `
  .custom-fixed-expenses-card .ant-card {
    background: transparent !important;
  }
  .custom-fixed-expenses-card .ant-card-body {
    background: transparent !important;
  }
  .custom-fixed-expenses-card .ant-card-content {
    background: transparent !important;
  }
`;
document.head.appendChild(style);

export default FixedExpensesDollarsCounter; 