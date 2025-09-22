// src/pages/Income.js
import React, { useState, useEffect, useMemo }                    from 'react';
import { Table, Spin, Select, Modal, Form, Input, InputNumber,
  DatePicker, Tag, Button, notification, Empty,
  Row, Col, Typography }                                          from 'antd';
import CustomDatePicker from '../components/CustomDatePicker';
import { EditOutlined, DeleteOutlined, FilterOutlined, CalendarOutlined, RiseOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';
import { db }                                                     from '../firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc,
  Timestamp }                                                     from 'firebase/firestore';
import { useAuth }                                                from '../contexts/AuthContext';
import { format }                                                 from 'date-fns';
import { es, enUS }                                               from 'date-fns/locale';
import dayjs                                                      from 'dayjs';
import { useTranslation }                                         from 'react-i18next';
import CurrencyTagPicker                                          from '../components/CurrencyTagPicker';
import ModernDeleteConfirm                                        from '../components/ModernDeleteConfirm';

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
  const { Title, Paragraph } = Typography;

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
      const monthsArr = Array.from(ms, ([value, label]) => ({ value, label }))
        .sort((a, b) => b.value.localeCompare(a.value));
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
          <ModernDeleteConfirm
            title={t("userProfile.incomes.table.deleteIncome.ask")}
            description="Esta acción no se puede deshacer."
            okText="Eliminar"
            cancelText="Cancelar"
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
          </ModernDeleteConfirm>
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
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="modern-card-header-left">
              <div className="modern-icon blue">
                <FilterOutlined />
              </div>
              <span className="modern-card-title">{t('userProfile.navbar.incomes')}</span>
            </div>
            <div className="modern-card-header-right">
              <Select
                className="modern-select"
                placeholder={t("userProfile.incomes.filter.placeholder")}
                value={selectedMonth}
                onChange={handleMonthChange}
                suffixIcon={<CalendarOutlined style={{ color: '#69c0ff' }} />}
                style={{ minWidth: 220 }}
              >
                {months.map(m => (
                  <Option key={m.value} value={m.value}>
                    {m.label}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Incomes Table */}
          {filtered.length > 0 ? (
            <>
              {/* Custom modern table (no AntD Table) */}
              <div className="modern-grid-table">
                <div className="modern-grid-header">
                  <div className="col col-date">{t('userProfile.incomes.table.date')}</div>
                  <div className="col col-desc">{t('userProfile.incomes.table.description')}</div>
                  <div className="col col-amt">{t('userProfile.incomes.table.amount')}</div>
                  <div className="col col-cur">{t('userProfile.incomes.table.currency')}</div>
                  <div className="col col-act">{t('userProfile.incomes.table.actions')}</div>
                </div>
                <div className="modern-grid-body">
                  {filtered
                    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
                    .map((rec) => {
                      const dt = new Date(rec.timestamp.seconds * 1000);
                      const dateStr = format(dt, i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy', { locale: currentLocale });
                      return (
                        <div className="modern-grid-row" key={rec.id}>
                          <div className="col col-date">{dateStr}</div>
                          <div className="col col-desc" title={rec.title}>{rec.title}</div>
                          <div className="col col-amt">${Number(rec.amount).toFixed(2)}</div>
                          <div className="col col-cur">{rec.currency}</div>
                          <div className="col col-act">
                            <span
                              className="action-chip edit"
                              onClick={() => {
                                setEditingIncome(rec);
                                form.setFieldsValue({
                                  ...rec,
                                  timestamp: dayjs(rec.timestamp.toDate()),
                                });
                                setEditModalVisible(true);
                              }}
                            >
                              <EditOutlined />
                            </span>
                            <ModernDeleteConfirm
                              title={t("userProfile.incomes.table.deleteIncome.ask")}
                              description="Esta acción no se puede deshacer."
                              okText="Eliminar"
                              cancelText="Cancelar"
                              onConfirm={async () => {
                                try {
                                  await deleteDoc(doc(db, `users/${currentUser.uid}/incomes`, rec.id));
                                  await updateDoc(doc(db, 'users', currentUser.uid), { lastActivity: Timestamp.now() });
                                  notification.success({ message: t("userProfile.incomes.table.deleteIncome.deleted") });
                                } catch {
                                  notification.error({ message: t("userProfile.incomes.table.deleteIncome.error") });
                                }
                              }}
                            >
                              <span className="action-chip delete"><DeleteOutlined /></span>
                            </ModernDeleteConfirm>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="modern-card-footer">
                <div className="totals">
                  <span className="total-label">{t('userProfile.incomes.table.totalARS')}</span>
                  <span className="total-value">${totalARS.toFixed(2)}</span>
                  <span className="divider">|</span>
                  <span className="total-label">{t('userProfile.incomes.table.totalUSD')}</span>
                  <span className="total-value">${totalUSD.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 24 }}>
              <Empty description={t("userProfile.emptyData.noIncomes")} />
            </div>
          )}
        </div>

        {/* Edit Income Modal */}
        <Modal 
          className="edit-income-modal" 
          open={editModalVisible} 
          footer={null}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingIncome(null);
            form.resetFields();
          }}
          centered
          width={480}
        >
          <div className="edit-income-modal-content">
            <div className="modal-header">
              <div className="modal-icon-container income-icon">
                <RiseOutlined />
              </div>
              <div className="modal-title-section">
                <Title level={3} className="modal-title">
                  {t('userProfile.incomes.table.editIncome.title')}
                </Title>
                <Paragraph className="modal-subtitle">
                  Modifica los datos del ingreso
                </Paragraph>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleEdit} className="edit-income-form">
              <Form.Item
                name="timestamp"
                label={t('userProfile.incomes.table.editIncome.date')}
                rules={[{ required: true, message: t('userProfile.incomes.table.editIncome.dateRequiredLabel') }]}
                className="form-item-modern"
              >
                <CustomDatePicker
                  value={form.getFieldValue('timestamp')}
                  onChange={(date) => form.setFieldsValue({ timestamp: date })}
                  placeholder={t('userProfile.incomes.table.editIncome.date') || "Seleccionar fecha"}
                />
              </Form.Item>

              <Form.Item
                name="title"
                label={t('userProfile.incomes.table.editIncome.description')}
                rules={[{ required: true, message: t('userProfile.incomes.table.editIncome.descriptionRequiredLabel') }]}
                className="form-item-modern"
              >
                <Input
                  className="modern-input"
                  prefix={<FileTextOutlined className="input-icon" />}
                />
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Form.Item
                    name="amount"
                    label={t('userProfile.incomes.table.editIncome.amount')}
                    rules={[{ required: true, message: t('userProfile.incomes.table.editIncome.amountRequiredLabel') }]}
                    className="form-item-modern"
                  >
                    <Input
                      className="modern-input"
                      type="number"
                      prefix={<DollarOutlined className="input-icon" />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item
                    name="currency"
                    label={t('userProfile.incomes.table.editIncome.currency')}
                    rules={[{ required: true }]}
                    className="form-item-modern"
                  >
                    <CurrencyTagPicker />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                className="modern-submit-btn income-submit"
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={updating}
              >
                <RiseOutlined />
                {t('userProfile.incomes.table.editIncome.saveButton')}
              </Button>
            </Form>
          </div>
        </Modal>
      </Spin>
    </div>
  );
};

export default Income;