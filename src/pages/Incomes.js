// src/pages/Income.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Spin,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Tag,
  Popconfirm,
  Button,
  notification,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import CurrencyTagPicker from '../components/CurrencyTagPicker';

const Income = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [form] = Form.useForm();
  const [updating, setUpdating] = useState(false);

  const { t } = useTranslation();

  const { Option } = Select;

  // Fetch incomes and months
  useEffect(() => {
    if (!currentUser) return;
    const ref = collection(db, `users/${currentUser.uid}/incomes`);
    const q = query(ref);
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIncomes(data);
      // build months set
      const ms = new Set();
      data.forEach(item => {
        const dt = new Date(item.timestamp.seconds * 1000);
        const m = format(dt, 'MMMM yyyy', { locale: es });
        ms.add(m);
      });
      const sorted = Array.from(ms).sort((a,b) => {
        const da = new Date(a), db_ = new Date(b);
        return db_ - da;
      });
      setMonths(sorted);
      if (!selectedMonth && sorted.length) {
        setSelectedMonth(sorted[0]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleMonthChange = m => setSelectedMonth(m);

  const filtered = useMemo(() => {
    if (!selectedMonth) return [];
    const [mon, yr] = selectedMonth.split(' ');
    return incomes.filter(item => {
      const dt = new Date(item.timestamp.seconds * 1000);
      return (
        format(dt, 'MMMM', { locale: es }) === mon &&
        dt.getFullYear() === parseInt(yr, 10)
      );
    });
  }, [selectedMonth, incomes]);

  const totalARS = filtered
    .filter(i => i.currency === 'ARS')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalUSD = filtered
    .filter(i => i.currency === 'USD')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // Table columns
  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'timestamp',
      key: 'date',
      render: ts => {
        const dt = new Date(ts.seconds * 1000);
        return format(dt, 'dd/MM/yyyy', { locale: es });
      },
      width: 120,
    },
    {
      title: 'Descripción',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt, rec) => `$${Number(amt).toFixed(2)}`,
      width: 120,
    },
    {
      title: 'Moneda',
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, rec) => (
        <>
          <Tag
            onClick={() => {
              setEditingIncome(rec);
              form.setFieldsValue({
                ...rec,
                timestamp: dayjs(rec.timestamp.toDate()),
              });
              setEditModalVisible(true);
            }}
            icon={<EditOutlined />}
            style={{ cursor: 'pointer' }}
          />
          <Popconfirm
            title="¿Eliminar ingreso?"
            onConfirm={async () => {
              try {
                await deleteDoc(
                  doc(db, `users/${currentUser.uid}/incomes`, rec.id)
                );
                notification.success({ message: 'Ingreso eliminado' });
              } catch {
                notification.error({ message: 'Error al eliminar' });
              }
            }}
          >
            <Tag icon={<DeleteOutlined />} color="red" style={{ cursor: 'pointer' }}/>
          </Popconfirm>
        </>
      ),
    },
  ];

  const handleEdit = async values => {
    setUpdating(true);
    try {
      await updateDoc(
        doc(db, `users/${currentUser.uid}/incomes`, editingIncome.id),
        {
          title: values.title,
          amount: Number(values.amount),
          currency: values.currency,
          timestamp: Timestamp.fromDate(values.timestamp.toDate()),
        }
      );
      notification.success({ message: 'Ingreso actualizado' });
      setEditModalVisible(false);
      setEditingIncome(null);
      form.resetFields();
    } catch {
      notification.error({ message: 'Error al actualizar' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Spin
        tip="Cargando..."
        size="large"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      />
    );
  }

  return (
    <div className="container-page">
      <Select
        style={{ width: 250, marginBottom: 16 }}
        placeholder="Selecciona mes"
        value={selectedMonth}
        onChange={handleMonthChange}
      >
        {months.map(m => (
          <Option key={m} value={m}>
            {m}
          </Option>
        ))}
      </Select>

      {filtered.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Table
                bordered
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 'max-content' }}
              />
              <div
                style={{
                  fontWeight: 'bold',
                  borderTop: '2px solid #1890ff',
                  padding: 10,
                  background: '#e6f7ff',
                  textAlign: 'right',
                }}
              >
                Total ARS: ${totalARS.toFixed(2)} &nbsp;|&nbsp; Total USD: ${totalUSD.toFixed(2)}
              </div>
            </Col>
          </Row>
        </>
      ) : (
        <div style={{ marginTop: 40 }}>
          <Empty description={t("No hay ingresos para este mes")} />
        </div>
      )}

      <Modal className="add-expense-modal"
        title="Editar Ingreso"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingIncome(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            name="timestamp"
            label="Fecha"
            rules={[{ required: true, message: 'Selecciona una fecha' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="title"
            label="Descripción"
            rules={[{ required: true, message: 'Ingresa descripción' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={12} style={{ display: 'flex', alignItems: 'center' }}>
              <Form.Item
                name="amount"
                label="Monto"
                rules={[{ required: true, message: 'Ingresa monto' }]}
              >
                <InputNumber style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="Moneda"
                rules={[{ required: true }]}
              >
              <CurrencyTagPicker />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={updating}>
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Income;