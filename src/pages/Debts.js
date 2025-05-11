import React, { useState, useEffect }                                   from 'react';
import { Spin, Empty, Table, Button, Input, Checkbox, Popconfirm, Form, message, Tag, AutoComplete, Modal, Tooltip } from 'antd';
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
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, InfoCircleOutlined, SettingOutlined, FilePdfOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';

const Debts = () => {
  const [loading, setLoading]             = useState(true);
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const currentMonthKey = dayjs().format('YYYY-MM');
  const [noteModal, setNoteModal] = useState({ visible: false, id: null, note: '' });
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [confirmPdfModal, setConfirmPdfModal] = useState({ visible: false, id: null, row: null, oldPdfUrl: null });

  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasExpenses } = useMonthlyMovements();

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
    const unsub = onSnapshot(ref, snap => {
      const data = snap.exists() ? snap.data().payments || [] : [];
      setMonthlyPayments(data);
      setMpLoading(false);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser, currentMonthKey]);

  const saveMonthlyPayments = async (data) => {
    if (!currentUser) return;
    const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, currentMonthKey);
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
        message.success('Pago actualizado');
      }
    } catch (err) {
      // Solo mostrar notificación de error si no es un error de validación
      if (err.errorFields && err.errorFields.length > 0) {
        // Hay errores de validación, no mostramos notificación
        return;
      }
      message.error('Error al guardar');
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
    message.success('Pago eliminado');
  };

  const isEditing = (record) => record.id === editingKey;

  // Obtener títulos únicos para autocompletar
  const titlesList = Array.from(new Set(monthlyPayments.map(p => p.title).filter(Boolean))).sort();

  const columns = [
    {
      title: 'Título',
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
      title: 'Monto ARS',
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
      title: 'Monto USD',
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
      title: 'Pago',
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
      title: 'Info',
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
      title: 'PDF',
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
                <Tag icon={<EditOutlined />} onClick={() => edit(record)} style={{ cursor: 'pointer', margin: 0 }} />
                <Popconfirm title="¿Seguro que deseas eliminar?" onConfirm={() => handleDelete(record.id)}>
                  <Tag icon={<DeleteOutlined />} color="red" style={{ cursor: 'pointer', margin: 0 }} />
                </Popconfirm>
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
      <Table
        bordered
        dataSource={monthlyPayments}
        columns={columns}
        rowKey="id"
        loading={mpLoading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: true }}
        size="medium"
        locale={{
          emptyText: <Empty description={"No hay pagos registrados en este mes"} />
        }}
      />
      {/* Totales debajo de la tabla */}
      {savedPayments.length > 0 && (
        <div
          style={{
            textAlign: 'left',
            marginTop: 0,
            marginLeft: 2,
            borderRadius: 10,
            background: '#fff',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
            padding: '14px 20px',
            maxWidth: 240,
            border: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, color: '#222' }}>
            Total ARS:
            <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 16, color: '#0071de' }}>
              ${totalARS.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}
            </span>
              </div>
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0 8px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, color: '#222' }}>
            Total USD:
            <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 16, color: '#0071de' }}>
              ${totalUSD.toLocaleString(i18n.language === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 2 })}
            </span>
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

          {hasExpenses ? <EditableTable />:

        // EMPTY DATA MESSAGE
        <div style={{ marginTop: 40 }}>
            <Empty description={t("No hay gastos registrados en este mes")}/>
        </div>}

      </Spin>
    </div>

      <Modal
        title="Agregar información"
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
          placeholder="Agrega una nota para este pago"
        />
      </Modal>

      <Modal
        open={confirmPdfModal.visible}
        title="¿Qué hacer con el documento adjunto?"
        onCancel={() => setConfirmPdfModal({ visible: false, id: null, row: null, oldPdfUrl: null })}
        footer={[
          <Button key="keep" type="primary" onClick={() => handleConfirmPdf(true)}>
            Mantener documento
          </Button>,
          <Button key="remove" danger onClick={() => handleConfirmPdf(false)}>
            Eliminar documento
          </Button>
        ]}
      >
        Este pago tiene un documento adjunto. ¿Quieres mantenerlo o eliminarlo?
      </Modal>

    </>
  );
};

export default Debts;