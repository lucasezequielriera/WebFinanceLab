import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Table, notification, Popconfirm, Tag, Row, Col, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { doc, deleteDoc } from 'firebase/firestore';
import { parse } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ExpensesPage.css';

const MonthlyExpensesPage = () => {
  const { currentUser } = useAuth();
  const { month } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const parsedDate = parse(month, 'MMMM yyyy', new Date(), { locale: es });
    const monthIndex = parsedDate.getMonth();
    const year = parsedDate.getFullYear();
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 1);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date value');
      return;
    }

    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    const q = query(expensesRef, where('timestamp', '>=', startTimestamp), where('timestamp', '<', endTimestamp));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, month]);

  const handleDelete = async (key) => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/expenses`, key.id));
      notification.success({
        message: 'Expense Deleted',
        description: 'The expense has been successfully deleted.',
      });
    } catch (err) {
      console.error('Error deleting document: ', err);
      notification.error({
        message: 'Error',
        description: 'There was an error deleting the expense. Please try again.',
      });
    }
  };

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '50%',
      ellipsis: true, // Truncate text in mobile view
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      render: (text, record) => {
        const amount = Number(text);
        return record.currency === 'ARS' ? `$${amount.toFixed(2)}` : `USD${amount.toFixed(2)}`;
      },
      // responsive: ['sm'], // Hide column in extra-small view
    },
    // {
    //   title: 'Currency',
    //   dataIndex: 'currency',
    //   key: 'currency',
    //   width: '5%',
    //   responsive: ['sm'], // Hide column in extra-small view
    // },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      // responsive: ['md'], // Hide column in small and extra-small view
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '10%',
      render: (text) => new Date(text.seconds * 1000).toLocaleDateString(),
      responsive: ['md'], // Hide column in small and extra-small view
    },
    {
      title: 'Action',
      key: 'action',
      width: '5%',
      render: (_, record) =>
        record.id !== 'total' && expenses.length >= 1 ? (
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record)}>
            <Tag type="link" color="red" style={{ cursor: 'pointer' }}>Delete</Tag>
          </Popconfirm>
        ) : null,
    },
  ];

  const groupedExpenses = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {});

  if (loading) {
    return (
      <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
      </Spin>
    );
  }

  return (
    <div>
      <Button type="primary" onClick={() => navigate('/detailed-expenses')} style={{ marginBottom: '16px' }}>
        Volver
      </Button>
      <h1>Expenses for {month}</h1>
      <Row gutter={[16, 16]}>
        {Object.entries(groupedExpenses).map(([category, expenses], index) => {
          const totalPesos = expenses
            .filter(expense => expense.currency === 'ARS')
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
          const totalDollars = expenses
            .filter(expense => expense.currency === 'USD')
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

          return (
            <Col xs={24} md={12} key={category}>
              <h2>{category}</h2>
              <Table
                bordered
                dataSource={expenses}
                columns={columns}
                pagination={{ pageSize: 5 }}
                rowKey="id"
                scroll={{ x: true }} // Enable horizontal scrolling in mobile view
              />
              <div style={{ fontWeight: 'bold', borderTop: '1px solid #1890ff', padding: '10px', backgroundColor: '#e6f7ff' }}>
                <div style={{ display: 'flex', flexFlow: 'column' }}>
                  <p style={{ marginBottom: '5px' }}>Total in Pesos: ${totalPesos.toFixed(2)}</p>
                  <p style={{ margin: 0 }}>Total in Dollars: USD{totalDollars.toFixed(2)}</p>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default MonthlyExpensesPage;
