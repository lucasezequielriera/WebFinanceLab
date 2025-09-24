import React, { useState, useEffect }                                   from 'react';
import { Spin, Empty, Button, Input, Checkbox, Form, message, Tag, AutoComplete, Modal, Tooltip, DatePicker, Typography, Row, Col } from 'antd';
import { doc, onSnapshot, setDoc }                                      from 'firebase/firestore';
import { db }                                                           from '../firebase';
import { storage }                                                      from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL }               from 'firebase/storage';
import { useAuth }                                                      from '../contexts/AuthContext';
import { useTranslation }                                               from 'react-i18next';
import dayjs                                                            from 'dayjs';
import useMonthlyMovements                                              from '../hooks/useMonthlyMovements';
// Styles
import '../styles/Expenses.css';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, InfoCircleOutlined, SettingOutlined, FilePdfOutlined, FilterOutlined } from '@ant-design/icons';
import ModernDeleteConfirm                                          from '../components/ModernDeleteConfirm';
import { NumericFormat } from 'react-number-format';
import enUS from 'antd/es/date-picker/locale/en_US';
import esES from 'antd/es/date-picker/locale/es_ES';
import useIsMobile                                                     from '../hooks/useIsMobile';

const FixedExpenses = () => {
  const [loading, setLoading]             = useState(true);
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [noteModal, setNoteModal] = useState({ visible: false, id: null, note: '' });
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [confirmPdfModal, setConfirmPdfModal] = useState({ visible: false, id: null, row: null, oldPdfUrl: null });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [updating, setUpdating] = useState(false);

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasExpenses } = useMonthlyMovements();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentUser) return;
    const monthKey = selectedMonth.format('YYYY-MM');
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
    const unsub = onSnapshot(ref, snap => {
      const data = snap.exists() ? snap.data().payments || [] : [];
      setMonthlyPayments(data);
      setMpLoading(false);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser, selectedMonth]);

  const saveMonthlyPayments = async (data) => {
    if (!currentUser) return;
    const monthKey = selectedMonth.format('YYYY-MM');
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
    await setDoc(ref, { payments: data }, { merge: true });
  };

  const edit = (record) => {
    setEditingKey(record.id);
    form.setFieldsValue(record);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      message.error('Solo se permiten archivos PDF');
      setPdfFile(null);
    }
  };

  const save = async (id, overrideRow = null) => {
    try {
      const row = overrideRow || await form.validateFields();
      const oldPayment = monthlyPayments.find(p => p.id === id);
      // Si el pago tenía pdfUrl y no hay pdfFile nuevo, preguntar qué hacer
      if (!overrideRow) {
        if (oldPayment && oldPayment.pdfUrl && !pdfFile && !row.pdfUrl) {
          setConfirmPdfModal({ visible: true, id, row, oldPdfUrl: oldPayment.pdfUrl });
          return;
        }
      }
      // Subir PDF si corresponde
      let pdfUrl = row.pdfUrl || '';
      if (pdfFile) {
        setUploading(true);
        const fileRef = storageRef(storage, `monthlyPayments/${currentUser.uid}/${id}.pdf`);
        await uploadBytes(fileRef, pdfFile);
        pdfUrl = await getDownloadURL(fileRef);
        setUploading(false);
        setPdfFile(null);
      } else if (oldPayment && oldPayment.pdfUrl && !row.pdfUrl) {
        // Si el usuario eligió eliminar el documento
        pdfUrl = '';
      }
      console.log('DEBUG: Valores antes de guardar:', { amountARS: row.amountARS, amountUSD: row.amountUSD, typeofARS: typeof row.amountARS, typeofUSD: typeof row.amountUSD });
      const newData = [...monthlyPayments];
      const idx = newData.findIndex(item => item.id === id);
      if (idx > -1) {
        // Elimina 'type' si existe y asegura 'category', y elimina isNew
        const { type, isNew, ...rest } = { 
          ...newData[idx], 
          ...row,
          pdfUrl,
          amountARS: (() => {
            if (row.amountARS === '' || row.amountARS === undefined || row.amountARS === null) return 0;
            if (typeof row.amountARS === 'string') {
              let clean = row.amountARS.replace(/\$/g, '');
              if (i18n.language === 'es') {
                clean = clean.replace(/\./g, '').replace(',', '.'); // quitar puntos de miles y cambiar coma por punto
              } else {
                clean = clean.replace(/,/g, ''); // quitar comas de miles
              }
              return Number(clean) || 0;
            }
            return isNaN(row.amountARS) ? 0 : row.amountARS;
          })(),
          amountUSD: (() => {
            if (row.amountUSD === '' || row.amountUSD === undefined || row.amountUSD === null) return 0;
            if (typeof row.amountUSD === 'string') {
              let clean = row.amountUSD.replace(/\$/g, '');
              if (i18n.language === 'es') {
                clean = clean.replace(/\./g, '').replace(',', '.');
              } else {
                clean = clean.replace(/,/g, '');
              }
              return Number(clean) || 0;
            }
            return isNaN(row.amountUSD) ? 0 : row.amountUSD;
          })(),
        };
        newData[idx] = { ...rest };
        setMonthlyPayments(newData);
        setEditingKey('');
        await saveMonthlyPayments(newData);
        message.success(t("userProfile.expenses.fixedExpenses.table.edited"));
      }
    } catch (err) {
      // Solo mostrar notificación de error si no es un error de validación
      if (err.errorFields && err.errorFields.length > 0) {
        // Hay errores de validación, no mostramos notificación
        return;
      }
      message.error(t("userProfile.expenses.fixedExpenses.table.error"));
    }
  };

  const openEditModal = (record) => {
    setEditingPayment(record);
    form.setFieldsValue({
      title: record.title ?? '',
      amountARS: record.amountARS ?? 0,
      amountUSD: record.amountUSD ?? 0,
      paid: !!record.paid,
      notes: record.notes ?? ''
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      setUpdating(true);
      const values = await form.validateFields();
      await save(editingPayment.id, values);
      setEditModalVisible(false);
      setEditingPayment(null);
    } catch (e) {
      // validation handled by antd
    } finally {
      setUpdating(false);
    }
  };

  // Handler para el modal de confirmación de PDF
  const handleConfirmPdf = async (keep) => {
    setConfirmPdfModal({ visible: false, id: null, row: null, oldPdfUrl: null });
    if (keep) {
      // Guardar manteniendo el documento
      await save(confirmPdfModal.id, { ...confirmPdfModal.row, pdfUrl: confirmPdfModal.oldPdfUrl });
    } else {
      // Guardar eliminando el documento
      await save(confirmPdfModal.id, { ...confirmPdfModal.row, pdfUrl: '' });
    }
  };

  const cancel = () => {
    const newData = [...monthlyPayments];
    const idx = newData.findIndex(item => item.id === editingKey);
    if (idx > -1 && newData[idx].isNew) {
      newData.splice(idx, 1);
      setMonthlyPayments(newData);
    }
    setEditingKey('');
    setPdfFile(null);
  };

  const handleDelete = async (id) => {
    const newData = monthlyPayments.filter(item => item.id !== id);
    setMonthlyPayments(newData);
    await saveMonthlyPayments(newData);
    message.success(t("userProfile.expenses.fixedExpenses.table.delete.deleted"));
  };

  const isEditing = (record) => record.id === editingKey;

  // Obtener títulos únicos para autocompletar
  const titlesList = Array.from(new Set(monthlyPayments.map(p => p.title).filter(Boolean))).sort();

  const columns = [
    {
      title: t("userProfile.expenses.fixedExpenses.table.title"),
      dataIndex: 'title',
      editable: true,
      render: (text, record) => isEditing(record)
        ? <Form.Item 
            name="title" 
            style={{ margin: 0 }} 
            rules={[
              { required: true, message: 'Ingrese un nombre' },
              { 
                validator: (_, value) => {
                  if (!value || value.replace(/\s+/g, '').length === 0) {
                    return Promise.reject('');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          > 
            <AutoComplete
              style={{ width: 180 }}
              value={form.getFieldValue('title')}
              onChange={v => {
                if (!v || v.replace(/\s+/g, '').length === 0) {
                  form.setFieldsValue({ title: '' });
                } else {
                  form.setFieldsValue({ title: v });
                }
              }}
              placeholder="Título del pago"
              options={titlesList.filter(Boolean).map(tit => ({
                value: tit,
                label: tit
              }))}
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
        : text
    },
    {
      title: t("userProfile.expenses.fixedExpenses.table.amountArs"),
      dataIndex: 'amountARS',
      editable: true,
      render: (text, record) => isEditing(record) 
        ? <Form.Item 
            name="amountARS" 
            style={{ margin: 0 }}
            initialValue={0}
            rules={[{ required: true, message: 'Ingrese un monto' }]}
          >
            <NumericFormat
              customInput={Input}
              allowNegative={false}
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator={i18n.language === 'es' ? '.' : ','}
              decimalSeparator={i18n.language === 'es' ? ',' : '.'}
              prefix={"$"}
              style={{ width: 100 }}
              placeholder={i18n.language === 'es' ? '0,00' : '0.00'}
              onValueChange={vals => form.setFieldsValue({ amountARS: vals.floatValue ?? '' })}
              value={form.getFieldValue('amountARS')}
            />
          </Form.Item> 
        : (text ? `$${Number(text).toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}` : '$0,00')
    },
    {
      title: t("userProfile.expenses.fixedExpenses.table.amountUsd"),
      dataIndex: 'amountUSD',
      editable: true,
      render: (text, record) => isEditing(record) 
        ? <Form.Item 
            name="amountUSD" 
            style={{ margin: 0 }}
            initialValue={0}
            rules={[{ required: true, message: 'Ingrese un monto' }]}
          >
            <NumericFormat
              customInput={Input}
              allowNegative={false}
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator={i18n.language === 'es' ? '.' : ','}
              decimalSeparator={i18n.language === 'es' ? ',' : '.'}
              prefix={"$"}
              style={{ width: 100 }}
              placeholder={i18n.language === 'es' ? '0,00' : '0.00'}
              onValueChange={vals => form.setFieldsValue({ amountUSD: vals.floatValue ?? '' })}
              value={form.getFieldValue('amountUSD')}
            />
          </Form.Item> 
        : (text ? `$${Number(text).toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}` : '$0,00')
    },
    {
      title: t("userProfile.expenses.fixedExpenses.table.paid"),
      dataIndex: 'paid',
      align: 'center',
      width: 48,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item name="paid" valuePropName="checked" style={{ margin: 0 }}>
            <Checkbox />
          </Form.Item>
        ) : (
          record.paid ? (
            <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          ) : (
            <CloseOutlined style={{ color: 'red', fontSize: 16 }} />
          )
        );
      }
    },
    {
      title: t("userProfile.expenses.fixedExpenses.table.info"),
      dataIndex: 'noteInfo',
      align: 'center',
      width: 48,
      render: (text, record) => {
        const editing = isEditing(record);
        const hasNote = record.notes && record.notes.trim() !== '';
        if (editing) {
          return (
            <>
              <Form.Item name="notes" style={{ display: 'none' }} />
              <span onClick={() => openNoteModal(record)} style={{ cursor: 'pointer' }}>
                <InfoCircleOutlined style={{ color: hasNote ? '#1890ff' : '#d9d9d9', fontSize: 16 }} />
              </span>
            </>
          );
        } else {
          return hasNote ? (
            <Tooltip title={record.notes} placement="top">
              <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            </Tooltip>
          ) : null;
        }
      }
    },
    {
      title: t("userProfile.expenses.fixedExpenses.table.pdf"),
      dataIndex: 'pdf',
      align: 'center',
      width: 40,
      render: (_, record) => {
        const editing = isEditing(record);
        const hasPdf = !!(pdfFile || record.pdfUrl);
        if (editing) {
          return (
            <label style={{ cursor: 'pointer' }}>
              <FilePdfOutlined style={{ color: hasPdf ? '#d4380d' : '#d9d9d9', fontSize: 18, verticalAlign: 'middle' }} />
              <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={uploading} style={{ display: 'none' }} />
            </label>
          );
        } else {
          return record.pdfUrl
            ? <a href={record.pdfUrl} target="_blank" rel="noopener noreferrer"><FilePdfOutlined style={{ color: '#d4380d', fontSize: 18, cursor: 'pointer' }} /></a>
            : null;
        }
      }
    },
    {
      title: <SettingOutlined style={{ fontSize: 16 }} />,
      dataIndex: 'actions',
      align: 'center',
      width: 48,
      render: (_, record) => {
        const editable = isEditing(record);
    return (
          <div style={{ minWidth: '50px', display: 'flex', gap: 8, alignItems: 'center' }}>
            {editable ? (
              <>
                <Tag icon={<CheckOutlined />} onClick={() => save(record.id)} style={{ cursor: 'pointer', margin: 0 }} />
                <Tag icon={<CloseOutlined />} onClick={cancel} style={{ cursor: 'pointer', margin: 0 }} />
                <Tag icon={<FileTextOutlined />} onClick={() => openNoteModal(record)} style={{ cursor: 'pointer', margin: 0 }} />
              </>
            ) : (
              <>
                <Tag icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ cursor: 'pointer', margin: 0 }} />
                <ModernDeleteConfirm
                  title={t('userProfile.expenses.fixedExpenses.table.delete.ask')}
                  description={t('userProfile.expenses.fixedExpenses.table.delete.description')}
                  okText={t('userProfile.expenses.fixedExpenses.table.delete.confirmButton')}
                  cancelText={t('userProfile.expenses.fixedExpenses.table.delete.cancelButton')}
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Tag icon={<DeleteOutlined />} color="red" style={{ cursor: 'pointer', margin: 0 }} />
                </ModernDeleteConfirm>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Calcular totales
  const totalARS = monthlyPayments.reduce((sum, p) => sum + (Number(p.amountARS) || 0), 0);
  const totalUSD = monthlyPayments.reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0);

  // Solo pagos guardados en la DB
  const savedPayments = monthlyPayments.filter(p => !p.isNew);

  const EditableTable = () => (
    <Form form={form} component={false}>
      {!isMobile && (
        <div className="modern-grid-table fixed-grid-table">
          <div className="modern-grid-header">
            <div className="col">{t("userProfile.incomes.table.description")}</div>
            <div className="col">{t("userProfile.expenses.fixedExpenses.table.amountArs")}</div>
            <div className="col">{t("userProfile.expenses.fixedExpenses.table.amountUsd")}</div>
            <div className="col" style={{ textAlign: 'center' }}>{t("userProfile.expenses.fixedExpenses.table.paid")}</div>
            <div className="col" style={{ textAlign: 'center' }}>{t("userProfile.expenses.fixedExpenses.table.pdf")}</div>
            <div className="col" style={{ textAlign: 'center' }}>{t("userProfile.expenses.fixedExpenses.table.info")}</div>
            <div className="col" style={{ textAlign: 'center' }}>{t('userProfile.incomes.table.actions')}</div>
          </div>
          <div className="modern-grid-body">
            {monthlyPayments.map((record) => (
              <div className="modern-grid-row" key={record.id}>
                <div className="col">
                  {isEditing(record) ? (
                    <Form.Item name="title" style={{ margin: 0 }} rules={[{ required: true, message: 'Ingrese un nombre' }]}> 
                      <AutoComplete
                        style={{ width: 180 }}
                        value={form.getFieldValue('title')}
                        onChange={v => form.setFieldsValue({ title: v || '' })}
                        placeholder={t('userProfile.incomes.table.description')}
                        options={titlesList.filter(Boolean).map(tit => ({ value: tit, label: tit }))}
                        filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
                      />
                    </Form.Item>
                  ) : (
                    record.title
                  )}
                </div>
                <div className="col">
                  {isEditing(record) ? (
                    <Form.Item name="amountARS" style={{ margin: 0 }} rules={[{ required: true, message: 'Ingrese un monto' }]}> 
                      <NumericFormat customInput={Input} allowNegative={false} decimalScale={2} fixedDecimalScale thousandSeparator={i18n.language === 'es' ? '.' : ','} decimalSeparator={i18n.language === 'es' ? ',' : '.'} prefix={'$'} placeholder={i18n.language === 'es' ? '0,00' : '0.00'} onValueChange={vals => form.setFieldsValue({ amountARS: vals.floatValue ?? '' })} value={form.getFieldValue('amountARS')} />
                    </Form.Item>
                  ) : (
                    record.amountARS ? `$${Number(record.amountARS).toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}` : '$0,00'
                  )}
                </div>
                <div className="col">
                  {isEditing(record) ? (
                    <Form.Item name="amountUSD" style={{ margin: 0 }} rules={[{ required: true, message: 'Ingrese un monto' }]}> 
                      <NumericFormat customInput={Input} allowNegative={false} decimalScale={2} fixedDecimalScale thousandSeparator={i18n.language === 'es' ? '.' : ','} decimalSeparator={i18n.language === 'es' ? ',' : '.'} prefix={'$'} placeholder={i18n.language === 'es' ? '0,00' : '0.00'} onValueChange={vals => form.setFieldsValue({ amountUSD: vals.floatValue ?? '' })} value={form.getFieldValue('amountUSD')} />
                    </Form.Item>
                  ) : (
                    record.amountUSD ? `$${Number(record.amountUSD).toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}` : '$0,00'
                  )}
                </div>
                <div className="col" style={{ textAlign: 'center' }}>
                  {isEditing(record) ? (
                    <Form.Item name="paid" valuePropName="checked" style={{ margin: 0 }}>
                      <Checkbox />
                    </Form.Item>
                  ) : (
                    record.paid ? <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} /> : <CloseOutlined style={{ color: 'red', fontSize: 16 }} />
                  )}
                </div>
                <div className="col" style={{ textAlign: 'center' }}>
                  {isEditing(record) ? (
                    <label style={{ cursor: 'pointer' }}>
                      <FilePdfOutlined style={{ color: (pdfFile || record.pdfUrl) ? '#d4380d' : '#d9d9d9', fontSize: 18, verticalAlign: 'middle' }} />
                      <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={uploading} style={{ display: 'none' }} />
                    </label>
                  ) : (
                    record.pdfUrl ? <a href={record.pdfUrl} target="_blank" rel="noopener noreferrer"><FilePdfOutlined style={{ color: '#d4380d', fontSize: 18, cursor: 'pointer' }} /></a> : null
                  )}
                </div>
                <div className="col" style={{ textAlign: 'center' }}>
                  {isEditing(record) ? (
                    <>
                      <Form.Item name="notes" style={{ display: 'none' }} />
                      <span onClick={() => openNoteModal(record)} style={{ cursor: 'pointer' }}>
                        <InfoCircleOutlined style={{ color: record.notes && record.notes.trim() !== '' ? '#1890ff' : '#d9d9d9', fontSize: 16 }} />
                      </span>
                    </>
                  ) : (
                    record.notes && record.notes.trim() !== '' ? (
                      <Tooltip title={record.notes} placement="top">
                        <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                      </Tooltip>
                    ) : null
                  )}
                </div>
                <div className="col" style={{ textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {isEditing(record) ? (
                    <>
                      <Tag icon={<CheckOutlined />} onClick={() => save(record.id)} style={{ cursor: 'pointer', margin: 0 }} />
                      <Tag icon={<CloseOutlined />} onClick={cancel} style={{ cursor: 'pointer', margin: 0 }} />
                      <Tag icon={<FileTextOutlined />} onClick={() => openNoteModal(record)} style={{ cursor: 'pointer', margin: 0 }} />
                    </>
                  ) : (
                    <>
                      <span className="action-chip edit" onClick={() => openEditModal(record)}><EditOutlined /></span>
                      <ModernDeleteConfirm
                        title={t('userProfile.expenses.fixedExpenses.table.delete.ask')}
                        description={t('userProfile.expenses.fixedExpenses.table.delete.description')}
                        okText={t('userProfile.expenses.fixedExpenses.table.delete.confirmButton')}
                        cancelText={t('userProfile.expenses.fixedExpenses.table.delete.cancelButton')}
                        onConfirm={() => handleDelete(record.id)}
                      >
                        <span className="action-chip delete"><DeleteOutlined /></span>
                      </ModernDeleteConfirm>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {monthlyPayments.map((record) => (
            <div key={record.id} style={{ background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{record.title}</div>
                <div>{record.paid ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: 'red' }} />}</div>
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 12, color: '#69c0ff', fontWeight: 800 }}>
                <div>ARS ${Number(record.amountARS || 0).toFixed(2)}</div>
                <div>USD ${Number(record.amountUSD || 0).toFixed(2)}</div>
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#e2e8f0', opacity: 0.85 }}>{record.notes}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span className="action-chip edit" onClick={() => openEditModal(record)}><EditOutlined /></span>
                  <ModernDeleteConfirm
                    title={t('userProfile.expenses.fixedExpenses.table.delete.ask')}
                    description={t('userProfile.expenses.fixedExpenses.table.delete.description')}
                    okText={t('userProfile.expenses.fixedExpenses.table.delete.confirmButton')}
                    cancelText={t('userProfile.expenses.fixedExpenses.table.delete.cancelButton')}
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <span className="action-chip delete" style={{ cursor: 'pointer' }}><DeleteOutlined /></span>
                  </ModernDeleteConfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totales debajo */}
      {savedPayments.length > 0 && (
        <div className="modern-card-footer">
          <div className="totals">
            <span className="total-label" style={{ textTransform: 'uppercase' }}>Total ARS</span>
            <span className="total-value">${totalARS.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}</span>
            <span className="divider">|</span>
            <span className="total-label" style={{ textTransform: 'uppercase' }}>Total USD</span>
            <span className="total-value">${totalUSD.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
      )}
    </Form>
  );

  const openNoteModal = (record) => {
    setNoteModal({ visible: true, id: record.id, note: record.notes || '' });
  };

  const handleNoteChange = (e) => {
    setNoteModal((prev) => ({ ...prev, note: e.target.value }));
  };

  const handleNoteSave = async () => {
    // Buscar si el registro está en edición
    const editing = monthlyPayments.find(item => item.id === noteModal.id && isEditing(item));
    if (editing) {
      // Actualizar el valor en monthlyPayments (sin guardar en la DB)
      const newData = monthlyPayments.map(item =>
        item.id === noteModal.id ? { ...item, notes: noteModal.note } : item
      );
      setMonthlyPayments(newData);
      form.setFieldsValue({ notes: noteModal.note });
      setNoteModal({ visible: false, id: null, note: '' });
      message.success('Nota actualizada (se guardará al confirmar los cambios)');
    } else {
      // Guardar en la db inmediatamente
      const newData = monthlyPayments.map(item =>
        item.id === noteModal.id ? { ...item, notes: noteModal.note } : item
      );
      setMonthlyPayments(newData);
      await saveMonthlyPayments(newData);
      setNoteModal({ visible: false, id: null, note: '' });
      message.success('Nota guardada');
    }
  };

  const handleNoteCancel = () => {
    setNoteModal({ visible: false, id: null, note: '' });
  };

  return (
    <>
    <div className='container-page'>
      <Spin spinning={loading}>
        {hasExpenses ? (
          <>
            {/* Month filter */}
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
              <DatePicker
                key={i18n.language}
                picker="month"
                value={selectedMonth}
                onChange={val => setSelectedMonth(val || dayjs())}
                format={i18n.language === 'en' ? 'MMM YYYY' : 'MMMM YYYY'}
                locale={i18n.language === 'en' ? enUS : esES}
                style={{ width: '100%' }}
                className={`${i18n.language === 'es' ? 'datepicker-capitalize ' : ''}modern-month-picker`}
              />
            </div>

            <EditableTable />
          </>
        ) : (
          // EMPTY DATA MESSAGE
          <div style={{ marginTop: 40 }}>
            <Empty description={t("No hay gastos registrados en este mes")}/>
          </div>
        )}
      </Spin>
    </div>

      <Modal
        className="dark-modal"
        title={t("userProfile.expenses.fixedExpenses.table.addInfo")}
        open={noteModal.visible}
        onOk={handleNoteSave}
        onCancel={handleNoteCancel}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Input.TextArea
          value={noteModal.note}
          onChange={handleNoteChange}
          rows={4}
          placeholder={t("userProfile.expenses.fixedExpenses.table.placeHolderInfo")}
        />
      </Modal>

      <Modal
        className="dark-modal"
        open={confirmPdfModal.visible}
        title={t("userProfile.expenses.fixedExpenses.table.keepDocumentModal.title")}
        onCancel={() => setConfirmPdfModal({ visible: false, id: null, row: null, oldPdfUrl: null })}
        footer={[
          <Button key="keep" type="primary" onClick={() => handleConfirmPdf(true)}>
            {t("userProfile.expenses.fixedExpenses.table.keepDocumentModal.keep")}
          </Button>,
          <Button key="remove" danger onClick={() => handleConfirmPdf(false)}>
            {t("userProfile.expenses.fixedExpenses.table.keepDocumentModal.remove")}
          </Button>
        ]}
      >
        {t("userProfile.expenses.fixedExpenses.table.keepDocumentModal.subtitle")}
      </Modal>

      {/* Edit Fixed Expense Modal */}
      <Modal
        className="edit-income-modal fixed-expense-edit"
        open={editModalVisible}
        footer={null}
        onCancel={() => { setEditModalVisible(false); setEditingPayment(null); }}
        centered
        width={520}
      >
        <div className="edit-income-modal-content">
          <div className="modal-header">
            <div className="modal-icon-container income-icon"><EditOutlined /></div>
            <div className="modal-title-section">
              <Typography.Title level={3} className="modal-title">Editar gasto fijo</Typography.Title>
              <Typography.Paragraph className="modal-subtitle">{t('userProfile.expenses.fixedExpenses.editModal.subtitle') || 'Edita los detalles del gasto fijo'}</Typography.Paragraph>
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleEditSubmit} className="edit-income-form">
            <Form.Item name="title" label={t('userProfile.expenses.fixedExpenses.table.title')} rules={[{ required: true }]} className="form-item-modern">
              <AutoComplete
                className="modern-input"
                options={titlesList.filter(Boolean).map(tit => ({ value: tit, label: tit }))}
                placeholder={t('userProfile.expenses.fixedExpenses.table.title')}
              />
            </Form.Item>

            <Row gutter={[16,16]}>
              <Col xs={12}>
                <Form.Item name="amountARS" label={t('userProfile.expenses.fixedExpenses.table.amountArs')} rules={[{ required: true }]} className="form-item-modern">
                  <NumericFormat customInput={Input} allowNegative={false} decimalScale={2} fixedDecimalScale thousandSeparator={i18n.language === 'es' ? '.' : ','} decimalSeparator={i18n.language === 'es' ? ',' : '.'} prefix={'$'} className="modern-input" />
                </Form.Item>
              </Col>
              <Col xs={12}>
                <Form.Item name="amountUSD" label={t('userProfile.expenses.fixedExpenses.table.amountUsd')} rules={[{ required: true }]} className="form-item-modern">
                  <NumericFormat customInput={Input} allowNegative={false} decimalScale={2} fixedDecimalScale thousandSeparator={i18n.language === 'es' ? '.' : ','} decimalSeparator={i18n.language === 'es' ? ',' : '.'} prefix={'$'} className="modern-input" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="paid" valuePropName="checked" className="form-item-modern">
              <Checkbox className="modern-checkbox" /> <span className="modern-checkbox-label" style={{ color: '#e6f7ff', verticalAlign: 'super', fontSize: 12, fontWeight: 600 }}>Pago realizado</span>
            </Form.Item>

            <Form.Item name="notes" label={t('userProfile.expenses.fixedExpenses.table.info')} className="form-item-modern">
              <Input.TextArea className="modern-textarea" rows={3} />
            </Form.Item>

            <div className="modal-section-label">
              {(() => {
                const base = t('userProfile.expenses.fixedExpenses.table.pdfFile') || 'Archivo PDF';
                const nameFromState = pdfFile && pdfFile.name ? pdfFile.name : null;
                let nameFromRecord = null;
                if (!nameFromState && editingPayment && editingPayment.pdfUrl) {
                  try {
                    const url = new URL(editingPayment.pdfUrl);
                    const path = url.pathname || '';
                    nameFromRecord = decodeURIComponent(path.substring(path.lastIndexOf('/') + 1)) || null;
                  } catch (e) {
                    const raw = editingPayment.pdfUrl;
                    const q = raw.indexOf('?');
                    const trimmed = q > -1 ? raw.substring(0, q) : raw;
                    nameFromRecord = decodeURIComponent(trimmed.substring(trimmed.lastIndexOf('/') + 1)) || null;
                  }
                }
                const currentName = nameFromState || nameFromRecord;
                const displayName = currentName
                  ? (currentName.length > 20 ? currentName.slice(0, 20) + '…' : currentName)
                  : null;
                const noFile = (t('userProfile.expenses.fixedExpenses.table.noFile') || 'Sin archivo');
                return `${base} (${displayName || noFile})`;
              })()}
            </div>
            <div className="pdf-upload-card" style={{ marginBottom: 16 }}>
              <label className="pdf-upload-inner" style={{ cursor: 'pointer' }}>
                <span className="pdf-icon-tile"><FilePdfOutlined /></span>
                <div className="pdf-texts">
                  <div className="pdf-title">Seleccionar archivo PDF</div>
                  <div className="pdf-subtitle">Haz clic para subir un PDF</div>
                </div>
                <span className="pdf-arrow">›</span>
                <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>

            <Button className="modern-submit-btn income-submit" type="primary" htmlType="submit" size="large" block loading={updating}>
              <EditOutlined /> {t('userProfile.incomes.table.editIncome.saveButton')}
            </Button>
          </Form>
        </div>
      </Modal>

    </>
  );
};

export default FixedExpenses;