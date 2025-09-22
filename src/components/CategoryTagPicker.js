import React, { useState } from 'react';
import { Tag, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { CheckableTag } = Tag;

const CategoryTagPicker = ({ categories, value, onChange, onNewCategory }) => {
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState('');

  const addCat = () => {
    const cat = newCat.trim();
    if (cat && !categories.includes(cat)) {
      onChange(cat);           // selecciona la nueva
      onNewCategory?.(cat);    // avisa al padre para que aparezca en la lista
    }
    setAdding(false);
    setNewCat('');
  };

  const renderTag = (cat, idx) => {
    const checked = value === cat;

    return (
      <CheckableTag
        key={cat}
        checked={checked}
        onChange={(chk) => chk && onChange(cat)}
        className={`modern-category-tag ${checked ? 'selected' : ''}`}
        style={{
          marginBottom: 8, 
          marginRight: 8,
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: checked 
            ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%)'
            : 'rgba(255, 255, 255, 0.05)',
          color: checked ? 'white' : 'rgba(255, 255, 255, 0.8)',
          fontWeight: checked ? '600' : '500',
          fontSize: '14px',
          padding: '6px 16px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          boxShadow: checked 
            ? '0 4px 12px rgba(24, 144, 255, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2)'
            : 'none',
          transform: checked ? 'translateY(-1px)' : 'none'
        }}
      >
        {cat}
      </CheckableTag>
    );
  };

  return (
    <>
      {categories.map(renderTag)}

      {/* Botón para agregar nueva categoría */}
      {!adding ? (
        <Tag
          className="modern-add-category-tag"
          style={{
            cursor: 'pointer',
            marginBottom: 8,
            marginRight: 8,
            borderRadius: '12px',
            border: '1px solid rgba(24, 144, 255, 0.3)',
            background: 'rgba(24, 144, 255, 0.1)',
            color: '#69c0ff',
            fontWeight: '600',
            fontSize: '14px',
            padding: '6px 16px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={() => setAdding(true)}
        >
          <PlusOutlined style={{ fontSize: '12px' }} />
          Nueva
        </Tag>
      ) : (
        <Input
          className="modern-category-input"
          size="small"
          autoFocus
          style={{ 
            width: 120,
            marginBottom: 8,
            marginRight: 8,
            borderRadius: '12px',
            border: '1px solid rgba(24, 144, 255, 0.5)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white'
          }}
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onBlur={addCat}
          onPressEnter={addCat}
          placeholder="Nombre"
        />
      )}
    </>
  );
};

export default CategoryTagPicker;