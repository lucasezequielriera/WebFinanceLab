import React from 'react';
import { Table, Form, Popconfirm, notification, Tag, Row, Col } from 'antd';
import { db } from '../firebase';
import { doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import EditableCell from '../actions/EditableCell';
import '../styles/ExpenseList.css';

const ExpenseList = ({ expenses }) => {
  const [form] = Form.useForm();
  const { currentUser } = useAuth();

  const handleDelete = async (key) => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/expenses`, key.id));
      await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
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

  const handleSave = async (row) => {
    try {
      const newData = [...expenses];
      const index = newData.findIndex((item) => row.id === item.id);
      const item = newData[index];
      newData.splice(index, 1, { ...item, ...row });
      await updateDoc(doc(db, `users/${currentUser.uid}/expenses`, item.id), row);
      await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
      notification.success({
        message: 'Expense Updated',
        description: 'The expense has been successfully updated.',
      });
    } catch (err) {
      console.error('Error updating document: ', err);
      notification.error({
        message: 'Error',
        description: 'There was an error updating the expense. Please try again.',
      });
    }
  };

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '50%',
      editable: true,
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
      editable: true,
      render: (text, record) =>
        record.id === 'total' ? (
          <b>{`$${text.toFixed(2)}`}</b>
        ) : (
          typeof text === 'number' ? `$${text.toFixed(2)}` : text
        ),
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: '5%',
      editable: true,
      render: (text, record) => (record.id === 'total' ? null : text),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      editable: true,
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

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: record.id !== 'total' && col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const groupedExpenses = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {});

  const dataSource = Object.entries(groupedExpenses).map(([category, expenses], index) => ({
    key: index,
    category,
    expenses,
    total: expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
  }));

  return (
    <div className="expense-list">
      <Row gutter={[16, 16]}>
        {dataSource.map(({ category, expenses, total }, index) => (
          <Col span={12} key={category}>
            <h2>{category}</h2>
            <Form form={form} component={false}>
              <Table
                className="custom-table"
                components={{
                  body: {
                    cell: EditableCell,
                  },
                }}
                bordered
                dataSource={[
                  ...expenses,
                  {
                    id: 'total',
                    description: 'Total',
                    amount: total,
                    currency: '',
                    category: '',
                    timestamp: { seconds: 0 },
                  },
                ]}
                columns={mergedColumns}
                rowClassName={(record) => (record.id === 'total' ? 'total-row' : 'editable-row')}
                pagination={{ pageSize: 4 }}
                rowKey="id"
                locale={{
                  emptyText: 'No Data',
                }}
              />
            </Form>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ExpenseList;
