import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const PesoExpenseCounter = ({ expenses }) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const totalExpenses = expenses
      .filter(expense => expense.currency === 'PESOS')
      .reduce((sum, expense) => sum + expense.amount, 0);
    setTotal(totalExpenses);
  }, [expenses]);

  return (
    <Card>
      <Statistic
        title="Total Expenses in PESOS"
        value={total}
        precision={2}
        valueStyle={{ color: '#cf1322' }}
        prefix={<DollarOutlined />}
        suffix="PESOS"
      />
    </Card>
  );
};

export default PesoExpenseCounter;