import React from 'react';
import { Tag } from 'antd';

const { CheckableTag } = Tag;

/* Colores fijos */
const COLORS = {
  ARS: 'rgb(0 132 197)', // azul Ant Design
  USD: 'rgb(1 163 90)', // verde Ant Design
};

const CurrencyTagPicker = ({ value, onChange }) => {
  const renderTag = (code, label) => {
    const checked = value === code;
    const color   = COLORS[code];

    return (
      <CheckableTag
        key={code}
        checked={checked}
        onChange={() => onChange(code)}
        style={{
          userSelect: 'none',
          backgroundColor: checked ? color : '#fafafa',
          borderColor:     checked ? color : '#e5e5e5',
          paddingInline:   5,
          fontSize: 10,
          marginBottom: 4,
        }}
      >
        {label}
      </CheckableTag>
    );
  };

  return (
    <div style={{ display: 'inline-flex', flexFlow: 'row' }}>
      {renderTag('ARS', 'AR$')}
      {renderTag('USD', 'U$D')}
    </div>
  );
};

export default CurrencyTagPicker;
