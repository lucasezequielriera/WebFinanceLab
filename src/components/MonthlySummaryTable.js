import React, { useEffect, useState } from 'react';
import { Table, Spin, Tag, Badge } from 'antd';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import { DollarOutlined, DownCircleTwoTone, UpCircleTwoTone } from '@ant-design/icons';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const currencyTag = (currency) => (
  <Tag color={currency === 'ARS' ? 'blue' : 'green'} style={{ fontWeight: 600, fontSize: 12 }}>
    {currency}
  </Tag>
);

const MonthlySummaryTable = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = dayjs().year();

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      const incomesByMonth = Array(12).fill(0).map(() => ({ ARS: 0, USD: 0 }));
      const expensesByMonth = Array(12).fill(0).map(() => ({ ARS: 0, USD: 0 }));

      // Incomes
      const incomesRef = collection(db, `users/${currentUser.uid}/incomes`);
      const incomesSnap = await getDocs(incomesRef);
      incomesSnap.forEach(doc => {
        const inc = doc.data();
        const date = dayjs(inc.timestamp?.seconds ? inc.timestamp.seconds * 1000 : inc.timestamp);
        if (date.year() === year) {
          const m = date.month();
          if (inc.currency === 'ARS') incomesByMonth[m].ARS += Number(inc.amount);
          if (inc.currency === 'USD') incomesByMonth[m].USD += Number(inc.amount);
        }
      });

      // Expenses
      const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
      const expensesSnap = await getDocs(expensesRef);
      expensesSnap.forEach(doc => {
        const exp = doc.data();
        const date = dayjs(exp.timestamp?.seconds ? exp.timestamp.seconds * 1000 : exp.timestamp);
        if (date.year() === year) {
          const m = date.month();
          if (exp.currency === 'ARS') expensesByMonth[m].ARS += Number(exp.amount);
          if (exp.currency === 'USD') expensesByMonth[m].USD += Number(exp.amount);
        }
      });

      // Solo meses con datos
      const tableData = months.map((name, i) => ({
        key: i,
        month: name,
        monthNum: i,
        incomesARS: incomesByMonth[i].ARS,
        incomesUSD: incomesByMonth[i].USD,
        expensesARS: expensesByMonth[i].ARS,
        expensesUSD: expensesByMonth[i].USD,
      })).filter(row =>
        row.incomesARS !== 0 || row.incomesUSD !== 0 || row.expensesARS !== 0 || row.expensesUSD !== 0
      );

      // Totales
      const total = tableData.reduce((acc, row) => {
        acc.incomesARS += row.incomesARS;
        acc.incomesUSD += row.incomesUSD;
        acc.expensesARS += row.expensesARS;
        acc.expensesUSD += row.expensesUSD;
        return acc;
      }, { incomesARS: 0, incomesUSD: 0, expensesARS: 0, expensesUSD: 0 });

      setData({ rows: tableData, total });
      setLoading(false);
    };
    fetchData();
  }, [currentUser, year]);

  const columns = [
    {
      title: '',
      dataIndex: 'monthNum',
      key: 'icon',
      width: 30,
      render: i => <Badge count={i + 1} style={{ backgroundColor: '#0071de' }} />,
    },
    { title: 'Mes', dataIndex: 'month', key: 'month', width: 100, render: (m, row) => <b>{m}</b> },
    {
      title: <span><UpCircleTwoTone twoToneColor="#52c41a" /> Ingresos</span>,
      children: [
        {
          title: currencyTag('ARS'),
          dataIndex: 'incomesARS',
          key: 'incomesARS',
          align: 'right',
          render: v => v > 0 ? <span style={{ color: '#52c41a', fontWeight: 600 }}>+${v.toFixed(2)}</span> : <span style={{ color: '#bbb' }}>-</span>
        },
        {
          title: currencyTag('USD'),
          dataIndex: 'incomesUSD',
          key: 'incomesUSD',
          align: 'right',
          render: v => v > 0 ? <span style={{ color: 'rgb(0, 163, 137)', fontWeight: 600 }}>+${v.toFixed(2)}</span> : <span style={{ color: '#bbb' }}>-</span>
        }
      ]
    },
    {
      title: <span><DownCircleTwoTone twoToneColor="rgb(207, 0, 0)" /> Gastos</span>,
      children: [
        {
          title: currencyTag('ARS'),
          dataIndex: 'expensesARS',
          key: 'expensesARS',
          align: 'right',
          render: v => v > 0 ? <span style={{ color: '#fa541c', fontWeight: 600 }}>-${v.toFixed(2)}</span> : <span style={{ color: '#bbb' }}>-</span>
        },
        {
          title: currencyTag('USD'),
          dataIndex: 'expensesUSD',
          key: 'expensesUSD',
          align: 'right',
          render: v => v > 0 ? <span style={{ color: 'rgb(207, 0, 0)', fontWeight: 600 }}>-${v.toFixed(2)}</span> : <span style={{ color: '#bbb' }}>-</span>
        }
      ]
    }
  ];

  return (
    <Spin spinning={loading}>
      {data && data.rows && (
        <div
          style={{
            minWidth: 420,
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 4px 16px 0 rgba(0,0,0,0.07)',
            padding: 15,
            margin: '0 auto',
            fontSize: 15,
            transition: 'box-shadow 0.2s',
          }}
        >
          <div style={{
            fontWeight: 700,
            fontSize: 18,
            color: '#222',
            marginBottom: 10,
            paddingLeft: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            Comparaciones mensuales
          </div>
          <Table
            columns={columns}
            dataSource={data.rows}
            pagination={false}
            size="middle"
            bordered
            style={{ background: 'transparent', borderRadius: 12 }}
          />
        </div>
      )}
    </Spin>
  );
};

export default MonthlySummaryTable; 