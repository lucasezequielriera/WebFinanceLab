import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card, Progress, Modal, Form, Input, Button, notification, Flex } from 'antd';
import { DeleteTwoTone, DollarTwoTone, CheckCircleTwoTone } from '@ant-design/icons';
import MonthlyChart from '../components/MonthlyChart';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import RemainingPesosCounter from '../components/RemainingPesosCounter';
import RemainingDollarsCounter from '../components/RemainingDollarsCounter';
import '../styles/Dashboard.css'; // Importa el archivo CSS para los estilos

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState([]);
  const [targets, setTargets] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!currentUser) return;

    // Obtener ingresos
    const incomesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const qIncomes = query(incomesRef);

    const unsubscribeIncomes = onSnapshot(qIncomes, (snapshot) => {
      const incomesData = [];
      snapshot.forEach((doc) => {
        incomesData.push({ id: doc.id, ...doc.data() });
      });
      setIncomes(incomesData);
      setLoading(false);
    });

    // Obtener targets
    const targetsRef = collection(db, `users/${currentUser.uid}/targets`);
    const qTargets = query(targetsRef);

    const unsubscribeTargets = onSnapshot(qTargets, (snapshot) => {
      const targetsData = [];
      snapshot.forEach((doc) => {
        targetsData.push({ id: doc.id, ...doc.data() });
      });
      setTargets(targetsData);
    });

    return () => {
      unsubscribeIncomes();
      unsubscribeTargets();
    };
  }, [currentUser]);

  const showEditModal = (target) => {
    setSelectedTarget(target);
    form.setFieldsValue({ amount: target.currentAmount });
    setIsEditModalVisible(true);
  };

  const handleCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTarget(null);
    form.resetFields();
  };

  const handleUpdateTarget = async (values) => {
    if (!selectedTarget) return;

    try {
      const newAmount = selectedTarget.currentAmount + parseFloat(values.amount);
      const status = newAmount >= selectedTarget.target ? 'Completed' : 'Started';

      const targetDocRef = doc(db, `users/${currentUser.uid}/targets`, selectedTarget.id);
      await updateDoc(targetDocRef, {
        currentAmount: newAmount,
        status: status
      });

      notification.success({
        message: 'Target Updated',
        description: 'Your target has been successfully updated.',
      });

      handleCancel();
    } catch (e) {
      console.error('Error updating target: ', e);
      notification.error({
        message: 'Error',
        description: 'There was an error updating your target. Please try again.',
      });
    }
  };

  const handleDeleteTarget = async (targetId) => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/targets`, targetId));
      notification.success({
        message: 'Target Deleted',
        description: 'Your target has been successfully deleted.',
      });
    } catch (e) {
      console.error('Error deleting target: ', e);
      notification.error({
        message: 'Error',
        description: 'There was an error deleting your target. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
      </Spin>
    );
  }

  // Ordenar targets por deadline, de menor a mayor, y luego colocar aquellos con deadline null al final
  const sortedTargets = targets.sort((a, b) => {
    console.log(a.deadline)
    console.log(b.deadline)
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (!a.deadline && !b.deadline) return 0;
    return a.deadline.toDate() - b.deadline.toDate();
  });

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Hi, {currentUser?.displayName || 'User'}!</h1>
      <Row className="expenses-counters margin-bottom-large" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <RemainingPesosCounter />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <RemainingDollarsCounter />
          </Card>
        </Col>
      </Row>
      <Row className="remainings-counters margin-bottom-large" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <PesoExpenseCounter />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="equal-height-card">
            <DollarExpenseCounter />
          </Card>
        </Col>
      </Row>
      {sortedTargets.length > 0 && <>
      <h2 style={{ fontWeight: 200 }}>Targets:</h2>
      <Row className="targets-cards margin-bottom-large" gutter={[16, 16]}>
        {sortedTargets.map((target, index) => (
          <Col xs={24} sm={24} md={12} key={index}>
            <Card className="equal-height-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2>{target.description}</h2>
                <div>
                  {target.status !== 'Completed' && 
                  <DeleteTwoTone style={{ fontSize: 20, cursor: 'pointer' }} twoToneColor="#eb2f96" onClick={() => handleDeleteTarget(target.id)} />}
                  {target.status !== 'Completed' ?
                  <DollarTwoTone style={{ fontSize: 20, marginLeft: 8, cursor: 'pointer' }} twoToneColor={target.status === 'Completed' && "#00b100"} spin={target.status === 'Pending' ? false : true} onClick={() => showEditModal(target)} /> :
                  <CheckCircleTwoTone style={{ fontSize: 20 }} twoToneColor={"#00b100"}/>}
                </div>
              </div>
              <Flex vertical>
                <Progress percent={Number((target.currentAmount / target.target * 100).toFixed(2))} status={target.status === 'Started' && "active"} showInfo={false} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{target.currentAmount} / {target.target} {target.currency}</span>
                  <span style={{ fontWeight: 600, color: target.status === 'Completed' && 'green' }}>{(target.currentAmount / target.target * 100).toFixed(2)}%</span>
                </div>
                {/* <span>Status: {target.status}</span> */}
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>
      </>}
      <Row className="dashboard-chart" gutter={[0, 0]}>
        <Col span={24}>
          <MonthlyChart incomes={incomes} />
        </Col>
      </Row>

      <Modal
        title="Add Money"
        visible={isEditModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateTarget}>
          <Form.Item
            name="amount"
            label="Add Amount"
            rules={[{ required: true, message: 'Please input the amount to add!' }]}
          >
            <Input type="number" placeholder="Enter amount" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Money
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
