import React, { useEffect, useState } from 'react';
import { List, Tag, Spin } from 'antd';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import dayjs from 'dayjs';
import { DollarOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

const RecentMovements = () => {
  const { currentUser } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let incomes = [];
    let expenses = [];
    let incomesLoaded = false;
    let expensesLoaded = false;

    // Incomes listener
    const unsubIncomes = onSnapshot(collection(db, `users/${currentUser.uid}/incomes`), (snapshot) => {
      incomes = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          type: 'Ingreso',
          description: d.title || d.description || '',
          amount: Number(d.amount),
          currency: d.currency || 'ARS',
          date: dayjs(d.timestamp?.seconds ? d.timestamp.seconds * 1000 : d.timestamp),
        };
      });
      incomesLoaded = true;
      if (expensesLoaded) {
        // Combinar y ordenar por fecha descendente
        const all = [...incomes, ...expenses];
        all.sort((a, b) => b.date.valueOf() - a.date.valueOf());
        setMovements(all.slice(0, 10));
        setLoading(false);
      }
    });

    // Expenses listener
    const unsubExpenses = onSnapshot(collection(db, `users/${currentUser.uid}/expenses`), (snapshot) => {
      expenses = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          type: d.fixed ? 'Gasto Fijo' : 'Gasto Diario',
          description: d.description || '',
          amount: Number(d.amount),
          currency: d.currency || 'ARS',
          date: dayjs(d.timestamp?.seconds ? d.timestamp.seconds * 1000 : d.timestamp),
        };
      });
      expensesLoaded = true;
      if (incomesLoaded) {
        // Combinar y ordenar por fecha descendente
        const all = [...incomes, ...expenses];
        all.sort((a, b) => b.date.valueOf() - a.date.valueOf());
        setMovements(all.slice(0, 10));
        setLoading(false);
      }
    });

    return () => {
      unsubIncomes();
      unsubExpenses();
    };
  }, [currentUser]);

  return (
    <Spin spinning={loading}>
      <List
        header={<b>Últimos movimientos</b>}
        itemLayout="horizontal"
        style={{ maxHeight: '100%', padding: 0, overflowY: 'auto' }}
        dataSource={movements}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={
                item.type === 'Ingreso' ? <ArrowDownOutlined style={{ color: 'rgb(0, 163, 137)', fontSize: 18 }} />
                : <ArrowUpOutlined style={{ color: item.type === 'Gasto Fijo' ? '#faad14' : 'rgb(207, 0, 0)', fontSize: 18 }} />
              }
              title={<span>{item.type} <Tag color={item.type === 'Ingreso' ? 'green' : item.type === 'Gasto Fijo' ? 'gold' : 'red'}>{item.currency}</Tag></span>}
              description={<span>{item.description || <i>Sin descripción</i>}</span>}
            />
            <div style={{ minWidth: 90, textAlign: 'right' }}>
              <b style={{ color: item.type === 'Ingreso' ? 'rgb(0, 163, 137)' : item.type === 'Gasto Fijo' ? '#faad14' : 'rgb(207, 0, 0)' }}>
                {item.type === 'Ingreso' ? '+' : '-'}${item.amount.toFixed(2)}
              </b>
              <div style={{ fontSize: 12, color: '#888' }}>{item.date.format('DD/MM/YYYY')}</div>
            </div>
          </List.Item>
        )}
      />
    </Spin>
  );
};

export default RecentMovements; 