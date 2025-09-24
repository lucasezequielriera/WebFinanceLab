import React from 'react';
import { Tooltip, Empty, Card } from 'antd';
import { CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import '../styles/MiniMonthlyTimeline.css';

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

const MiniMonthlyTimeline = ({ expensesByMonth, onMonthClick, selectedMonth }) => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1);
    const monthKey = `${date.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
    const monthData = expensesByMonth[monthKey] || { ARS: 0, USD: 0 };
    
    return {
      key: monthKey,
      name: date.toLocaleString(i18n.language, { month: 'short' }),
      total: monthData.ARS + (monthData.USD * 1000), // Convertir USD a ARS aproximado
      data: monthData
    };
  });

  // Encontrar el máximo para la escala
  const maxTotal = Math.max(...months.map(m => m.total));

  if (maxTotal === 0) {
    return (
      <Card
        style={{
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        bodyStyle={{
          padding: '40px 24px',
          textAlign: 'center',
          background: 'transparent',
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' }}>
              {t('userProfile.dashboard.monthlyTimeline.noData')}
            </span>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
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
          gap: '12px',
        }}>
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
            <CalendarOutlined style={{ fontSize: '20px', color: 'white' }} />
          </div>
          <div>
            <h3 style={{
              margin: 0,
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
              lineHeight: '1.2',
            }}>
              {t('userProfile.dashboard.monthlyTimeline.title')}
            </h3>
            <p style={{
              margin: 0,
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              {t('userProfile.dashboard.monthlyTimeline.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'space-between',
          height: '200px',
          gap: '8px',
        }}>
          {months.map(month => {
            const height = maxTotal > 0 ? (month.total / maxTotal) * 180 : 0;
            const isSelected = selectedMonth === month.key;
            
            return (
              <Tooltip
                key={month.key}
                title={
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>
                      {month.name} {currentYear}
                    </div>
                    <div style={{ color: '#52c41a', marginBottom: '4px' }}>
                      ARS: ${formatCompactNumber(month.data.ARS)}
                    </div>
                    <div style={{ color: '#1890ff' }}>
                      USD: ${formatCompactNumber(month.data.USD)}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', fontSize: '12px' }}>
                      Total: ${formatCompactNumber(month.total)}
                    </div>
                  </div>
                }
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => onMonthClick(month.key)}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${height}px`,
                      background: isSelected 
                        ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                        : 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
                      borderRadius: '8px 8px 0 0',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      boxShadow: isSelected 
                        ? '0 4px 12px rgba(24, 144, 255, 0.4)'
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                      border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
                    }}
                  >
                    {height > 30 && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '600',
                        textAlign: 'center',
                        opacity: 0.8,
                      }}>
                        ${formatCompactNumber(month.total)}
                      </div>
                    )}
                  </div>
                  <div style={{
                    marginTop: '8px',
                    color: isSelected ? '#1890ff' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    transition: 'color 0.3s ease',
                  }}>
                    {month.name}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
        
        {/* Summary */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                {t('userProfile.dashboard.monthlyTimeline.summary')}
              </span>
            </div>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              {currentYear}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                {t('userProfile.dashboard.monthlyTimeline.totalExpenses')}
              </div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
                ${formatCompactNumber(maxTotal)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                {t('userProfile.dashboard.monthlyTimeline.averageMonthly')}
              </div>
              <div style={{ color: 'rgb(16, 185, 129)', fontSize: '16px', fontWeight: '600' }}>
                ${formatCompactNumber(maxTotal / 12)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MiniMonthlyTimeline; 