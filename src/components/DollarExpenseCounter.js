import React, { useState, useEffect } from 'react';
import { Card, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const DollarExpenseCounter = ({ expenses }) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const totalExpenses = expenses
      .filter(expense => expense.currency === 'USD')
      .reduce((sum, expense) => sum + expense.amount, 0);
    setTotal(totalExpenses);
  }, [expenses]);

  return (
    <Card>
      <Statistic
        title="Total Expenses in USD"
        value={total}
        precision={2}
        valueStyle={{ color: '#3f8600' }}
        prefix={<DollarOutlined />}
        suffix="USD"
      />
    </Card>
  );
};

export default DollarExpenseCounter;