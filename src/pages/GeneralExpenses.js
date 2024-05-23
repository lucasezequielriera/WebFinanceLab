import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin, Row, Col } from 'antd';
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
      const month = expense.month;
      const year = expense.year;
      const category = expense.category || 'Uncategorized';
      const amount = parseFloat(expense.amount);
      const currency = expense.currency || 'USD';

      const key = `${month} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { key, month, year, expenses: {}, totalPesos: 0, totalDollars: 0 };
      }

      if (!monthlyData[key].expenses[category]) {
        monthlyData[key].expenses[category] = { amountPesos: 0, amountDollars: 0 };
      }

      if (currency === 'ARS') {
        monthlyData[key].expenses[category].amountPesos += amount;
        monthlyData[key].totalPesos += amount;
      } else if (currency === 'USD') {
        monthlyData[key].expenses[category].amountDollars += amount;
        monthlyData[key].totalDollars += amount;
      }
    });

    return monthlyData;
  };

  const monthlyData = useMemo(() => calculateMonthlyTotals(expenses), [expenses]);

  const generateColumns = (data) => {
    const sampleRow = data[0] || {};
    const dynamicColumns = Object.keys(sampleRow)
      .filter(key => key !== 'key' && key !== 'month' && key !== 'year' && key !== 'totalPesos' && key !== 'totalDollars')
      .map(category => ({
        title: category,
        dataIndex: category,
        key: category,
      }));

    return [
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
      },
      {
        title: 'Total (Pesos)',
        dataIndex: 'totalPesos',
        key: 'totalPesos',
        render: (text) => text ? `$${parseFloat(text).toFixed(2)}` : '$0.00',
      },
      {
        title: 'Total (Dollars)',
        dataIndex: 'totalDollars',
        key: 'totalDollars',
        render: (text) => text ? `USD${parseFloat(text).toFixed(2)}` : 'USD0.00',
      },
    ];
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
      <Row gutter={[16, 16]}>
        {Object.entries(monthlyData).map(([key, data]) => {
          const columns = generateColumns([data]);
          const dataSource = Object.entries(data.expenses).map(([category, totals]) => ({
            category,
            totalPesos: totals.amountPesos,
            totalDollars: totals.amountDollars
          }));

          return (
            <Col span={24} key={key}>
              <h2>{key}</h2>
              <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                rowKey="category"
                summary={pageData => {
                  const totalPesos = pageData.reduce((sum, record) => sum + (parseFloat(record.totalPesos) || 0), 0);
                  const totalDollars = pageData.reduce((sum, record) => sum + (parseFloat(record.totalDollars) || 0), 0);

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          ${totalPesos.toFixed(2)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          USD{totalDollars.toFixed(2)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default GeneralExpenses;
