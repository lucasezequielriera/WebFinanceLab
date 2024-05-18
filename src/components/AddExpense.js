import React, { useState } from 'react';
import { Form, Input, Button, Select, notification, Spin } from 'antd';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const AddExpense = ({ onExpenseAdded }) => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const openNotification = () => {
    notification.success({
      message: 'Expense Added',
      description: 'Your expense has been successfully added.',
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const newExpense = {
        amount: parseFloat(values.amount),
        currency: values.currency,
        category: values.category,
        description: values.description,
        timestamp: new Date(),
      };
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/expenses`), newExpense);
      newExpense.id = docRef.id; // Agregar el id del documento al nuevo gasto
      form.resetFields();
      openNotification();
      onExpenseAdded(newExpense); // Notificar al padre sobre el nuevo gasto
    } catch (e) {
      console.error('Error adding document: ', e);
      notification.error({
        message: 'Error',
        description: 'There was an error adding your expense. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: 'Please input the amount!' }]}
        >
          <Input type="number" placeholder="Enter amount" />
        </Form.Item>

        <Form.Item
          name="currency"
          label="Currency"
          rules={[{ required: true, message: 'Please select the currency!' }]}
        >
          <Select placeholder="Select currency">
            <Option value="USD">USD</Option>
            <Option value="ARS">ARS</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: 'Please select a category!' }]}
        >
          <Select placeholder="Select category">
            <Option value="Food">Food</Option>
            <Option value="Transport">Transport</Option>
            <Option value="Utilities">Utilities</Option>
            <Option value="Entertainment">Entertainment</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please input a description!' }]}
        >
          <Input placeholder="Enter description" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Add Expense
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default AddExpense;
