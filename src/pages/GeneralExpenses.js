import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin, Row, Col, Select } from 'antd';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ExpensesPage.css'

const { Option } = Select;

const GeneralExpenses = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

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

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
  };

  const getCurrentMonthYear = () => {
    const date = new Date();
    const month = format(date, 'MMMM', { locale: es });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  useEffect(() => {
    const currentMonthYear = getCurrentMonthYear();
    if (expenses.some(expense => `${format(new Date(expense.timestamp.seconds * 1000), 'MMMM', { locale: es })} ${expense.year}` === currentMonthYear)) {
      setSelectedMonth(currentMonthYear);
    }
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return [];
    const [month, year] = selectedMonth.split(' ');
    return expenses.filter(expense => format(new Date(expense.timestamp.seconds * 1000), 'MMMM', { locale: es }) === month && expense.year === parseInt(year, 10));
  }, [selectedMonth, expenses]);

  const calculateMonthlyTotals = (expenses) => {
    const monthlyData = {};

    expenses.forEach((expense) => {
      const category = expense.category || 'Uncategorized';
      const amount = parseFloat(expense.amount);
      const currency = expense.currency || 'USD';

      if (!monthlyData[category]) {
        monthlyData[category] = { amountPesos: 0, amountDollars: 0 };
      }

      if (currency === 'ARS') {
        monthlyData[category].amountPesos += amount;
      } else if (currency === 'USD') {
        monthlyData[category].amountDollars += amount;
      }
    });

    return monthlyData;
  };

  const monthlyData = useMemo(() => calculateMonthlyTotals(filteredExpenses), [filteredExpenses]);

  const generateColumns = () => [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '60%',
      ellipsis: true, // Truncate text in mobile view
    },
    {
      title: 'Total (Pesos)',
      dataIndex: 'totalPesos',
      key: 'totalPesos',
      width: '20%',
      render: (text) => text ? `$${parseFloat(text).toFixed(2)}` : '$0.00',
    },
    {
      title: 'Total (Dollars)',
      dataIndex: 'totalDollars',
      key: 'totalDollars',
      width: '20%',
      render: (text) => text ? `USD${parseFloat(text).toFixed(2)}` : 'USD0.00',
    },
  ];

  const columns = generateColumns();

  const dataSource = Object.entries(monthlyData).map(([category, totals]) => ({
    category,
    totalPesos: totals.amountPesos,
    totalDollars: totals.amountDollars
  }));

  const getSortedMonths = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const sortedMonths = Array.from(new Set(expenses.map(expense => `${format(new Date(expense.timestamp.seconds * 1000), 'MMMM', { locale: es })} ${expense.year}`)))
      .sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${yearA}-${monthNames.indexOf(monthA) + 1}-01`);
        const dateB = new Date(`${yearB}-${monthNames.indexOf(monthB) + 1}-01`);
        return dateB - dateA;
      });

    return sortedMonths;
  };

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
      <Select
        style={{ width: 200, marginBottom: 16 }}
        placeholder="Select Month"
        value={selectedMonth}
        onChange={handleMonthChange}
      >
        {getSortedMonths().map(month => (
          <Option key={month} value={month}>{month}</Option>
        ))}
      </Select>
      {selectedMonth && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <h2>{selectedMonth}</h2>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              rowKey="category"
              scroll={{ x: true }} // Enable horizontal scrolling in mobile view
              summary={pageData => {
                const totalPesos = pageData.reduce((sum, record) => sum + (parseFloat(record.totalPesos) || 0), 0);
                const totalDollars = pageData.reduce((sum, record) => sum + (parseFloat(record.totalDollars) || 0), 0);

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ backgroundColor: '#e6f7ff', fontWeight: 'bold', borderTop: '2px solid #1890ff' }}>
                      <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        ${totalPesos.toFixed(2)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        USD {totalDollars.toFixed(2)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default GeneralExpenses;
