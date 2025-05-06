import React, { useState, useEffect, useRef } from 'react';
import { Table, Input, Select, Tag, Space, message, Popconfirm, Tooltip, Avatar, Divider, Button, Modal, Empty, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, CheckCircleTwoTone, SyncOutlined, ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, UserOutlined, FileAddOutlined, FieldTimeOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ESTADOS = [
  { value: 'To Do', label: 'To Do', color: 'default', icon: <ClockCircleOutlined style={{ color: 'black', fontSize: 14, verticalAlign: 'middle', marginRight: 4, }} /> },
  { value: 'In Process', label: 'In Process', color: 'processing', icon: <SyncOutlined spin style={{ color: '#1890ff', fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} /> },
  { value: 'Done', label: 'Done', color: 'success', icon: <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }} /> },
];
const PRIORIDADES = [
  { value: 'Baja', label: 'Baja', color: 'blue', icon: <ArrowDownOutlined style={{ color: '#1890ff', fontSize: 14, verticalAlign: 'middle' }} /> },
  { value: 'Media', label: 'Media', color: 'orange', icon: <MinusOutlined style={{ color: '#faad14', fontSize: 14, verticalAlign: 'middle' }} /> },
  { value: 'Alta', label: 'Alta', color: 'red', icon: <ArrowUpOutlined style={{ color: '#d4380d', fontSize: 14, verticalAlign: 'middle' }} /> },
];
const ArrowRightIcon = () => <span style={{ display: 'inline-block', margin: '0 4px', color: '#aaa' }}>→</span>;

const ToDoList = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [editingField, setEditingField] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [historyModal, setHistoryModal] = useState({ open: false, history: [] });
  const inputRef = useRef(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const addTaskInputRef = useRef(null);
  const [creatingTask, setCreatingTask] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    if (!currentUser) return;
    const ref = collection(db, 'users');
    const unsub = onSnapshot(ref, snap => {
      const data = snap.docs.map(docu => ({ 
        id: docu.id, 
        ...docu.data(),
        label: docu.data().displayName || docu.data().email,
        value: docu.data().email,
        photoURL: docu.data().photoURL
      }));
      setUsers(data);
      // Establecer el usuario actual como seleccionado por defecto
      if (data.length > 0) {
        setSelectedUser(currentUser.email);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Cargar tareas
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const ref = collection(db, 'tasksToDo');
    const unsub = onSnapshot(ref, snap => {
      const data = snap.docs.map(docu => ({ id: docu.id, ...docu.data() }));
      // Ordenar por prioridad personalizada
      const prioridadOrden = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
      data.sort((a, b) => {
        const pa = prioridadOrden[a.prioridad] ?? 3;
        const pb = prioridadOrden[b.prioridad] ?? 3;
        if (pa !== pb) return pa - pb;
        // Si tienen la misma prioridad, ordenar por fecha de creación descendente
        return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
      });
      setTasks(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  // Para nombre y apellido
  const getUserName = () => currentUser?.displayName || currentUser?.email || 'Usuario';

  // Agregar tarea (solo nombre)
  const handleAdd = async () => {
    setAddModalOpen(true);
    setNewTaskName('');
    setSelectedUser(currentUser.email);
  };

  const handleAddTaskConfirm = async () => {
    if (!newTaskName.trim()) {
      message.error('Ingrese el nombre de la tarea');
      return;
    }
    if (!selectedUser) {
      message.error('Seleccione un usuario');
      return;
    }
    setCreatingTask(true);
    try {
      const now = new Date();
      await addDoc(collection(db, 'tasksToDo'), {
        descripcion: newTaskName.trim(),
        estado: 'To Do',
        asignado: selectedUser,
        prioridad: 'Baja',
        fechaCreacion: now.toISOString(),
        fechaFinalizacion: null,
        historial: [{
          fecha: now.toISOString(),
          usuario: getUserName(),
          cambios: [
            { campo: 'Descripción', antes: '', despues: newTaskName.trim() },
            { campo: 'Estado', antes: '', despues: 'To Do' },
            { campo: 'Asignado', antes: '', despues: selectedUser },
            { campo: 'Prioridad', antes: '', despues: 'Baja' }
          ]
        }]
      });
      setAddModalOpen(false);
      setNewTaskName('');
      message.success('Tarea creada');
    } catch (e) {
      message.error('Error al crear tarea');
    } finally {
      setCreatingTask(false);
    }
  };

  // Guardar edición inline
  const saveEdit = async (record, field, value) => {
    if (record[field] === value) {
      setEditingKey('');
      setEditingField('');
      return;
    }
    try {
      let cambios = [];
      let update = { ...record };
      if (field === 'estado' && record.estado !== 'Done' && value === 'Done') {
        update.fechaFinalizacion = new Date().toISOString();
        cambios.push({ campo: 'Finalizada', antes: record.estado, despues: 'Done' });
      }
      cambios.push({ campo: field.charAt(0).toUpperCase() + field.slice(1), antes: record[field], despues: value });
      const historial = [
        ...(record.historial || []),
        {
          fecha: new Date().toISOString(),
          usuario: getUserName(),
          cambios
        }
      ];
      await updateDoc(doc(db, 'tasksToDo', record.id), {
        ...record,
        [field]: value,
        fechaFinalizacion: update.fechaFinalizacion || record.fechaFinalizacion || null,
        historial
      });
      setEditingKey('');
      setEditingField('');
      message.success('Tarea actualizada');
    } catch (e) {
      message.error('Error al guardar');
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      title: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileTextOutlined style={{ color: '#bfbfbf' }} /> <span style={{ color: '#bfbfbf' }}>Descripción</span></div>,
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: '45%',
      onCell: (record) => ({
        record,
        editable: 'true',
        editing: editingKey === record.id && editingField === 'descripcion' ? 'true' : undefined,
        field: 'descripcion'
      }),
      render: (text, record) =>
        editingKey === record.id && editingField === 'descripcion' ? (
          <Input
            ref={inputRef}
            size="small"
            defaultValue={text}
            onBlur={e => saveEdit(record, 'descripcion', e.target.value)}
            onPressEnter={e => saveEdit(record, 'descripcion', e.target.value)}
            onChange={e => setEditingValue(e.target.value)}
            style={{ minWidth: 300 }}
            autoFocus
          />
        ) : (
          <div style={{ cursor: 'pointer', lineHeight: '16px', fontSize: 12 }} onClick={() => { setEditingKey(record.id); setEditingField('descripcion'); setEditingValue(text); }}>
            <span style={{ fontWeight: 500 }}>{text}</span>
          </div>
        )
    },
    {
      title: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClockCircleOutlined style={{ color: '#bfbfbf' }} /> <span style={{ color: '#bfbfbf' }}>Estado</span></div>,
      dataIndex: 'estado',
      key: 'estado',
      width: '5%',
      onCell: (record) => ({
        record,
        editable: 'true',
        editing: editingKey === record.id && editingField === 'estado' ? 'true' : undefined,
        field: 'estado'
      }),
      render: (estado, record) =>
        editingKey === record.id && editingField === 'estado' ? (
          <Select
            size="small"
            defaultValue={estado}
            style={{ minWidth: 110 }}
            options={ESTADOS}
            onBlur={e => saveEdit(record, 'estado', editingValue || estado)}
            onChange={val => { setEditingValue(val); saveEdit(record, 'estado', val); }}
            autoFocus
          />
        ) : (
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => { setEditingKey(record.id); setEditingField('estado'); setEditingValue(estado); }}>
            <Tag color={ESTADOS.find(e => e.value === estado)?.color} style={{ fontSize: 13, padding: '2px 8px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              {ESTADOS.find(e => e.value === estado)?.icon} {ESTADOS.find(e => e.value === estado)?.label || estado}
            </Tag>
          </div>
        )
    },
    {
      title: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserOutlined style={{ color: '#bfbfbf' }} /> <span style={{ color: '#bfbfbf' }}>Asignado</span></div>,
      dataIndex: 'asignado',
      key: 'asignado',
      width: '25%',
      onCell: (record) => ({
        record,
        editable: 'true',
        editing: editingKey === record.id && editingField === 'asignado' ? 'true' : undefined,
        field: 'asignado'
      }),
      render: (asignado, record) => {
        const user = users.find(u => (u.email || '').toLowerCase() === (asignado || '').toLowerCase());
        console.log('Usuario encontrado para asignado:', asignado, user);
        const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || asignado : asignado;
        if (editingKey === record.id && editingField === 'asignado') {
          return (
            <Select
              ref={inputRef}
              size="small"
              defaultValue={asignado}
              style={{ minWidth: 100 }}
              options={users.map(user => ({
                value: user.email,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar 
                      src={user.photoURL}
                      size={20}
                      style={{ backgroundColor: '#004479' }}
                      icon={<UserOutlined style={{ fontSize: 12, color: 'white' }} />}
                    >
                      {!user.photoURL && (user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase())}
                    </Avatar>
                    <span>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</span>
                  </div>
                )
              }))}
              onBlur={e => saveEdit(record, 'asignado', editingValue || asignado)}
              onChange={val => { setEditingValue(val); saveEdit(record, 'asignado', val); }}
              autoFocus
            />
          );
        }
        return (
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => { setEditingKey(record.id); setEditingField('asignado'); setEditingValue(asignado); }}>
            <Space>
              <Avatar
                src={user?.photoURL}
                style={{
                  backgroundColor: '#004479',
                  verticalAlign: 'middle',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgb(255, 255, 255)'
                }}
                size={26}
                icon={<UserOutlined style={{ fontSize: 13, color: 'white' }} />}
              >
                {!user?.photoURL && (user?.firstName ? user.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase())}
              </Avatar>
              <Tooltip title={user?.email || asignado}>
                <span>{displayName}</span>
              </Tooltip>
            </Space>
          </div>
        );
      }
    },
    {
      title: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircleOutlined style={{ color: '#bfbfbf' }} /> <span style={{ color: '#bfbfbf' }}>Finalizado</span></div>,
      dataIndex: 'fechaFinalizacion',
      key: 'fechaFinalizacion',
      width: '10%',
      render: (fecha) => fecha ? (
        <Tooltip title={new Date(fecha).toLocaleTimeString()}>
          <Tag color="#f0f0f0" style={{ color: '#555', fontWeight: 500, border: '1px solid #e0e0e0', fontWeight: 600 }}>{new Date(fecha).toLocaleDateString()}</Tag>
        </Tooltip>
      ) : ''
    },
    {
      title: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ExclamationCircleOutlined style={{ color: '#bfbfbf' }} /> <span style={{ color: '#bfbfbf' }}>Prioridad</span></div>,
      dataIndex: 'prioridad',
      key: 'prioridad',
      width: '5%',
      onCell: (record) => ({
        record,
        editable: 'true',
        editing: editingKey === record.id && editingField === 'prioridad' ? 'true' : undefined,
        field: 'prioridad'
      }),
      render: (prioridad, record) =>
        editingKey === record.id && editingField === 'prioridad' ? (
          <Select
            size="small"
            defaultValue={prioridad}
            style={{ minWidth: 90 }}
            options={PRIORIDADES}
            onBlur={e => saveEdit(record, 'prioridad', editingValue || prioridad)}
            onChange={val => { setEditingValue(val); saveEdit(record, 'prioridad', val); }}
            autoFocus
          />
        ) : (
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => { setEditingKey(record.id); setEditingField('prioridad'); setEditingValue(prioridad); }}>
            <Tag color={PRIORIDADES.find(p => p.value === prioridad)?.color} style={{ fontSize: 13, padding: '2px 8px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <span style={{ marginRight: 3 }}>{PRIORIDADES.find(p => p.value === prioridad)?.icon}</span> {PRIORIDADES.find(p => p.value === prioridad)?.label || prioridad}
            </Tag>
          </div>
        )
    },
    {
      title: <div style={{ textAlign: 'center' }}><HistoryOutlined /></div>,
      dataIndex: 'historial',
      key: 'historial',
      width: '5%',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Tooltip title="Ver historial de cambios">
            <Button icon={<HistoryOutlined />} style={{ borderColor: '#13c2c2', color: '#13c2c2' }} size="small" onClick={() => setHistoryModal({ open: true, history: record.historial || [] })} />
          </Tooltip>
        </div>
      )
    },
    {
      title: <div style={{ textAlign: 'center' }}><DeleteOutlined /></div>,
      key: 'acciones',
      width: '5%',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Popconfirm title="¿Eliminar tarea?" onConfirm={() => handleDelete(record)} okText="Sí" cancelText="No">
              <Button icon={<DeleteOutlined />} danger size="small" />
            </Popconfirm>
          </Space>
        </div>
      )
    }
  ];

  // Eliminar tarea
  const handleDelete = async (task) => {
    await deleteDoc(doc(db, 'tasksToDo', task.id));
    message.success('Tarea eliminada');
  };

  // Columnas para la tabla de tareas finalizadas (sin edición ni acciones)
  const finishedColumns = columns.filter(col => col.dataIndex !== 'historial' && col.key !== 'acciones' && col.key !== 'historial');
  // Elimina lógica de edición en los renders de estas columnas
  const finishedColumnsNoEdit = finishedColumns.map(col => {
    if (!col.render) return col;
    return {
      ...col,
      render: (value, record) => {
        // Para las columnas editables, solo muestra el valor renderizado sin lógica de edición
        if (col.dataIndex === 'descripcion') {
          return <span style={{ fontWeight: 500 }}>{value}</span>;
        }
        if (col.dataIndex === 'estado') {
          const estadoObj = ESTADOS.find(e => e.value === value);
          return (
            <Tag color={estadoObj?.color} style={{ fontSize: 13, padding: '2px 8px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              {estadoObj?.icon} {estadoObj?.label || value}
            </Tag>
          );
        }
        if (col.dataIndex === 'asignado') {
          const user = users.find(u => (u.email || '').toLowerCase() === (value || '').toLowerCase());
          const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || value : value;
          return (
            <Space>
              <Avatar
                src={user?.photoURL}
                style={{
                  backgroundColor: '#004479',
                  verticalAlign: 'middle',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgb(255, 255, 255)'
                }}
                size={26}
                icon={<UserOutlined style={{ fontSize: 13, color: 'white' }} />}
              >
                {!user?.photoURL && (user?.firstName ? user.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase())}
              </Avatar>
              <Tooltip title={user?.email || value}>
                <span>{displayName}</span>
              </Tooltip>
            </Space>
          );
        }
        if (col.dataIndex === 'fechaFinalizacion') {
          return value ? (
            <Tooltip title={new Date(value).toLocaleTimeString()}>
              <Tag color="#f0f0f0" style={{ color: '#555', fontWeight: 500, border: '1px solid #e0e0e0', fontWeight: 600 }}>{new Date(value).toLocaleDateString()}</Tag>
            </Tooltip>
          ) : '';
        }
        if (col.dataIndex === 'prioridad') {
          const prioridadObj = PRIORIDADES.find(p => p.value === value);
          return (
            <Tag color={prioridadObj?.color} style={{ fontSize: 13, padding: '2px 8px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <span style={{ marginRight: 3 }}>{prioridadObj?.icon}</span> {prioridadObj?.label || value}
            </Tag>
          );
        }
        return col.render(value, record);
      }
    };
  });

  // Contadores para el título
  const totalTareas = tasks.length;
  const tareasFinalizadas = tasks.filter(t => t.estado === 'Done').length;

  // Enfocar el input cuando se abre el modal de agregar tarea
  useEffect(() => {
    if (addModalOpen) {
      setTimeout(() => {
        if (addTaskInputRef.current) {
          addTaskInputRef.current.focus();
        }
      }, 100);
    }
  }, [addModalOpen]);

  return (
    <div className="container-page">
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Spin size="large" tip="Cargando tareas..." />
        </div>
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="table-responsive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
              Tareas pendientes
              <span style={{ fontWeight: 500, color: '#888', fontSize: 15 }}>
                ({tareasFinalizadas}/{totalTareas})
              </span>
            </div>
            <Tooltip title="Nueva tarea">
              <Button
                type="primary"
                shape="circle"
                icon={<PlusOutlined style={{ fontSize: 18 }} />}
                onClick={handleAdd}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px #1890ff22',
                  background: 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
                  border: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #40a9ff 0%, #1890ff 100%)'}
                onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)'}
              />
            </Tooltip>
          </div>
          {tasks.filter(t => t.estado !== 'Done').length > 0 ? (
            <Table
              columns={columns}
              dataSource={tasks.filter(t => t.estado !== 'Done')}
              rowKey={record => record.id}
              loading={loading}
              bordered
              size="small"
              pagination={{ pageSize: 6 }}
            />
          ) : !loading && (
            <div style={{
              margin: '20px auto',
              maxWidth: '100%',
              background: '#fafbfc',
              borderRadius: 16,
              padding: '40px 0',
              boxShadow: '0 2px 12px #0001',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Empty
                description={<span style={{ color: '#888', fontWeight: 500, fontSize: 18 }}>No hay tareas pendientes</span>}
                image={<FileTextOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
              />
            </div>
          )}
        </div>
        {/* Tabla de tareas finalizadas */}
        <div className="table-responsive" style={{ marginTop: 40 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#555' }}>Tareas finalizadas</div>
          {tasks.filter(t => t.estado === 'Done').length > 0 ? (
            <Table
              columns={finishedColumnsNoEdit}
              dataSource={tasks.filter(t => t.estado === 'Done')}
              rowKey={record => record.id}
              bordered
              size="small"
              pagination={{ pageSize: 6 }}
            />
          ) : !loading && (
            <div style={{
              margin: '20px auto',
              maxWidth: '100%',
              background: '#fafbfc',
              borderRadius: 16,
              padding: '40px 0',
              boxShadow: '0 2px 12px #0001',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Empty
                description={<span style={{ color: '#888', fontWeight: 500, fontSize: 18 }}>No hay tareas finalizadas</span>}
                image={<CheckCircleOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
              />
            </div>
          )}
        </div>
      </div>
      {/* Modal de historial */}
      <Modal
        open={historyModal.open}
        onCancel={() => setHistoryModal({ open: false, history: [] })}
        title="Historial de cambios"
        footer={null}
      >
        {/* Bloque de creación sticky arriba */}
        {historyModal.history && historyModal.history.length > 0 && (() => {
          const h = historyModal.history[0];
          const user = users.find(u => (u.email || '').toLowerCase() === (h.usuario || '').toLowerCase());
          const nombreCompleto = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || h.usuario : h.usuario;
          return (
            <div style={{
              background: '#f6ffed',
              borderRadius: 8,
              marginBottom: 20,
              boxShadow: '0 1px 4px #0001',
              border: '1px solid #b7eb8f',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              padding: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f6ffed',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderBottom: '1px solid #b7eb8f',
                padding: '14px 14px 10px 14px',
                boxShadow: '0 6px 16px -8px #b7eb8f99',
              }}>
                <Tooltip title={new Date(h.fecha).toLocaleString()}>
                  <FieldTimeOutlined style={{ color: '#888', marginRight: 6 }} />
                  <span style={{ fontWeight: 500 }}>{new Date(h.fecha).toLocaleDateString()} {new Date(h.fecha).toLocaleTimeString()}</span>
                </Tooltip>
                <span style={{ margin: '0 10px', color: '#aaa' }}>|</span>
                <UserOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                <span style={{ fontWeight: 500 }}>{nombreCompleto}</span>
                <Tag color="green" style={{ marginLeft: 10 }} icon={<FileAddOutlined />}>Creación</Tag>
              </div>
            </div>
          );
        })()}
        {/* Resto del historial scrolleable */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {historyModal.history && historyModal.history.length > 1 ? (
            historyModal.history.slice(1).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((h, i) => {
              const user = users.find(u => (u.email || '').toLowerCase() === (h.usuario || '').toLowerCase());
              const nombreCompleto = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || h.usuario : h.usuario;
              return (
                <div key={i} style={{
                  background: i % 2 === 0 ? '#fafbfc' : '#f0f5ff',
                  borderRadius: 8,
                  marginBottom: 16,
                  padding: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <Tooltip title={new Date(h.fecha).toLocaleString()}>
                      <FieldTimeOutlined style={{ color: '#888', marginRight: 6 }} />
                      <span style={{ fontWeight: 500 }}>{new Date(h.fecha).toLocaleDateString()} {new Date(h.fecha).toLocaleTimeString()}</span>
                    </Tooltip>
                    <span style={{ margin: '0 10px', color: '#aaa' }}>|</span>
                    <UserOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                    <span style={{ fontWeight: 500 }}>{nombreCompleto}</span>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {Array.isArray(h.cambios)
                      ? h.cambios.map((c, j) => {
                          let antes = c.antes;
                          let despues = c.despues;
                          if (c.campo === 'Asignado') {
                            const userAntes = users.find(u => (u.email || '').toLowerCase() === (c.antes || '').toLowerCase());
                            const userDespues = users.find(u => (u.email || '').toLowerCase() === (c.despues || '').toLowerCase());
                            antes = userAntes ? `${userAntes.firstName || ''} ${userAntes.lastName || ''}`.trim() || userAntes.email || c.antes : c.antes;
                            despues = userDespues ? `${userDespues.firstName || ''} ${userDespues.lastName || ''}`.trim() || userDespues.email || c.despues : c.despues;
                          }
                          return (
                            <li key={j} style={{ marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                              <Tag color="blue" style={{ marginRight: 8, minWidth: 90, textAlign: 'center' }}>{c.campo}</Tag>
                              {c.campo === 'Finalizada' ? <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginRight: 6 }} /> : <EditOutlined style={{ color: '#faad14', marginRight: 6 }} />}
                              <span style={{ color: '#888', textDecoration: 'line-through', marginRight: 6 }}>{antes || <i>vacío</i>}</span>
                              <span style={{ color: '#1890ff', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 6, display: 'flex', alignItems: 'center' }}><ArrowRightIcon /></span>
                                {despues || <i>vacío</i>}
                              </span>
                            </li>
                          );
                        })
                      : <li>{h.cambios}</li>}
                  </ul>
                </div>
              );
            })
          ) : <div style={{ textAlign: 'center', color: '#888' }}>No hay historial</div>}
        </div>
      </Modal>
      {/* Modal de alta rápida */}
      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddTaskConfirm}
        okText="Crear"
        cancelText="Cancelar"
        title={null}
        footer={null}
        centered
        styles={{
          body: {
            padding: '0px 32px 16px 32px',
            textAlign: 'center',
            borderRadius: 16
          }
        }}
      >
        <div style={{ marginBottom: 18, fontWeight: 600, fontSize: 20, color: '#222' }}>
          Nueva tarea
        </div>
        <Input
          ref={addTaskInputRef}
          placeholder="Nombre de la tarea..."
          value={newTaskName}
          onChange={e => setNewTaskName(e.target.value)}
          onPressEnter={handleAddTaskConfirm}
          style={{ fontSize: 16, padding: 10, borderRadius: 8, marginBottom: 18, boxShadow: '0 1px 4px #0001' }}
        />
        <Select
          placeholder="Seleccionar usuario"
          value={selectedUser}
          onChange={setSelectedUser}
          options={users.map(user => ({
            value: user.email,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar 
                  src={user.photoURL}
                  size={20}
                  style={{ backgroundColor: '#004479' }}
                  icon={<UserOutlined style={{ fontSize: 12, color: 'white' }} />}
                >
                  {!user.photoURL && (user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase())}
                </Avatar>
                <span>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</span>
              </div>
            )
          }))}
          style={{ width: '100%', marginBottom: 18 }}
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label?.props?.children[1]?.props?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        <div>
          <Button
            type="primary"
            onClick={handleAddTaskConfirm}
            style={{ minWidth: 150, fontWeight: 500 }}
            loading={creatingTask}
            disabled={creatingTask}
          >
            Crear
          </Button>
          <Button onClick={() => setAddModalOpen(false)} style={{ minWidth: 90 }} disabled={creatingTask}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ToDoList; 