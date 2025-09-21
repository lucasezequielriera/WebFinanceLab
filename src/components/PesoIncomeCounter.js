import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { RiseOutlined, FallOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const PesoIncomeCounter = () => {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const now = new Date();

    // Mes actual
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp   = Timestamp.fromDate(end);

    // Mes anterior
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrev   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevTs = Timestamp.fromDate(startPrev);
    const endPrevTs   = Timestamp.fromDate(endPrev);

    // 1) Consultar mes anterior (una sola vez)
    (async () => {
      const qPrev = query(
        incomesRef,
        where('currency', '==', 'ARS'),
        where('timestamp', '>=', startPrevTs),
        where('timestamp', '<',  endPrevTs)
      );
      const snapPrev = await getDocs(qPrev);
      const sumPrev = snapPrev.docs.reduce((sum, d) => sum + parseFloat(d.data().amount), 0);
      setPrevTotal(sumPrev);
      console.log('[PesoIncomeCounter] Ingresos ARS mes anterior:', sumPrev);
    })();

    // 2) Subscribir mes actual
    const qCurr = query(
      incomesRef,
      where('currency', '==', 'ARS'),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<',  endTimestamp)
    );
    const unsubscribe = onSnapshot(qCurr, (snapshot) => {
      const sumCurr = snapshot.docs.reduce((sum, d) => sum + parseFloat(d.data().amount), 0);
      setTotal(sumCurr);
      setLoading(false);
      console.log('[PesoIncomeCounter] Ingresos ARS mes actual:', sumCurr);
    });

    return () => {
      unsubscribe();
    };
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
      className="custom-income-card-pesos"
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
        background: 'linear-gradient(135deg, #10b981, #059669)',
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
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          }}>
            <DollarOutlined style={{ 
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
              {t('userProfile.dashboard.card.incomes.ars')}
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '12px',
              margin: 0
            }}>
              Ingresos del mes
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
            Total ingresado
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8
          }}>
            <DollarOutlined style={{ 
              color: '#10b981', 
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
              ARS
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
                color: '#10b981', 
                fontSize: '16px' 
              }} />
            ) : (
              <ArrowDownOutlined style={{ 
                color: '#ef4444', 
                fontSize: '16px' 
              }} />
            )}
            <span style={{
              color: isIncrease ? '#10b981' : '#ef4444',
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
              <RiseOutlined style={{ 
                color: '#10b981', 
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
              color: '#10b981',
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
              <FallOutlined style={{ 
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

export default PesoIncomeCounter;

// Inject custom CSS to ensure transparent background
const style = document.createElement('style');
style.textContent = `
  .custom-income-card-pesos .ant-card {
    background: transparent !important;
  }
  .custom-income-card-pesos .ant-card-body {
    background: transparent !important;
  }
  .custom-income-card-pesos .ant-card-content {
    background: transparent !important;
  }
`;
document.head.appendChild(style);