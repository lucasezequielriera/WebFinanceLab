import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreditCard from '../components/CreditCard';
import { Button, Input, Form, Modal, Select } from 'antd';
import '../styles/Expenses.css'; // Asegúrate de crear este archivo para los estilos adicionales si es necesario

const { Option } = Select;

const cardColors = {
    Visa: 'linear-gradient(135deg, #1A1F71, #2E77BB)',
    MasterCard: 'linear-gradient(135deg, #ff2500, #ff9300)',
    'American Express': 'linear-gradient(135deg, #0080ff, #00d6ff)',
    Cash: '#4CAF50',
  };

const Expenses = () => {
  const [cards, setCards] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAddCard = (values) => {
    const newCard = {
      id: cards.length + 1,
      name: values.name,
      type: values.type,
      cardType: values.cardType,
      amount: values.amount,
      color: cardColors[values.cardType], // Puedes cambiar esto a cualquier color que prefieras
    };
    setCards([...cards, newCard]);
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Credit Cards</h1>
      <button className="primary-button" onClick={showModal}>
        Add Card
      </button>
      <div className="cards-container" style={{ marginTop: 24 }}>
        {cards.map((card) => (
          <div key={card.id} className="card-column">
            <div className='credit-cards-container'>
              <CreditCard card={card} />
            </div>
          </div>
        ))}
      </div>

      <Modal
        title="Add Card"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCard}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input placeholder="Enter card name" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select the type!' }]}
          >
            <Select placeholder="Select type">
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
              <Option value="Cash">Cash</Option>
            </Select>
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
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please input the amount!' }]}
          >
            <Input type="number" placeholder="Enter amount" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              Add Card
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ marginTop: 24 }}>
        <Button onClick={() => navigate('/detailed-expenses')} style={{ marginRight: 16 }}>
          Detailed Expenses
        </Button>
        <Button onClick={() => navigate('/general-expenses')}>
          General Expenses
        </Button>
      </div>
    </div>
  );
};

export default Expenses;
