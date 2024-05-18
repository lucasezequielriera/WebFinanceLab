import React from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, Select } from 'antd';

const { Option } = Select;

const AddExpense = () => {
  const [form] = Form.useForm();
  const { currentUser } = useAuth();

  const handleSubmit = async (values) => {
    try {
      await addDoc(collection(db, `users/${currentUser.uid}/expenses`), {
        amount: parseFloat(values.amount),
        currency: values.currency,
        description: values.description,
        timestamp: new Date(),
      });
      form.resetFields();
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  return (
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
        name="currency"
        initialValue="USD"
        rules={[{ required: true, message: 'Please select the currency!' }]}
      >
        <Select>
          <Option value="USD">USD</Option>
          <Option value="PESOS">PESOS</Option>
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
        <Button type="primary" htmlType="submit">Add Expense</Button>
      </Form.Item>
    </Form>
  );
};

export default AddExpense;
