import React, { useEffect, useState } from 'react';
import { List, Tag, Spin, Typography } from 'antd';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';
import { DollarOutlined, ArrowDownOutlined, ArrowUpOutlined, CreditCardOutlined } from '@ant-design/icons';

const { Title } = Typography;

function groupByDay(movements) {
  return movements.reduce((acc, mov) => {
    const day = mov.date.format('YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(mov);
    return acc;
  }, {});
}

function getDayLabel(date) {
  const today = dayjs().startOf('day');
  const d = dayjs(date).startOf('day');
  if (d.isSame(today)) return 'Hoy';
  if (d.isSame(today.subtract(1, 'day'))) return 'Ayer';
  return d.format('dddd DD/MM/YYYY');
}

const RecentMovements = () => {
  const { currentUser } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let incomes = [];
    let expenses = [];
    let monthlyPayments = [];
    let incomesLoaded = false;
    let expensesLoaded = false;
    let paymentsLoaded = false;

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
      if (expensesLoaded && paymentsLoaded) {
        combineAndSet();
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
      if (incomesLoaded && paymentsLoaded) {
        combineAndSet();
      }
    });

    // MonthlyPayments (pagos fijos del mes actual) - ahora en tiempo real
    const monthKey = dayjs().format('YYYY-MM');
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
    const unsubPayments = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const payments = snap.data().payments || [];
        monthlyPayments = payments.map(p => {
          let date = null;
          if (p.timestamp && p.timestamp.seconds) {
            date = dayjs(p.timestamp.seconds * 1000);
          } else if (p.createdAt) {
            date = dayjs(p.createdAt);
            if (!date.isValid()) {
              console.log('[RecentMovements] Fecha inválida en createdAt, usando hoy:', p.createdAt);
              date = dayjs();
            }
          } else {
            date = dayjs();
          }
          return {
            type: 'Pago Fijo',
            description: p.description || p.title || p.bank || '',
            amount: Number(p.amountARS) > 0 ? Number(p.amountARS) : Number(p.amountUSD),
            currency: Number(p.amountARS) > 0 ? 'ARS' : 'USD',
            date,
          };
        });
      } else {
        monthlyPayments = [];
      }
      paymentsLoaded = true;
      if (incomesLoaded && expensesLoaded) {
        combineAndSet();
      }
    });

    function combineAndSet() {
      const all = [...incomes, ...expenses, ...monthlyPayments];
      all.sort((a, b) => b.date.valueOf() - a.date.valueOf());
      setMovements(all.slice(0, 10));
      setLoading(false);
    }

    return () => {
      unsubIncomes();
      unsubExpenses();
      unsubPayments();
    };
  }, [currentUser]);

  // Agrupar por día
  const grouped = groupByDay(movements);
  const days = Object.keys(grouped).sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());

  return (
    <Spin spinning={loading}>
      <div style={{ maxHeight: '100%', padding: 0, overflowY: 'auto' }}>
        <p style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600 }}>Últimos movimientos</p>
        {days.map(day => (
          <div key={day}>
            <Title level={5} style={{ margin: '12px 0 4px 0', color: '#888', fontWeight: 600, fontSize: 15 }}>{getDayLabel(day)}</Title>
            <List
              itemLayout="horizontal"
              dataSource={grouped[day]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.type === 'Ingreso' ? <ArrowDownOutlined style={{ color: 'rgb(0, 163, 137)', fontSize: 18 }} />
                      : item.type === 'Pago Fijo' ? <CreditCardOutlined style={{ color: '#0071de', fontSize: 18 }} />
                      : <ArrowUpOutlined style={{ color: item.type === 'Gasto Fijo' ? '#faad14' : 'rgb(207, 0, 0)', fontSize: 18 }} />
                    }
                    title={<span>{item.type} <Tag color={item.type === 'Ingreso' ? 'green' : item.type === 'Pago Fijo' ? 'blue' : item.type === 'Gasto Fijo' ? 'gold' : 'red'}>{item.currency}</Tag></span>}
                    description={<span>{item.description || <i>Sin descripción</i>}</span>}
                  />
                  <div style={{ minWidth: 90, textAlign: 'right' }}>
                    <b style={{ color: item.type === 'Ingreso' ? 'rgb(0, 163, 137)' : item.type === 'Pago Fijo' ? '#0071de' : item.type === 'Gasto Fijo' ? '#faad14' : 'rgb(207, 0, 0)' }}>
                      {item.type === 'Ingreso' ? '+' : '-'}${item.amount.toFixed(2)}
                    </b>
                    <div style={{ fontSize: 12, color: '#888' }}>{item.date.format('HH:mm')}</div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        ))}
      </div>
    </Spin>
  );
};

export default RecentMovements; 