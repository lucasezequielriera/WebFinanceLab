import React, { useEffect, useState } from 'react';
import { Card, Tag, Spin, Typography } from 'antd';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';
import { DollarOutlined, ArrowDownOutlined, ArrowUpOutlined, CreditCardOutlined, ShoppingOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const RecentMovements = () => {
  const { currentUser } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const { Title } = Typography;
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) return;

    let incomes = [];
    let expenses = [];
    let monthlyPayments = [];
    let incomesLoaded = false;
    let expensesLoaded = false;
    let paymentsLoaded = false;

    // Incomes listener
    const unsubIncomes = onSnapshot(collection(db, `users/${currentUser.uid}/incomes`), (snapshot) => {
      incomes = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          type: t('userProfile.dashboard.recentMovements.movementType.income'),
          description: d.title || d.description || '',
          amount: Number(d.amount),
          currency: d.currency || 'ARS',
          date: dayjs(d.timestamp?.seconds ? d.timestamp.seconds * 1000 : d.timestamp),
        };
      });
      incomesLoaded = true;
      if (expensesLoaded && paymentsLoaded) {
        combineAndSet();
      }
    });

    // Expenses listener
    const unsubExpenses = onSnapshot(collection(db, `users/${currentUser.uid}/expenses`), (snapshot) => {
      expenses = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          type: d.fixed ? t('userProfile.dashboard.recentMovements.movementType.fixedExpense') : t('userProfile.dashboard.recentMovements.movementType.dailyExpense'),
          description: d.description || '',
          amount: Number(d.amount),
          currency: d.currency || 'ARS',
          date: dayjs(d.timestamp?.seconds ? d.timestamp.seconds * 1000 : d.timestamp),
        };
      });
      expensesLoaded = true;
      if (incomesLoaded && paymentsLoaded) {
        combineAndSet();
      }
    });

    // MonthlyPayments (pagos fijos del mes actual) - ahora en tiempo real
    const monthKey = dayjs().format('YYYY-MM');
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
    const unsubPayments = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const payments = snap.data().payments || [];
        monthlyPayments = payments.map(p => {
          let date = null;
          if (p.timestamp && p.timestamp.seconds) {
            date = dayjs(p.timestamp.seconds * 1000);
          } else if (p.createdAt) {
            date = dayjs(p.createdAt);
            if (!date.isValid()) {
              console.log('[RecentMovements] Fecha inválida en createdAt, usando hoy:', p.createdAt);
              date = dayjs();
            }
          } else {
            date = dayjs();
          }
          return {
            type: t('userProfile.dashboard.recentMovements.movementType.fixedPayment'),
            description: p.description || p.title || p.bank || '',
            amount: Number(p.amountARS) > 0 ? Number(p.amountARS) : Number(p.amountUSD),
            currency: Number(p.amountARS) > 0 ? 'ARS' : 'USD',
            date,
          };
        });
      } else {
        monthlyPayments = [];
      }
      paymentsLoaded = true;
      if (incomesLoaded && expensesLoaded) {
        combineAndSet();
      }
    });

    function combineAndSet() {
      const all = [...incomes, ...expenses, ...monthlyPayments];
      all.sort((a, b) => b.date.valueOf() - a.date.valueOf());
      setMovements(all.slice(0, 10));
      setLoading(false);
    }

    return () => {
      unsubIncomes();
      unsubExpenses();
      unsubPayments();
    };
  }, [currentUser]);

  // Agrupar por día
  const grouped = groupByDay(movements);
  const days = Object.keys(grouped).sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());

  function groupByDay(movements) {
    return movements.reduce((acc, mov) => {
      const day = mov.date.format('YYYY-MM-DD');
      if (!acc[day]) acc[day] = [];
      acc[day].push(mov);
      return acc;
    }, {});
  }

  function getDayLabel(date) {
    const today = dayjs().startOf('day');
    const d = dayjs(date).startOf('day');
    if (d.isSame(today)) return t('userProfile.dashboard.recentMovements.today');
    if (d.isSame(today.subtract(1, 'day'))) return t('userProfile.dashboard.recentMovements.yesterday');
    return d.format('dddd DD/MM/YYYY');
  }

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
        cursor: 'pointer',
        height: '100%'
      }}
      bodyStyle={{ 
        padding: 0,
        position: 'relative',
        zIndex: 2,
        background: 'transparent',
        height: '100%'
      }}
      className="custom-recent-movements-card"
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
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        borderRadius: '50%',
        zIndex: 1,
        opacity: 0.1
      }} />
      
      {/* Content container with padding */}
      <div style={{ 
        padding: '32px 28px 24px 28px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header section with icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}>
              <HistoryOutlined style={{ 
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
                {t('userProfile.dashboard.recentMovements.title')}
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: 0
              }}>
                Últimos movimientos
              </p>
            </div>
          </div>
          <Link 
            to="/daily-expenses" 
            style={{ 
              color: '#3b82f6', 
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.1)';
            }}
          >
            {t('userProfile.dashboard.recentMovements.viewAll')}
          </Link>
        </div>

        {/* Movements list */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
        {days.map(day => (
            <div key={day} style={{ marginBottom: '24px' }}>
              <div style={{
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {getDayLabel(day)}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[day].map((item, index) => {
                  const isIncome = item.type === t('userProfile.dashboard.recentMovements.movementType.income');
                  const isFixedPayment = item.type === t('userProfile.dashboard.recentMovements.movementType.fixedPayment');
                  const isFixedExpense = item.type === t('userProfile.dashboard.recentMovements.movementType.fixedExpense');
                  
                  let iconColor = '#ef4444';
                  let iconBg = 'rgba(239, 68, 68, 0.1)';
                  let iconBorder = 'rgba(239, 68, 68, 0.2)';
                  let IconComponent = ArrowUpOutlined;
                  
                  if (isIncome) {
                    iconColor = '#10b981';
                    iconBg = 'rgba(16, 185, 129, 0.1)';
                    iconBorder = 'rgba(16, 185, 129, 0.2)';
                    IconComponent = ArrowDownOutlined;
                  } else if (isFixedPayment) {
                    iconColor = '#3b82f6';
                    iconBg = 'rgba(59, 130, 246, 0.1)';
                    iconBorder = 'rgba(59, 130, 246, 0.2)';
                    IconComponent = CreditCardOutlined;
                  } else if (isFixedExpense) {
                    iconColor = '#f59e0b';
                    iconBg = 'rgba(245, 158, 11, 0.1)';
                    iconBorder = 'rgba(245, 158, 11, 0.2)';
                    IconComponent = CreditCardOutlined;
                  } else {
                    IconComponent = ShoppingOutlined;
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: iconBg,
                        borderRadius: '12px',
                        border: `1px solid ${iconBorder}`,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = iconBg.replace('0.1', '0.2');
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = iconBg;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        boxShadow: `0 2px 8px ${iconColor}40`
                      }}>
                        <IconComponent style={{ 
                          color: 'white', 
                          fontSize: '16px' 
                        }} />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4
                        }}>
                          <span style={{
                            color: '#e2e8f0',
                            fontSize: '13px',
                            fontWeight: 600
                          }}>
                            {item.type}
                          </span>
                          <Tag 
                            style={{ 
                              margin: 0,
                              fontSize: '10px',
                              fontWeight: '600',
                              borderRadius: '4px',
                              border: 'none'
                            }} 
                            color={isIncome ? 'green' : 'red'}
                          >
                            {item.currency}
                          </Tag>
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.description || <i>{t('userProfile.dashboard.recentMovements.noMovements')}</i>}
                        </div>
                      </div>
                      
                      <div style={{ 
                        textAlign: 'right',
                        minWidth: 80
                      }}>
                        <div style={{
                          color: iconColor,
                          fontSize: '14px',
                          fontWeight: 700,
                          marginBottom: 2
                        }}>
                          {isIncome ? '+' : '-'}${formatCompactNumber(item.amount)}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#94a3b8',
                          fontWeight: '500'
                        }}>
                          {item.date.format('HH:mm')}
                        </div>
                      </div>
                    </div>
                  );
                })}
                  </div>
          </div>
        ))}
        </div>
      </div>
    </Card>
  );
};

export default RecentMovements; 

// Inject custom CSS to ensure transparent background
const style = document.createElement('style');
style.textContent = `
  .custom-recent-movements-card .ant-card {
    background: transparent !important;
  }
  .custom-recent-movements-card .ant-card-body {
    background: transparent !important;
  }
  .custom-recent-movements-card .ant-card-content {
    background: transparent !important;
  }
`;
document.head.appendChild(style); 