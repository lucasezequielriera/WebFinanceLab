// src/pages/Income.js
import React, { useState, useEffect, useMemo }                    from 'react';
import { Table, Spin, Select, Modal, Form, Input, InputNumber,
  DatePicker, Tag, Popconfirm, Button, notification, Empty,
  Row, Col, Typography }                                          from 'antd';
import { EditOutlined, DeleteOutlined, FilterOutlined, CalendarOutlined } from '@ant-design/icons';
import { db }                                                     from '../firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc,
  Timestamp }                                                     from 'firebase/firestore';
import { useAuth }                                                from '../contexts/AuthContext';
import { format }                                                 from 'date-fns';
import { es, enUS }                                               from 'date-fns/locale';
import dayjs                                                      from 'dayjs';
import { useTranslation }                                         from 'react-i18next';
import CurrencyTagPicker                                          from '../components/CurrencyTagPicker';

const Income = () => {
  const [loading, setLoading]                   = useState(true);
  const [incomes, setIncomes]                   = useState([]);
  const [months, setMonths]                     = useState([]);
  const [selectedMonth, setSelectedMonth]       = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIncome, setEditingIncome]       = useState(null);
  const [updating, setUpdating]                 = useState(false);

  const [form] = Form.useForm();

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { Option } = Select;
  const { Title } = Typography;

  const currentLocale = i18n.language === 'en' ? enUS : es;

  const handleMonthChange = m => setSelectedMonth(m);

  useEffect(() => {
    if (!currentUser) return;

    const ref = collection(db, `users/${currentUser.uid}/incomes`);
    const q = query(ref);

    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setIncomes(data);

      const ms = new Map();
      data.forEach(item => {
        const dt = new Date(item.timestamp.seconds * 1000);
        const monthNum = dt.getMonth() + 1;
        const year = dt.getFullYear();
        const value = `${year}-${monthNum.toString().padStart(2, '0')}`;
        const label = `${format(dt, 'MMMM', { locale: currentLocale }).charAt(0).toUpperCase() + format(dt, 'MMMM', { locale: currentLocale }).slice(1)} ${year}`;
        ms.set(value, label);
      });
      const monthsArr = Array.from(ms, ([value, label]) => ({ value, label }));
      setMonths(monthsArr);

      if (!selectedMonth && monthsArr.length) {
        setSelectedMonth(monthsArr[0].value);
      }

      setLoading(false);
    });

    return () => unsub();

  }, [currentUser]);

  const filtered = useMemo(() => {
    if (!selectedMonth) return [];
    const [year, month] = selectedMonth.split('-');
    return incomes.filter(item => {
      const dt = new Date(item.timestamp.seconds * 1000);
      return dt.getFullYear() === parseInt(year, 10) && (dt.getMonth() + 1) === parseInt(month, 10);
    });
  }, [selectedMonth, incomes]);

  const totalARS = filtered
    .filter(i => i.currency === 'ARS')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalUSD = filtered
    .filter(i => i.currency === 'USD')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const columns = [
    {
      title: t('userProfile.incomes.table.date'),
      dataIndex: 'timestamp',
      key: 'date',
      render: ts => {
        const dt = new Date(ts.seconds * 1000);
        return format(dt, i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy', { locale: currentLocale });
      },
      width: 120,
    },
    {
      title: t('userProfile.incomes.table.description'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: t('userProfile.incomes.table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amt, rec) => `$ ${Number(amt).toFixed(2)}`,
      width: 120,
    },
    {
      title: t('userProfile.incomes.table.currency'),
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
    },
    {
      title: t('userProfile.incomes.table.actions'),
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
            title={t("userProfile.incomes.table.deleteIncome.ask")}
            onConfirm={async () => {
              try {
                await deleteDoc(
                  doc(db, `users/${currentUser.uid}/incomes`, rec.id)
                );
                await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
                notification.success({ message: t("userProfile.incomes.table.deleteIncome.deleted") });
              } catch {
                notification.error({ message: t("userProfile.incomes.table.deleteIncome.error") });
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
      await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
      notification.success({ message: t("userProfile.incomes.table.editIncome.edited") });
      setEditModalVisible(false);
      setEditingIncome(null);
      form.resetFields();
    } catch {
      notification.error({ message: t("userProfile.incomes.table.editIncome.error") });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container-page">
      <Spin spinning={loading}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: 16,
          maxWidth: '250px',
          width: '100%',
          paddingBottom: 1
        }}>
          <FilterOutlined style={{ 
            fontSize: '20px', 
            color: '#1890ff',
            marginRight: '8px'
          }} />
        <Select
            style={{ flex: 1 }}
          placeholder={t("userProfile.incomes.filter.placeholder")}
          value={selectedMonth}
          onChange={handleMonthChange}
            suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
        >
          {months.map(m => (
              <Option key={m.value} value={m.value}>
                {m.label}
            </Option>
          ))}
        </Select>
        </div>

        {/* Incomes Table */}
        {filtered.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Table
                  bordered
                  dataSource={filtered.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: 'max-content' }}
                  locale={{
                    emptyText: <Empty description={t("userProfile.incomes.table.noIncomes")} />
                  }}
                />
                {filtered.length > 0 && (
                  <div className="totals-container">
                    <span style={{ color: '#0071de' }}>{t('userProfile.incomes.table.totalARS')} ${totalARS.toFixed(2)}</span>
                    <span style={{ color: '#0071de', opacity: 0.5 }}>|</span>
                    <span style={{ color: '#0071de' }}>{t('userProfile.incomes.table.totalUSD')} ${totalUSD.toFixed(2)}</span>
                </div>
                )}
              </Col>
            </Row>
          </>
        ) : (
          <div style={{ marginTop: 40 }}>
            <Empty description={t("userProfile.emptyData.noIncomes")} />
          </div>
        )}

        {/* Edit Income Modal */}
        <Modal className="add-expense-modal" open={editModalVisible} footer={null}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingIncome(null);
          form.resetFields();
        }}
        >
          <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
            {t('userProfile.incomes.table.editIncome.title')}
          </Title>

          <Form form={form} layout="vertical" onFinish={handleEdit}>
            <Form.Item
              name="timestamp"
              label={t('userProfile.incomes.table.editIncome.date')}
              rules={[{ required: true, message: t('userProfile.incomes.table.editIncome.dateRequiredLabel') }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format={i18n.language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                locale={i18n.language === 'en' ? enUS : es}
              />
            </Form.Item>
            <Form.Item
              name="title"
              label={t('userProfile.incomes.table.editIncome.description')}
              rules={[{ required: true, message: t('userProfile.incomes.table.editIncome.descriptionRequiredLabel') }]}
            >
              <Input />
            </Form.Item>

            <Row gutter={[16, 16]}>
              <Col xs={12} style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Item
                  name="amount"
                  label={t('userProfile.incomes.table.editIncome.amount')}
                  rules={[{ required: true, message: t('userProfile.incomes.table.editIncome.amountRequiredLabel') }]}
                >
                  <InputNumber style={{ width: '100%' }} prefix="$" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currency"
                  label={t('userProfile.incomes.table.editIncome.currency')}
                  rules={[{ required: true }]}
                >
                <CurrencyTagPicker />
                </Form.Item>
              </Col>
            </Row>

            <Button type="primary" htmlType="submit" size="large" block style={{ marginTop: 10 }} loading={updating}>
              {t('userProfile.incomes.table.editIncome.saveButton')}
            </Button>
          </Form>
          
        </Modal>
      </Spin>
    </div>
  );
};

export default Income;