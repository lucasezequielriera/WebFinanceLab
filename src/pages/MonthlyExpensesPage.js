import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Table, notification, Popconfirm, Tag, Row, Col, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { doc, deleteDoc } from 'firebase/firestore';

const monthMap = {
  'enero': 0,
  'febrero': 1,
  'marzo': 2,
  'abril': 3,
  'mayo': 4,
  'junio': 5,
  'julio': 6,
  'agosto': 7,
  'septiembre': 8,
  'octubre': 9,
  'noviembre': 10,
  'diciembre': 11
};

const MonthlyExpensesPage = () => {
  const { currentUser } = useAuth();
  const { month } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const [monthName, year] = month.split(' de ');
    const monthIndex = monthMap[monthName.toLowerCase()];
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
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      render: (text) => `$${Number(text).toFixed(2)}`,
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: '5%',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '10%',
      render: (text) => new Date(text.seconds * 1000).toLocaleDateString(),
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
        {Object.entries(groupedExpenses).map(([category, expenses], index) => (
          <Col span={12} key={category}>
            <h2>{category}</h2>
            <Table
              bordered
              dataSource={expenses}
              columns={columns}
              pagination={{ pageSize: 5 }}
              rowKey="id"
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MonthlyExpensesPage;
