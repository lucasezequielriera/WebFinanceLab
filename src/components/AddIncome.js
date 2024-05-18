import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, Table, Select } from 'antd';

const { Option } = Select;

const AddIncome = () => {
  const [form] = Form.useForm();
  const { currentUser } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const q = query(incomesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incomesData = [];
      snapshot.forEach((doc) => {
        incomesData.push({ id: doc.id, ...doc.data() });
      });
      setIncomes(incomesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (values) => {
    try {
      await addDoc(collection(db, `users/${currentUser.uid}/incomes`), {
        amount: parseFloat(values.amount),
        month: values.month,
        description: values.description,
        timestamp: new Date(),
      });
      form.resetFields();
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const columns = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div>
      <Form form={form} onFinish={handleSubmit}>
        <Form.Item
          name="amount"
          rules={[{ required: true, message: 'Please input the amount!' }]}
        >
          <Input
            type="number"
            placeholder="Amount"
          />
        </Form.Item>
        <Form.Item
          name="month"
          rules={[{ required: true, message: 'Please select the month!' }]}
        >
          <Select placeholder="Select month">
            <Option value="January">January</Option>
            <Option value="February">February</Option>
            <Option value="March">March</Option>
            <Option value="April">April</Option>
            <Option value="May">May</Option>
            <Option value="June">June</Option>
            <Option value="July">July</Option>
            <Option value="August">August</Option>
            <Option value="September">September</Option>
            <Option value="October">October</Option>
            <Option value="November">November</Option>
            <Option value="December">December</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="description"
          rules={[{ required: true, message: 'Please input the description!' }]}
        >
          <Input
            type="text"
            placeholder="Description"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Add Income</Button>
        </Form.Item>
      </Form>
      <Table dataSource={incomes} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
};

export default AddIncome;