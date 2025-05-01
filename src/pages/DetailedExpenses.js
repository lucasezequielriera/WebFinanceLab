// src/pages/DetailedExpenses.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Spin, Row, Col, Select, Table, Tooltip,
  Tag, Popconfirm, notification, Input, InputNumber, DatePicker
} from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection, query, onSnapshot,
  Timestamp, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ExpensesPage.css';
import dayjs from 'dayjs';


const { Option } = Select;

export default function DetailedExpenses() {
  const { currentUser } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [expenses, setExpenses]     = useState([]);
  const [months, setMonths]         = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // track which row is editing
  const [editingId, setEditingId] = useState(null);
  const [rowEdits, setRowEdits]   = useState({});

  const spanishMonthMap = {
    enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
    julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11
  };

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `users/${currentUser.uid}/expenses`));
    const unsub = onSnapshot(q, snap => {
      const all = [];
      const set = new Set();
      snap.forEach(d => {
        const ex = { id: d.id, ...d.data() };
        all.push(ex);
        const ts = new Date(ex.timestamp.seconds * 1000);
        set.add(format(ts, 'MMMM yyyy', { locale: es }));
      });
      const sortedMonths = Array.from(set).sort((a,b)=>{
        const [mA,yA]=a.split(' '), [mB,yB]=b.split(' ');
        return new Date(+yB, spanishMonthMap[mB.toLowerCase()]) -
               new Date(+yA, spanishMonthMap[mA.toLowerCase()]);
      });
      setExpenses(all);
      setMonths(sortedMonths);
      setLoading(false);
      const todayKey = format(new Date(), 'MMMM yyyy', { locale: es });
      setSelectedMonth(sortedMonths.includes(todayKey) ? todayKey : sortedMonths[0]||null);
    });
    return () => unsub();
  }, [currentUser]);

  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return [];
    const [m,y] = selectedMonth.split(' ');
    const start = Timestamp.fromDate(new Date(+y, spanishMonthMap[m.toLowerCase()], 1));
    const end   = Timestamp.fromDate(new Date(+y, spanishMonthMap[m.toLowerCase()]+1, 1));
    return expenses.filter(e =>
      e.timestamp.seconds >= start.seconds &&
      e.timestamp.seconds <  end.seconds
    );
  }, [selectedMonth, expenses]);

  const grouped = useMemo(() => {
    const obj = {};
    filteredExpenses.forEach(e => {
      const cat = e.category||'Uncategorized';
      if (!obj[cat]) obj[cat]=[];
      obj[cat].push(e);
    });
    return obj;
  }, [filteredExpenses]);

  const handleDelete = async exp => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/expenses`, exp.id));
      notification.success({ message:'Gasto eliminado' });
    } catch {
      notification.error({ message:'Error al eliminar' });
    }
  };

  const isEditing = record => record.id === editingId;

  const startEdit = record => {
    setEditingId(record.id);
    setRowEdits({
      description: record.description,
      amount: record.amount,
      currency: record.currency,
      timestamp: new Date(record.timestamp.seconds*1000)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRowEdits({});
  };

  const saveEdit = async id => {
    try {
      const { description, amount, currency, timestamp } = rowEdits;
      await updateDoc(
        doc(db, `users/${currentUser.uid}/expenses`, id),
        {
          description,
          amount: Number(amount),
          currency,
          timestamp: Timestamp.fromDate(timestamp)
        }
      );
      notification.success({ message:'Gasto actualizado' });
      cancelEdit();
    } catch {
      notification.error({ message:'Error al actualizar' });
    }
  };

  const onChangeCell = (field, value) => {
    setRowEdits(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <Spin tip="Cargando..." size="large"
      style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}/>;
  }

  return (
    <div className="container-page">
      <Select
        style={{ width:220, marginBottom:24 }}
        placeholder="Selecciona mes"
        value={selectedMonth}
        onChange={setSelectedMonth}
      >
        {months.map(m=> <Option key={m} value={m}>{m}</Option>)}
      </Select>

      <Row gutter={[16,16]}>
        {Object.entries(grouped).map(([cat, arr])=> {
          const totalARS = arr.filter(e=>e.currency==='ARS')
                              .reduce((s,e)=>s+Number(e.amount), 0);
          const totalUSD = arr.filter(e=>e.currency==='USD')
                              .reduce((s,e)=>s+Number(e.amount), 0);

          const columns = [
            {
              title:'Descripción', dataIndex:'description', key:'desc', width:'35%',
              render: (_, rec) => isEditing(rec)
                ? <Input
                    value={rowEdits.description}
                    onChange={e => onChangeCell('description', e.target.value)}
                  />
                : rec.description
            },
            {
              title:'Monto', dataIndex:'amount', key:'amt', width:'15%',
              render:(t,rec)=> isEditing(rec)
                ? <InputNumber
                    value={rowEdits.amount}
                    onChange={v => onChangeCell('amount', v)}
                    prefix="$"
                  />
                : (rec.currency==='ARS'
                    ? `$${Number(t).toFixed(2)}`
                    : `USD${Number(t).toFixed(2)}`)
            },
            {
              title:'Moneda', dataIndex:'currency', key:'cur', width:'10%',
              render:(_,rec) => isEditing(rec)
                ? (
                  <Select
                    value={rowEdits.currency}
                    onChange={v => onChangeCell('currency', v)}
                  >
                    <Option value="ARS">ARS</Option>
                    <Option value="USD">USD</Option>
                  </Select>
                )
                : rec.currency
            },
            {
              title:'Fecha', dataIndex:'timestamp', key:'ts', width:'20%',
              render: ts => {
                const d = new Date(ts.seconds*1000);
                return isEditing({ timestamp: ts })
                  ? <DatePicker
                      value={dayjs(rowEdits.timestamp)}
                      onChange={(_,date) => onChangeCell('timestamp', date.toDate())}
                    />
                  : <Tooltip title={d.toLocaleTimeString()}>
                      {d.toLocaleDateString()}
                    </Tooltip>;
              }
            },
            {
              title:'Acción', key:'act', width:'20%',
              render: (_,rec) => isEditing(rec)
                ? (
                  <>
                    <Tag
                      icon={<CheckOutlined />}
                      onClick={()=>saveEdit(rec.id)}
                      style={{ cursor:'pointer', marginRight:8 }}
                    />
                    <Tag
                      icon={<CloseOutlined />}
                      onClick={cancelEdit}
                      style={{ cursor:'pointer' }}
                    />
                  </>
                )
                : (
                  <>
                    <Tag
                      icon={<EditOutlined />}
                      onClick={()=>startEdit(rec)}
                      style={{ cursor:'pointer', marginRight:8 }}
                    />
                    <Popconfirm title="¿Eliminar?" onConfirm={()=>handleDelete(rec)}>
                      <Tag icon={<DeleteOutlined />} color="red" style={{cursor:'pointer'}}/>
                    </Popconfirm>
                  </>
                )
            }
          ];

          return (
            <Col xs={24} md={12} key={cat}>
              <h2>{cat}</h2>
              <Table
                bordered
                dataSource={arr}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize:5 }}
                scroll={{ x:true }}
              />
              <div style={{
                fontWeight:'bold',
                borderTop:'2px solid #1890ff',
                padding:10,
                background:'#e6f7ff',
                textAlign:'right'
              }}>
                Total ARS: ${totalARS.toFixed(2)} &nbsp;|&nbsp; USD ${totalUSD.toFixed(2)}
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
