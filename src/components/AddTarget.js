import React, { useState } from 'react';
import { Button, Modal, Form, Input, Select, DatePicker, notification } from 'antd';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const AddTarget = () => {
  const { currentUser } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAddTarget = async (values) => {
    try {
      const currentTimestamp = Timestamp.now();
      const targetTimestamp = values.date ? Timestamp.fromDate(values.date.toDate()) : null;

      const newTarget = {
        initialAmount: parseFloat(values.initialAmount),
        currentAmount: parseFloat(values.initialAmount),
        target: parseFloat(values.target),
        currency: values.currency,
        description: values.description,
        timestamp: currentTimestamp,
        deadline: targetTimestamp,
        status: parseFloat(values.initialAmount) === 0 ? 'Pending' : 'Started',
      };

      await addDoc(collection(db, `users/${currentUser.uid}/targets`), newTarget);
      form.resetFields();
      notification.success({
        message: 'Target Added',
        description: 'Your target has been successfully added.',
      });
      setIsModalVisible(false);
    } catch (e) {
      console.error('Error adding target: ', e);
      notification.error({
        message: 'Error',
        description: 'There was an error adding your target. Please try again.',
      });
    }
  };

  return (
    <div>
      <Button type="primary" onClick={showModal} style={{ marginTop: 16 }}>
        Add Target
      </Button>
      <Modal
        title="Add Target"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddTarget}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input a description!' }]}
          >
            <Input placeholder="Enter description" />
          </Form.Item>
          <Form.Item
            name="initialAmount"
            label="Initial Amount"
            rules={[{ required: true, message: 'Please input the initial amount!' }]}
            initialValue={0}
          >
            <Input type="number" placeholder="Enter initial amount" />
          </Form.Item>
          <Form.Item
            name="target"
            label="Target Amount"
            rules={[{ required: true, message: 'Please input the target amount!' }]}
          >
            <Input type="number" placeholder="Enter target amount" />
          </Form.Item>
          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true, message: 'Please select the currency!' }]}
            initialValue="ARS"
          >
            <Select placeholder="Select currency">
              <Option value="USD">USD</Option>
              <Option value="ARS">ARS</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="date"
            label="Deadline"
          >
            <DatePicker placeholder="Select deadline" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Target
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddTarget;
