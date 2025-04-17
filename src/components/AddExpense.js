import React, { useState } from 'react';
import { Form, Input, Button, Select, notification, Spin, Typography, Row, Col, Card, DatePicker } from 'antd';
import { DollarOutlined, FileTextOutlined, BankOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import '../styles/AddExpense.css';

const { Option } = Select;
const { Title, Paragraph   } = Typography;

const AddExpense = ({ onExpenseAdded }) => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const { t } = useTranslation();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const selectedDate = values.date ? values.date.toDate() : new Date();
      const timestamp = Timestamp.fromDate(selectedDate);
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
        timestamp,
        day,
        month,
        year,
      };

      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/expenses`), newExpense);
      newExpense.id = docRef.id;

      form.resetFields();
      setPaymentMethod(null);
      notification.success({
        message: 'Gasto añadido',
        description: 'Tu gasto fue registrado exitosamente.',
      });
      onExpenseAdded(newExpense);
    } catch (e) {
      console.error('Error adding document: ', e);
      notification.error({
        message: 'Error',
        description: 'No se pudo registrar el gasto. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Card style={{ borderRadius: 12 }} className='add-expense-modal'>
        <Title level={3} style={{ marginBottom: 8, textAlign: 'center' }}>{t('userProfile.addNewExpense.title')}</Title>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
        {t('userProfile.addNewExpense.subtitle')}
        </Paragraph>

        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="amount"
                label={t('userProfile.addNewExpense.amount')} rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.amountRequired') }]}>
                <Input type="number" prefix={<DollarOutlined />} placeholder="125.50" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="currency" label={t('userProfile.addNewExpense.currency')} initialValue="ARS" rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.currencyRequired') }]}>
                <Select>
                  <Option value="ARS">ARS</Option>
                  <Option value="USD">USD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="category" label={t('userProfile.addNewExpense.category')} rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.categoryRequired') }]}>
                <Select placeholder="Select category">
                  <Option value="Apartment">Apartment</Option>
                  <Option value="Food">Food</Option>
                  <Option value="Transport">Transport</Option>
                  <Option value="Entertainment">Entertainment</Option>
                  <Option value="Gym">Gym</Option>
                  <Option value="Supermarket">Supermarket</Option>
                  <Option value="PedidosYa">PedidosYa</Option>
                  <Option value="Streaming & Apps">Streaming & Apps</Option>
                  <Option value="House Services">House Services</Option>
                  <Option value="University">University</Option>
                  <Option value="Food with Friends">Food with Friends</Option>
                  <Option value="Stocks">Stocks</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="date"
                label={t('userProfile.addNewExpense.date')} 
                placeholder="Hoy"
                initialValue={dayjs()}
                rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.dateRequired') }]}>
                <DatePicker style={{ width: '100%' }} format={(value) =>
                  dayjs().isSame(value, 'day') ? t('userProfile.addNewExpense.defaultDataInputDate') : value.format('DD/MM/YYYY')
                } />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={t('userProfile.addNewExpense.description')} rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.descriptionRequired') }]}>
            <Input prefix={<FileTextOutlined />} placeholder="Uber to work" />
          </Form.Item>

          <Form.Item name="paymentMethod" label={t('userProfile.addNewExpense.paymentMethod')} rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.paymentMethodRequired') }]}>
            <Select onChange={setPaymentMethod} placeholder="Select payment method">
              <Option value="Cash">Cash</Option>
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
            </Select>
          </Form.Item>

          {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="bank" label={t('userProfile.addNewExpense.bank')} rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.bankRequired') }]}>
                    <Input prefix={<BankOutlined />} placeholder="BBVA, Santander" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="cardType" label={t('userProfile.addNewExpense.cardType')} rules={[{ required: true, message: t('userProfile.addNewExpense.errorMessages.cardTypeRequired') }]}>
                    <Select placeholder="Visa, MasterCard">
                      <Option value="Visa">Visa</Option>
                      <Option value="MasterCard">MasterCard</Option>
                      <Option value="American Express">American Express</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Button type="primary" htmlType="submit" size="large" block style={{ marginTop: 10 }}>
          {t('userProfile.addNewExpense.addExpenseButton')}
          </Button>
        </Form>
      </Card>
    </Spin>
  );
};

export default AddExpense;
