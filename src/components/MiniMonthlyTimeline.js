import React from 'react';
import { Tooltip, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import '../styles/MiniMonthlyTimeline.css';

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
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('userProfile.dashboard.monthlyTimeline.noData')}
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div className="mini-timeline-container">
      <div className="timeline-bars">
        {months.map(month => {
          const height = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0;
          const isSelected = selectedMonth === month.key;
          
          return (
            <Tooltip
              key={month.key}
              title={
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {month.name}
                  </div>
                  <div>ARS: ${month.data.ARS.toLocaleString()}</div>
                  <div>USD: ${month.data.USD.toLocaleString()}</div>
                </div>
              }
            >
              <div
                className={`timeline-bar ${isSelected ? 'selected' : ''}`}
                style={{ height: `${height}%` }}
                onClick={() => onMonthClick(month.key)}
              >
                <div className="bar-label">{month.name}</div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default MiniMonthlyTimeline; 