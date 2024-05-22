import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin } from 'antd';
import { db } from '../firebase'; // Asegúrate de importar tu configuración de Firebase
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
      const date = new Date(expense.timestamp);
      const month = date.toLocaleString('default', { month: 'long' });
      const category = expense.category || 'Uncategorized';
      const amount = parseFloat(expense.amount);

      if (!monthlyData[month]) {
        monthlyData[month] = {};
      }

      if (!monthlyData[month][category]) {
        monthlyData[month][category] = 0;
      }

      monthlyData[month][category] += amount;
    });

    const tableData = Object.keys(monthlyData).map((month) => {
      const categories = monthlyData[month];
      const total = Object.values(categories).reduce((sum, value) => sum + value, 0);
      return {
        key: month,
        month,
        ...categories,
        total,
      };
    });

    return tableData;
  };

  const data = useMemo(() => calculateMonthlyTotals(expenses), [expenses]);

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
    },
    ...Object.keys(data[0] || {}).map((category) => ({
      title: category.charAt(0).toUpperCase() + category.slice(1),
      dataIndex: category,
      key: category,
    })),
  ];

  if (loading) {
    return <Spin tip="Loading..." />;
  }

  return (
    <div>
      <h1>General Expenses</h1>
      <Table dataSource={data} columns={columns} pagination={false} />
    </div>
  );
};

export default GeneralExpenses;
