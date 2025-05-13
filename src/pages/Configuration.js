import React, { useEffect, useState } from 'react';
import { Table, Select, Tag, Spin, notification, Typography, Popconfirm, Button } from 'antd';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { DeleteOutlined } from '@ant-design/icons';

const USER_LEVELS = [
  { value: 0, label: 'Administrador', color: 'cyan' },
  { value: 1, label: 'Gratuito', color: 'blue' },
  { value: 2, label: 'Premium', color: 'purple' },
  { value: 3, label: 'Black', color: 'black' },
];

const Configuration = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const { Title, Text } = Typography;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const usersArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        usersArr.sort((a, b) => {
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setUsers(usersArr);
      } catch (e) {
        notification.error({ message: 'Error al cargar usuarios' });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLevelChange = async (userId, newLevel) => {
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { user_access_level: newLevel });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_access_level: newLevel } : u));
      notification.success({ message: 'Nivel actualizado' });
    } catch (e) {
      notification.error({ message: 'Error al actualizar nivel' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setUpdatingId(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      notification.success({ message: 'Usuario eliminado permanentemente' });
    } catch (e) {
      console.error('Error al eliminar usuario:', e);
      notification.error({ message: 'Error al eliminar usuario' });
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'firstName',
      key: 'firstName',
      render: (text, record) => `${record.firstName || ''} ${record.lastName || ''}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Nivel actual',
      dataIndex: 'user_access_level',
      key: 'user_access_level',
      render: (level) => {
        const lvl = USER_LEVELS.find(l => l.value === level);
        return lvl ? <Tag color={lvl.color}>{lvl.label}</Tag> : level;
      },
    },
    {
      title: 'Cambiar nivel',
      key: 'change',
      render: (_, record) => (
        <Select
          value={record.user_access_level}
          style={{ minWidth: 120 }}
          onChange={val => handleLevelChange(record.id, val)}
          loading={updatingId === record.id}
        >
          {USER_LEVELS.map(lvl => (
            <Select.Option key={lvl.value} value={lvl.value}>{lvl.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Eliminar',
      key: 'delete',
      render: (_, record) => (
        <Popconfirm
          title={`¿Seguro que deseas eliminar a ${record.firstName || ''} ${record.lastName || ''}?`}
          onConfirm={() => handleDeleteUser(record.id)}
          okText="Sí"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} loading={updatingId === record.id} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 10 }}>
      <Title level={2} style={{ fontSize: 18 }}>Configuración de Usuarios <span style={{ fontSize: 14, color: '#666' }}>({users.length})</span></Title>
      <Spin spinning={loading}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Spin>
    </div>
  );
};

export default Configuration; 