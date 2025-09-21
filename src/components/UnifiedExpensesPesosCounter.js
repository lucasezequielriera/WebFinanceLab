import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined, CreditCardOutlined, ShoppingOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const UnifiedExpensesPesosCounter = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [fixedTotal, setFixedTotal] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [prevFixedTotal, setPrevFixedTotal] = useState(0);
  const [prevDailyTotal, setPrevDailyTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Helper para rango de mes
  const getRange = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return [Timestamp.fromDate(start), Timestamp.fromDate(end)];
  };

  useEffect(() => {
    if (!currentUser) return;
    const now = new Date();

    // Gastos diarios - Mes actual
    const [startCur, endCur] = getRange(now);
    const qDailyCurrent = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      where('currency', '==', 'ARS'),
      where('timestamp', '>=', startCur),
      where('timestamp', '<', endCur)
    );

    // Gastos fijos - Mes actual
    const currentMonthKey = dayjs().format('YYYY-MM');
    const fixedRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);

    // Gastos diarios - Mes anterior
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [startPrev, endPrev] = getRange(prevDate);
    const qDailyPrev = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      where('currency', '==', 'ARS'),
      where('timestamp', '>=', startPrev),
      where('timestamp', '<', endPrev)
    );

    // Gastos fijos - Mes anterior
    const prevMonthKey = dayjs().subtract(1, 'month').format('YYYY-MM');
    const prevFixedRef = doc(db, `users/${currentUser.uid}/monthlyPayments`, prevMonthKey);

    // Suscripciones
    const unsubDaily = onSnapshot(qDailyCurrent, snap => {
      const sum = snap.docs.reduce((s, d) => s + parseFloat(d.data().amount), 0);
      setDailyTotal(sum);
    });

    const unsubFixed = onSnapshot(fixedRef, snap => {
      const payments = snap.exists() ? snap.data().payments || [] : [];
      const totalARS = payments.reduce((sum, p) => sum + (Number(p.amountARS) || 0), 0);
      setFixedTotal(totalARS);
      setLoading(false);
    });

    // Mes anterior (una sola vez)
    (async () => {
      const prevDailySnap = await getDocs(qDailyPrev);
      const prevDailySum = prevDailySnap.docs.reduce((s, d) => s + parseFloat(d.data().amount), 0);
      setPrevDailyTotal(prevDailySum);

      const prevFixedSnap = await getDoc(prevFixedRef);
      const prevPayments = prevFixedSnap.exists() ? prevFixedSnap.data().payments || [] : [];
      const prevFixedSum = prevPayments.reduce((sum, p) => sum + (Number(p.amountARS) || 0), 0);
      setPrevFixedTotal(prevFixedSum);
    })();

    return () => {
      unsubDaily();
      unsubFixed();
    };
  }, [currentUser]);

  // Cálculos
  const totalExpenses = fixedTotal + dailyTotal;
  const prevTotalExpenses = prevFixedTotal + prevDailyTotal;
  const diff = totalExpenses - prevTotalExpenses;
  const pct = prevTotalExpenses > 0 ? ((diff / prevTotalExpenses) * 100).toFixed(0) : 0;
  const isIncrease = diff >= 0;

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
      className="custom-unified-expenses-card-pesos"
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
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
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
              Gastos ARS
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '12px',
              margin: 0
            }}>
              Fijos y diarios del mes
            </p>
          </div>
        </div>

        {/* Total amount section - More prominent */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Total gastado
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 8
          }}>
            <DollarOutlined style={{ 
              color: '#ef4444', 
              fontSize: '28px' 
            }} />
            <span style={{
              color: '#ffffff',
              fontSize: '36px',
              fontWeight: 700,
              lineHeight: 1
            }}>
              {formatCompactNumber(totalExpenses)}
            </span>
            <span style={{
              color: '#94a3b8',
              fontSize: '18px',
              fontWeight: 500
            }}>
              ARS
            </span>
          </div>
          
          {/* Variation indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {isIncrease ? (
              <ArrowUpOutlined style={{ 
                color: '#ef4444', 
                fontSize: '14px' 
              }} />
            ) : (
              <ArrowDownOutlined style={{ 
                color: '#10b981', 
                fontSize: '14px' 
              }} />
            )}
            <span style={{
              color: isIncrease ? '#ef4444' : '#10b981',
              fontSize: '14px',
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

        {/* Breakdown section - Enhanced with percentages and trends */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Desglose detallado
          </div>
          
          {/* Fixed expenses with trend */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            padding: '12px 16px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCardOutlined style={{ 
                  color: 'white', 
                  fontSize: '14px' 
                }} />
              </div>
              <div>
                <div style={{
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: 2
                }}>
                  Gastos fijos
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '11px'
                }}>
                  {prevFixedTotal > 0 ? 
                    `${((fixedTotal - prevFixedTotal) / prevFixedTotal * 100).toFixed(0)}% vs anterior` : 
                    'Nuevo'
                  }
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                color: '#f59e0b',
                fontSize: '16px',
                fontWeight: 700
              }}>
                ${formatCompactNumber(fixedTotal)}
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '11px'
              }}>
                {((fixedTotal / totalExpenses) * 100).toFixed(0)}% del total
              </div>
            </div>
          </div>

          {/* Daily expenses with trend */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingOutlined style={{ 
                  color: 'white', 
                  fontSize: '14px' 
                }} />
              </div>
              <div>
                <div style={{
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: 2
                }}>
                  Gastos diarios
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '11px'
                }}>
                  {prevDailyTotal > 0 ? 
                    `${((dailyTotal - prevDailyTotal) / prevDailyTotal * 100).toFixed(0)}% vs anterior` : 
                    'Nuevo'
                  }
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: 700
              }}>
                ${formatCompactNumber(dailyTotal)}
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '11px'
              }}>
                {((dailyTotal / totalExpenses) * 100).toFixed(0)}% del total
              </div>
            </div>
          </div>
        </div>

        {/* Progress section - Enhanced with visual progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Variación mensual
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8
          }}>
            {isIncrease ? (
              <ArrowUpOutlined style={{ 
                color: '#ef4444', 
                fontSize: '18px' 
              }} />
            ) : (
              <ArrowDownOutlined style={{ 
                color: '#10b981', 
                fontSize: '18px' 
              }} />
            )}
            <span style={{
              color: isIncrease ? '#ef4444' : '#10b981',
              fontSize: '20px',
              fontWeight: 700
            }}>
              {isIncrease ? "+" : "-"}{Math.abs(pct)}%
            </span>
            <span style={{
              color: '#94a3b8',
              fontSize: '13px'
            }}>
              vs mes anterior
            </span>
          </div>
          
          {/* Visual progress bar */}
          <div style={{
            width: '100%',
            height: 6,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 8
          }}>
            <div style={{
              width: `${Math.min(Math.abs(pct), 100)}%`,
              height: '100%',
              background: isIncrease ? 
                'linear-gradient(90deg, #ef4444, #dc2626)' : 
                'linear-gradient(90deg, #10b981, #059669)',
              borderRadius: 3,
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <span>Mes anterior: ${formatCompactNumber(prevTotalExpenses)}</span>
            <span>Diferencia: ${formatCompactNumber(Math.abs(diff))}</span>
          </div>
        </div>

        {/* Summary section - Compact and informative */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarOutlined style={{ 
                color: '#ef4444', 
                fontSize: '16px' 
              }} />
              <span style={{
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600
              }}>
                Resumen mensual
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: 700
              }}>
                ${formatCompactNumber(totalExpenses)}
              </span>
              <span style={{
                color: '#94a3b8',
                fontSize: '12px'
              }}>
                total
              </span>
            </div>
          </div>
          
          {/* Quick stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: 6,
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{
                color: '#f59e0b',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: 2
              }}>
                Fijos
              </div>
              <div style={{
                color: '#e2e8f0',
                fontSize: '11px'
              }}>
                ${formatCompactNumber(fixedTotal)}
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 6,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: 2
              }}>
                Diarios
              </div>
              <div style={{
                color: '#e2e8f0',
                fontSize: '11px'
              }}>
                ${formatCompactNumber(dailyTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UnifiedExpensesPesosCounter;

// Inject custom CSS to ensure transparent background
const style = document.createElement('style');
style.textContent = `
  .custom-unified-expenses-card-pesos .ant-card {
    background: transparent !important;
  }
  .custom-unified-expenses-card-pesos .ant-card-body {
    background: transparent !important;
  }
  .custom-unified-expenses-card-pesos .ant-card-content {
    background: transparent !important;
  }
`;
document.head.appendChild(style);
