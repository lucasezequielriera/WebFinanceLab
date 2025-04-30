import React, { useState, useEffect } from 'react';
import { Spin, Row, Col, Card, Progress, Modal, Form, Input, Button, notification, Flex } from 'antd';
import { DeleteTwoTone, DollarTwoTone, CheckCircleTwoTone } from '@ant-design/icons';
import PesoIncomeCounter from '../components/PesoIncomeCounter';
import DollarIncomeCounter from '../components/DollarIncomeCounter';
import DollarExpenseCounter from '../components/DollarExpenseCounter';
import PesoExpenseCounter from '../components/PesoExpenseCounter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import RemainingPesosCounter from '../components/RemainingPesosCounter';
import RemainingDollarsCounter from '../components/RemainingDollarsCounter';
import DailyExpensesChart from '../components/DailyExpensesChart';
import { useTranslation } from 'react-i18next';
import '../styles/Dashboard.css'; // Importa el archivo CSS para los estilos

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [form] = Form.useForm();
  const [userInfo, setUserInfo] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [userData, setUserData] = useState();
  const [hasPesosIncome, setHasPesosIncome] = useState(false);
  const [hasUsdIncome, setHasUsdIncome]     = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
  
    const fetchUserData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log(userData)
  
          if (!isMounted) return;
  
          setUserData(data);
        }
      }
    };
  
    fetchUserData();
  
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
  
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const targetsRef = collection(db, `users/${currentUser.uid}/targets`);
    const qExpenses = query(expensesRef);
    const qTargets = query(targetsRef);
  
    // Snapshot listeners
    const unsubscribeIncomes = onSnapshot(qExpenses, (snapshot) => {
      const expenses = [];
      snapshot.forEach((doc) => {
        expenses.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expenses);
    });
  
    const unsubscribeTargets = onSnapshot(qTargets, (snapshot) => {
      const targetsData = [];
      snapshot.forEach((doc) => {
        targetsData.push({ id: doc.id, ...doc.data() });
      });
      setTargets(getSortedTargets(targetsData));
    });
  
    const fetchUserInfo = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserInfo(userDoc.data());
      }
    };
  
    // 🔁 Ejecutar todo en paralelo y esperar que termine
    Promise.allSettled([
      fetchUserInfo()
      // Acá podrías agregar más fetchs en el futuro si los necesitás
    ])
    .finally(() => {
      setLoading(false); // ✅ se apaga el loading solo cuando TODO terminó (con éxito o no)
    });
  
    return () => {
      unsubscribeIncomes();
      unsubscribeTargets();
    };
  }, [currentUser]);  
  
  useEffect(() => {
    if (!currentUser) return;
    const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
    const unsub = onSnapshot(incomesRef, snap => {
      const currencies = snap.docs.map(d => d.data().currency);
      setHasPesosIncome(currencies.includes('ARS'));
      setHasUsdIncome(currencies.includes('USD'));
    });
    return () => unsub();
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

      // Forzar reordenamiento de los targets
      const updatedTargets = targets.map(t => t.id === selectedTarget.id ? { ...t, currentAmount: newAmount, status } : t);
      setTargets(getSortedTargets(updatedTargets));

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

      // Actualizar y ordenar los targets después de la eliminación
      const updatedTargets = targets.filter(t => t.id !== targetId);
      setTargets(getSortedTargets(updatedTargets));
    } catch (e) {
      console.error('Error deleting target: ', e);
      notification.error({
        message: 'Error',
        description: 'There was an error deleting your target. Please try again.',
      });
    }
  };

  const getSortedTargets = (targets) => {
    const withDeadline = targets.filter(target => target.deadline && target.status !== 'Completed');
    const withoutDeadline = targets.filter(target => !target.deadline && target.status !== 'Completed');
    const completedTargets = targets.filter(target => target.status === 'Completed');

    withDeadline.sort((a, b) => a.deadline.toDate() - b.deadline.toDate());
    withoutDeadline.sort((a, b) => a.currentAmount / a.target - b.currentAmount / b.target);

    return [...withDeadline, ...withoutDeadline, ...completedTargets];
  };
console.log(userData)
  return (
    <div className='container-page'>
      <Spin spinning={loading}>
        <div className="dashboard-container margin-top-small">

          {/* CARDS */}
          {hasPesosIncome && (
            <Row className="expenses-counters margin-bottom-medium" gutter={[16, 16]}>
              <Col xs={24} sm={24} md={24} lg={8}>
                <Card className="equal-height-card balance-counter">
                  <RemainingPesosCounter />
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={8}>
                <Card className="equal-height-card">
                  <PesoIncomeCounter />
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={8}>
                <Card className="equal-height-card">
                  <PesoExpenseCounter />
                </Card>
              </Col>
            </Row>
          )}
          {hasUsdIncome && (
            <Row className="remainings-counters margin-bottom-medium" gutter={[16, 16]}>
              <Col xs={24} sm={24} md={24} lg={8}>
                <Card className="equal-height-card balance-counter">
                  <RemainingDollarsCounter />
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={8}>
                <Card className="equal-height-card">
                  <DollarIncomeCounter />
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={8}>
                <Card className="equal-height-card">
                  <DollarExpenseCounter />
                </Card>
              </Col>
            </Row>
          )}

          {targets.length > 0 && (
            <>
              <h2 style={{ fontWeight: 200 }}>Targets:</h2>
              <Row className="targets-cards margin-bottom-large" gutter={[16, 16]}>
                {targets.map((target, index) => (
                  <Col xs={24} sm={24} md={12} key={index}>
                    <Card className="equal-height-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <h2>{target.description}</h2>
                        <div>
                          {target.status !== 'Completed' && (
                            <DeleteTwoTone
                              style={{ fontSize: 20, cursor: 'pointer' }}
                              twoToneColor="#eb2f96"
                              onClick={() => handleDeleteTarget(target.id)}
                            />
                          )}
                          {target.status !== 'Completed' ? (
                            <DollarTwoTone
                              style={{ fontSize: 20, marginLeft: 8, cursor: 'pointer' }}
                              twoToneColor={target.status === 'Completed' && "#00b100"}
                              spin={target.status === 'Pending' ? false : true}
                              onClick={() => showEditModal(target)}
                            />
                          ) : (
                            <CheckCircleTwoTone style={{ fontSize: 20 }} twoToneColor={"#00b100"} />
                          )}
                        </div>
                      </div>
                      <Flex vertical>
                        <Progress
                          percent={Number((target.currentAmount / target.target * 100).toFixed(2))}
                          status={target.status === 'Started' && "active"}
                          showInfo={false}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{target.currentAmount} / {target.target} {target.currency}</span>
                          <span style={{ fontWeight: 600, color: target.status === 'Completed' && 'green' }}>
                            {(target.currentAmount / target.target * 100).toFixed(2)}%
                          </span>
                        </div>
                        {/* <span>Status: {target.status}</span> */}
                      </Flex>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          { currentUser && (
          <Row className="dashboard-chart" gutter={[12, 12]} style={{ marginTop: 0, marginBottom: 30, marginRight: 0, marginLeft: 0 }}>
            <Col span={24} style={{ padding: 0 }}>
              <Card>
                <DailyExpensesChart userId={currentUser?.uid} />
              </Card>
            </Col>
          </Row>
          )}

          <Modal
            title="Add Money"
            open={isEditModalVisible}
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
      </Spin>
    </div>
  );
};

export default Dashboard;
