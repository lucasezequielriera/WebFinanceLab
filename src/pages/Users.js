import React, { useEffect, useState } from 'react';
import { List, Typography, Spin, Avatar, Tag, Alert, Row, Col } from 'antd';
import { UserOutlined, DollarOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubUsers = null;
    let unsubMap = {};
    setLoading(true);
    setError(null);

    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();

    unsubUsers = onSnapshot(
      collection(db, 'users'),
      async (usersSnapshot) => {
        const usersList = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            ...userData,
            // El campo lastActivity ya viene del documento principal
          };
        });
        // Limpiar listeners anteriores
        Object.values(unsubMap).forEach(unsub => unsub && unsub());
        unsubMap = {};
        // Para cada usuario, escuchar gastos e ingresos en tiempo real
        usersList.forEach(user => {
          const userId = user.id;
          // Escuchar gastos
          const expensesQuery = query(
            collection(db, `users/${userId}/expenses`),
            where('timestamp', '>=', startOfMonth),
            where('timestamp', '<=', endOfMonth)
          );
          const unsubExpenses = onSnapshot(expensesQuery, expensesSnapshot => {
            // Escuchar ingresos
            const incomesQuery = query(
              collection(db, `users/${userId}/incomes`),
              where('timestamp', '>=', startOfMonth),
              where('timestamp', '<=', endOfMonth)
            );
            const unsubIncomes = onSnapshot(incomesQuery, incomesSnapshot => {
              // Calcular totales
              let totalExpensesUSD = 0;
              let totalExpensesARS = 0;
              let totalIncomesUSD = 0;
              let totalIncomesARS = 0;
              expensesSnapshot.forEach(doc => {
                const expense = doc.data();
                if (!expense || typeof expense.amount === 'undefined' || !expense.currency) return;
                const amount = parseFloat(expense.amount);
                if (isNaN(amount)) return;
                if (expense.currency === 'USD') totalExpensesUSD += amount;
                if (expense.currency === 'ARS') totalExpensesARS += amount;
              });
              incomesSnapshot.forEach(doc => {
                const income = doc.data();
                if (!income || typeof income.amount === 'undefined' || !income.currency) return;
                const amount = parseFloat(income.amount);
                if (isNaN(amount)) return;
                if (income.currency === 'USD') totalIncomesUSD += amount;
                if (income.currency === 'ARS') totalIncomesARS += amount;
              });
              // Buscar última actividad
              getLastActivity(userId).then(lastActivity => {
                setUsers(prevUsers => {
                  // Actualizar o agregar usuario
                  const filtered = prevUsers.filter(u => u.id !== userId);
                  return [
                    ...filtered,
                    {
                      ...user,
                      lastActivity,
                      totalExpensesUSD,
                      totalExpensesARS,
                      totalIncomesUSD,
                      totalIncomesARS,
                      balanceUSD: totalIncomesUSD - totalExpensesUSD,
                      balanceARS: totalIncomesARS - totalExpensesARS
                    }
                  ].sort((a, b) => {
                    if (!a.lastActivity && !b.lastActivity) return 0;
                    if (!a.lastActivity) return 1;
                    if (!b.lastActivity) return -1;
                    return b.lastActivity.toDate() - a.lastActivity.toDate();
                  });
                });
              });
            });
            unsubMap[`${userId}_incomes`] = unsubIncomes;
          });
          unsubMap[`${userId}_expenses`] = unsubExpenses;
        });
        setLoading(false);
      },
      (err) => {
        setError('No se pudieron obtener los usuarios debido a permisos insuficientes.');
        setLoading(false);
      }
    );

    return () => {
      if (unsubUsers) unsubUsers();
      Object.values(unsubMap).forEach(unsub => unsub && unsub());
    };
  }, []);

  const getLastActivity = async (userId) => {
    const collections = ['expenses', 'incomes', 'userProfile'];
    let lastActivity = null;
    for (const collectionName of collections) {
      const q = query(
        collection(db, `users/${userId}/${collectionName}`),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      // Usar getDocs aquí porque sólo queremos el último timestamp
      const snapshot = await import('firebase/firestore').then(fb => fb.getDocs(q));
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const timestamp = doc.data().timestamp;
        if (!lastActivity || timestamp > lastActivity) {
          lastActivity = timestamp;
        }
      }
    }
    return lastActivity;
  };

  const formatCurrency = (amount, currency) => {
    const safeAmount = (isNaN(amount) || typeof amount === 'undefined') ? 0 : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(safeAmount);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <div style={{ padding: 10, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      <Title level={2} style={{ fontSize: 18 }}>Usuarios <span style={{ fontSize: 14, color: '#666' }}>({users.length})</span></Title>
      <List
        dataSource={users}
        renderItem={user => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={user.photoURL} icon={<UserOutlined />} />}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{`${user.firstName} ${user.lastName}`}</span>
                  {user.lastActivity ? (
                    <Tag color={
                      dayjs().diff(dayjs(user.lastActivity && user.lastActivity.toDate ? user.lastActivity.toDate() : user.lastActivity), 'minute') < 5
                        ? 'green'
                        : dayjs().diff(dayjs(user.lastActivity && user.lastActivity.toDate ? user.lastActivity.toDate() : user.lastActivity), 'hour') >= 1
                          ? 'blue'
                          : 'green'
                    }>
                      {dayjs().diff(dayjs(user.lastActivity && user.lastActivity.toDate ? user.lastActivity.toDate() : user.lastActivity), 'minute') < 5
                        ? 'Activo ahora'
                        : `Última actividad: ${dayjs(user.lastActivity && user.lastActivity.toDate ? user.lastActivity.toDate() : user.lastActivity).fromNow()}`}
                    </Tag>
                  ) : (
                    <Tag color="default">Usuario Nuevo</Tag>
                  )}
                </div>
              }
              description={
                <div>
                  <div>{user.email}</div>
                  <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
                    <Col span={8}>
                      <div>
                        <Text type="secondary" style={{ fontWeight: 'bold' }}>Ingresos:</Text>
                        <div>
                          <DollarOutlined style={{ color: '#1890ff' }} /> {formatCurrency(user.totalIncomesUSD || 0, 'USD')}
                        </div>
                        <div>
                          <DollarOutlined style={{ color: '#1890ff' }} /> {formatCurrency(user.totalIncomesARS || 0, 'ARS')}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text type="secondary" style={{ fontWeight: 'bold' }}>Gastos:</Text>
                        <div>
                          <DollarOutlined style={{ color: '#52c41a' }} /> {formatCurrency(user.totalExpensesUSD || 0, 'USD')}
                        </div>
                        <div>
                          <DollarOutlined style={{ color: '#52c41a' }} /> {formatCurrency(user.totalExpensesARS || 0, 'ARS')}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text type="secondary" style={{ fontWeight: 'bold' }}>Balance:</Text>
                        <div>
                          <DollarOutlined style={{ color: (user.balanceUSD || 0) >= 0 ? '#52c41a' : '#ff4d4f' }} /> {formatCurrency(user.balanceUSD || 0, 'USD')}
                        </div>
                        <div>
                          <DollarOutlined style={{ color: (user.balanceARS || 0) >= 0 ? '#52c41a' : '#ff4d4f' }} /> {formatCurrency(user.balanceARS || 0, 'ARS')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default Users; 