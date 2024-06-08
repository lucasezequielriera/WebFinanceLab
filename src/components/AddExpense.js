import React, { useState } from 'react';
import { Form, Input, Button, Select, notification, Spin, Typography, Row, Col } from 'antd';
import { DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AddExpense.css';

const { Option } = Select;
const { Title, Paragraph } = Typography;

const AddExpense = ({ onExpenseAdded }) => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const openNotification = () => {
    notification.success({
      message: 'Expense Added',
      description: 'Your expense has been successfully added.',
    });
  };

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const timestamp = Timestamp.now();
      const date = timestamp.toDate();
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const newExpense = {
        amount: parseFloat(values.amount).toFixed(2),
        currency: values.currency,
        category: values.category,
        description: values.description,
        paymentMethod: values.paymentMethod,
        bank: values.bank || 'N/A',
        cardType: values.cardType || 'N/A',
        timestamp: timestamp,
        day: day,
        month: month,
        year: year,
      };

      // Agregar el gasto
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/expenses`), newExpense);
      newExpense.id = docRef.id;

      form.resetFields();
      openNotification();
      onExpenseAdded(newExpense);
      console.log(newExpense);
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
      <div className="add-expense-container">
        <Title level={2} className="add-expense-title">Add New Expense</Title>
        <Paragraph className="add-expense-description">
          Fill out the form below to add a new expense to your account.
        </Paragraph>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please input the amount!' }]}
              >
                <Input type="number" placeholder="Enter amount" prefix={<DollarOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Please select the currency!' }]}
                initialValue="ARS"
              >
                <Select placeholder="Select currency">
                  <Option value="ARS">ARS</Option>
                  <Option value="USD">USD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category!' }]}
          >
            <Select placeholder="Select category">
              <Option value="Apartment">Apartment</Option>
              <Option value="House Services">House Services</Option>
              <Option value="University">University</Option>
              <Option value="Gym">Gym</Option>
              <Option value="Streaming & Apps">Streaming & Apps</Option>
              <Option value="PedidosYa">PedidosYa</Option>
              <Option value="Supermarket">Supermarket</Option>
              <Option value="Food with Friends">Food with Friends</Option>
              <Option value="Food">Food</Option>
              <Option value="Transport">Transport</Option>
              <Option value="Entertainment">Entertainment</Option>
              <Option value="Stocks">Stocks</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input a description!' }]}
          >
            <Input placeholder="Enter description" prefix={<FileTextOutlined />} />
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select the payment method!' }]}
          >
            <Select placeholder="Select payment method" onChange={handlePaymentMethodChange}>
              <Option value="Cash">Cash</Option>
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
            </Select>
          </Form.Item>
          {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
            <>
              <Form.Item
                name="bank"
                label="Bank"
                rules={[{ required: true, message: 'Please input the bank!' }]}
              >
                <Input placeholder="Enter your bank" prefix={<FileTextOutlined />} />
              </Form.Item>
              <Form.Item
                name="cardType"
                label="Card Type"
                rules={[{ required: true, message: 'Please select the card type!' }]}
              >
                <Select placeholder="Select card type">
                  <Option value="Visa">Visa</Option>
                  <Option value="MasterCard">MasterCard</Option>
                  <Option value="American Express">American Express</Option>
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" className="add-expense-button">
              Add Expense
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Spin>
  );
};

export default AddExpense;