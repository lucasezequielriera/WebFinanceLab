import React from 'react';
import { Table, Popconfirm, notification, Tag, Row, Col } from 'antd';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ExpenseList.css';

const DetailedExpensesList = ({ expenses }) => {
  const { currentUser } = useAuth();

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
      render: (text, record) =>
        record.id === 'total' ? (
          <b>{text}</b>
        ) : (
          text
        ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      render: (text, record) => {
        const amount = Number(text);
        return record.id === 'total' ? (
          <b>{`$${amount.toFixed(2)}`}</b>
        ) : (
          `$${amount.toFixed(2)}`
        );
      },
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: '5%',
      render: (text, record) => (record.id === 'total' ? null : text),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      render: (text, record) => (record.id === 'total' ? null : text),
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '10%',
      render: (text, record) => (record.id === 'total' ? null : new Date(text.seconds * 1000).toLocaleDateString()),
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

  const dataSource = Object.entries(groupedExpenses).map(([category, expenses], index) => {
    const totalPesos = expenses
      .filter(expense => expense.currency === 'ARS')
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const totalDollars = expenses
      .filter(expense => expense.currency === 'USD')
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

    return {
      key: index,
      category,
      expenses,
      totalPesos,
      totalDollars,
    };
  });

  return (
    <div className="expense-list">
      <Row gutter={[16, 16]}>
        {dataSource.map(({ category, expenses, totalPesos, totalDollars }, index) => (
          <Col span={12} key={category}>
            <h2>{category}</h2>
            hola
            <Table
              className="custom-table"
              bordered
              dataSource={expenses}
              columns={columns}
              rowClassName={(record) => (record.id === 'total' ? 'total-row' : '')}
              pagination={{ pageSize: 4 }}
              rowKey="id"
              locale={{
                emptyText: 'No Data',
              }}
            />
            <div style={{ marginTop: 10, fontWeight: 'bold', borderTop: '2px solid #1890ff', padding: '10px', backgroundColor: '#e6f7ff' }}>
              Total in Pesos: ${totalPesos.toFixed(2)} <br />
              Total in Dollars: USD{totalDollars.toFixed(2)}
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DetailedExpensesList;
