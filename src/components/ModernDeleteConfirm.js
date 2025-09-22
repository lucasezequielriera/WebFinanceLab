import React, { useState } from 'react';
import { Popconfirm, Button, Modal } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './ModernDeleteConfirm.css';

const ModernDeleteConfirm = ({ 
  title, 
  description, 
  onConfirm, 
  onCancel, 
  okText = "Eliminar", 
  cancelText = "Cancelar",
  children,
  ...props 
}) => {
  const [visible, setVisible] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setVisible(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setVisible(false);
  };

  return (
    <>
      <div onClick={() => setVisible(true)}>
        {children}
      </div>
      
      <Modal
        open={visible}
        onCancel={handleCancel}
        footer={null}
        className="modern-delete-modal"
        centered
        width={400}
      >
        <div className="delete-modal-content">
          <div className="delete-modal-header">
            <div className="delete-modal-icon">
              <ExclamationCircleOutlined />
            </div>
            <div className="delete-modal-title-section">
              <h3 className="delete-modal-title">
                {title || "¿Eliminar elemento?"}
              </h3>
              <p className="delete-modal-description">
                {description || "Esta acción no se puede deshacer."}
              </p>
            </div>
          </div>

          <div className="delete-modal-actions">
            <Button
              className="delete-cancel-btn"
              onClick={handleCancel}
              size="large"
            >
              {cancelText}
            </Button>
            <Button
              className="delete-confirm-btn"
              type="primary"
              danger
              onClick={handleConfirm}
              size="large"
              icon={<DeleteOutlined />}
            >
              {okText}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ModernDeleteConfirm;
