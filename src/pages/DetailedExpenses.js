// DetailedExpenses.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Spin, Row, Col, Select, Table, Tooltip,
  Tag, Popconfirm, notification
} from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection, query, onSnapshot, where,
  Timestamp, parse, deleteDoc, doc, getDoc, updateDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ExpensesPage.css';

const { Option } = Select;

const DetailedExpenses = () => {
  const { currentUser } = useAuth();

  /* -------------------- state -------------------- */
  const [loading,       setLoading]       = useState(true);
  const [expenses,      setExpenses]      = useState([]);   // TODAS las expenses del usuario
  const [months,        setMonths]        = useState([]);   // lista “Enero 2025”, “Febrero 2025”, ...
  const [selectedMonth, setSelectedMonth] = useState(null); // mes elegido en el <Select>

  /* ------------------ listeners ------------------ */
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, `users/${currentUser.uid}/expenses`));

    const unsub = onSnapshot(q, snap => {
      const all = [];
      const set = new Set();

      snap.forEach(d => {
        const ex  = { id: d.id, ...d.data() };
        all.push(ex);

        const ts  = new Date(ex.timestamp.seconds * 1000);
        set.add(format(ts, 'MMMM yyyy', { locale: es }));
      });

      // meses ordenados (desc)
      const spanishMonthMap = {
        enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
        julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11
      };
      const sortedMonths = Array.from(set).sort((a,b)=>{
        const [mA,yA] = a.split(' ');
        const [mB,yB] = b.split(' ');
        return new Date(+yB, spanishMonthMap[mB.toLowerCase()]) -
               new Date(+yA, spanishMonthMap[mA.toLowerCase()]);
      });

      setExpenses(all);
      setMonths(sortedMonths);
      setLoading(false);

      /* mes actual por defecto */
      const hoy   = new Date();
      const deflt = format(hoy, 'MMMM yyyy', { locale: es });
      if (sortedMonths.includes(deflt)) setSelectedMonth(deflt);
      else if (!selectedMonth)          setSelectedMonth(sortedMonths[0] || null);
    });

    return () => unsub();
  }, [currentUser]);   // solo 1 vez

  /* ------------- helpers ------------- */
  const spanishMonthMap = {
    enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
    julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11
  };

  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return [];
    const [m, y]   = selectedMonth.split(' ');
    const monthIdx = spanishMonthMap[m.toLowerCase()];
    const yearNum  = Number(y);

    const start = Timestamp.fromDate(new Date(yearNum, monthIdx, 1));
    const end   = Timestamp.fromDate(new Date(yearNum, monthIdx + 1, 1));

    return expenses.filter(e =>
      e.timestamp.seconds >= start.seconds &&
      e.timestamp.seconds <  end.seconds
    );
  }, [selectedMonth, expenses]);

  /* ---- agrupar por categoría y totales ---- */
  const grouped = useMemo(() => {
    const obj = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Uncategorized';
      if (!obj[cat]) obj[cat] = [];
      obj[cat].push(e);
    });
    return obj;
  }, [filteredExpenses]);

  /* ---------------- delete ---------------- */
  const handleDelete = async (expense) => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/expenses`, expense.id));
      notification.success({ message:'Expense deleted' });
      /* ⚠️  si manejás tarjetas de crédito, replicá aquí la lógica
             con creditCards que tenías en MonthlyExpensesPage            */
    } catch (err) {
      console.error(err);
      notification.error({ message:'Error deleting expense' });
    }
  };

  /* --------------- columnas --------------- */
  const columns = (cat) => ([
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'desc',
      width:'45%',
      ellipsis:true,
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amt',
      width:'18%',
      render:(t,r)=> r.currency==='ARS' ? `$${Number(t).toFixed(2)}`
                                        : `USD${Number(t).toFixed(2)}`
    },
    {
      title:'Fecha',
      dataIndex:'timestamp',
      key:'ts',
      width:'20%',
      render:(ts)=> {
        const d = new Date(ts.seconds*1000);
        return (
          <Tooltip title={d.toLocaleTimeString()}>
            {d.toLocaleDateString()}
          </Tooltip>
        );
      },
      responsive:['md']
    },
    {
      title:'Acción',
      key:'act',
      width:'10%',
      render:(_,rec)=>(
        <Popconfirm title="Delete?" onConfirm={()=>handleDelete(rec)}>
          <Tag color="red" style={{cursor:'pointer'}}>Delete</Tag>
        </Popconfirm>
      )
    }
  ]);

  /* --------------- render --------------- */
  if (loading) {
    return (
      <Spin tip="Loading..." size="large"
            style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}/>
    );
  }

  return (
    <div className='container-page'>

      {/* selector de mes */}
      <Select
        style={{ width: 220, marginBottom: 24 }}
        placeholder="Selecciona mes"
        value={selectedMonth}
        onChange={setSelectedMonth}
      >
        {months.map(m => <Option key={m}>{m}</Option>)}
      </Select>

      {/* bloques por categoría */}
<Row gutter={[16, 16]}>
  {Object.entries(grouped).map(([cat, arr]) => {
    /* totales por categoría */
    const totalARS = arr.filter(e => e.currency === 'ARS')
                        .reduce((s, e) => s + Number(e.amount), 0);
    const totalUSD = arr.filter(e => e.currency === 'USD')
                        .reduce((s, e) => s + Number(e.amount), 0);

    return (
      <Col xs={24} md={12} key={cat}>
        <h2>{cat}</h2>

        <Table
          bordered
          dataSource={arr}
          columns={columns(cat)}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}   /* conserva scroll horizontal en mobile */
        />

        <div
          style={{
            fontWeight: 'bold',
            borderTop: '2px solid #1890ff',
            padding: 10,
            background: '#e6f7ff',
          }}
        >
          Total ARS: ${totalARS.toFixed(2)} &nbsp;|&nbsp; Total USD: USD
          {totalUSD.toFixed(2)}
        </div>
      </Col>
    );
  })}
</Row>

    </div>
  );
};

export default DetailedExpenses;