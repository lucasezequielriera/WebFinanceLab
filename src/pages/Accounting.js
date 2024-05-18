import React from 'react';
import AddIncome from '../components/AddIncome'; // Asegúrate de que la ruta sea correcta
import { Row, Col } from 'antd';

const Accounting = () => {
  return (
    <div>
      <h1>Accounting</h1>
      <Row gutter={16}>
        <Col span={24}>
          <AddIncome />
        </Col>
      </Row>
    </div>
  );
};

export default Accounting;
