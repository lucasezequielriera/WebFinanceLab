import React, { useState } from 'react';
import { Tag, Input } from 'antd';

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
    // const base    = palette[idx % palette.length];

    return (
      <CheckableTag
        key={cat}
        checked={checked}
        onChange={(chk) => chk && onChange(cat)}
        color="default"
        style={{
         // userSelect: 'none',
         backgroundColor: checked ? "#58a67ad9" : '#fafafa',
         // color:           checked ? '#fff' : base,
         borderColor:     checked ? "#58a67ad9" : '#e5e5e5',
          marginBottom: 4, marginRight: 4
        }}
      >
        {cat}
      </CheckableTag>
    );
  };

  return (
    <>
      {categories.map(renderTag)}

      {/* botón “+ Nueva” queda igual */}
      {!adding ? (
        <Tag
          color="default"
          style={{ cursor: 'pointer' }}
          onClick={() => setAdding(true)}
        >
          +
        </Tag>
      ) : (
        <Input
          size="small"
          autoFocus
          style={{ width: 120 }}
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