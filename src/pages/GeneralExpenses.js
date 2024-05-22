import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin } from 'antd';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const GeneralExpenses = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const q = query(expensesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const calculateMonthlyTotals = (expenses) => {
    const monthlyData = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.timestamp.seconds * 1000);
      const month = date.toLocaleString('default', { month: 'long' });
      const category = expense.category || 'Uncategorized';
      const amount = parseFloat(expense.amount);
      const currency = expense.currency || 'USD'; // Asumimos 'USD' si no se especifica la moneda

      if (!monthlyData[month]) {
        monthlyData[month] = { month, expenses: {}, totalPesos: 0, totalDollars: 0 };
      }

      if (!monthlyData[month].expenses[category]) {
        monthlyData[month].expenses[category] = { amountPesos: 0, amountDollars: 0 };
      }

      if (currency === 'ARS') {
        monthlyData[month].expenses[category].amountPesos += amount;
        monthlyData[month].totalPesos += amount;
      } else if (currency === 'USD') {
        monthlyData[month].expenses[category].amountDollars += amount;
        monthlyData[month].totalDollars += amount;
      }
    });

    return Object.values(monthlyData).map(monthData => {
      const row = { month: monthData.month, totalPesos: monthData.totalPesos, totalDollars: monthData.totalDollars };
      Object.entries(monthData.expenses).forEach(([category, totals]) => {
        if (totals.amountPesos > 0) {
          row[`${category} (Pesos)`] = `$${totals.amountPesos.toFixed(2)}`;
        }
        if (totals.amountDollars > 0) {
          row[`${category} (Dollars)`] = `USD${totals.amountDollars.toFixed(2)}`;
        }
      });
      return row;
    });
  };

  const data = useMemo(() => calculateMonthlyTotals(expenses), [expenses]);

  const columns = useMemo(() => {
    const sampleRow = data[0] || {};
    const dynamicColumns = Object.keys(sampleRow)
      .filter(key => key !== 'month' && key !== 'totalPesos' && key !== 'totalDollars')
      .map(category => ({
        title: category,
        dataIndex: category,
        key: category,
      }));

    return [
      {
        title: 'Month',
        dataIndex: 'month',
        key: 'month',
      },
      ...dynamicColumns,
      {
        title: 'Total (Pesos)',
        dataIndex: 'totalPesos',
        key: 'totalPesos',
        render: (text) => `$${parseFloat(text).toFixed(2)}`,
      },
      {
        title: 'Total (Dollars)',
        dataIndex: 'totalDollars',
        key: 'totalDollars',
        render: (text) => `USD${parseFloat(text).toFixed(2)}`,
      },
    ];
  }, [data]);

  if (loading) {
    return (
        <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
    </Spin>
    );
  }

  return (
    <div>
      <h1>General Expenses</h1>
      <Table dataSource={data} columns={columns} pagination={false} rowKey="month" />
    </div>
  );
};

export default GeneralExpenses;
