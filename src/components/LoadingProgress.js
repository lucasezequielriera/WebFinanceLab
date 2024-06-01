import React from 'react';
import { Progress, Typography } from 'antd';
import '../styles/LoadingProgress.css'; // Importa los estilos

const { Text } = Typography;

const LoadingProgress = ({ percent }) => {
  return (
    <div className="loading-progress-container">
      <Progress type="circle" percent={percent} />
      <Text className="loading-text">Manager Money</Text>
    </div>
  );
};

export default LoadingProgress;
