import React from 'react';
import { Card, Radio, Typography, Divider, Space, message, Spin, Button } from 'antd';
import { SettingOutlined, EyeOutlined, LayoutOutlined, AppstoreOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DashboardConfig = () => {
  const { t } = useTranslation();
  const { expenseViewMode, updateExpenseViewMode, loading } = useDashboardConfig();
  const navigate = useNavigate();

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    updateExpenseViewMode(newMode);
    message.success('Configuración guardada exitosamente');
  };

  const viewModes = [
    {
      value: 'separated',
      label: 'Separados',
      description: 'Gastos fijos y diarios en cards independientes para USD y Pesos',
      icon: <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      iconSelected: <AppstoreOutlined style={{ fontSize: '24px', color: 'white' }} />,
      preview: 'Cards separadas con información específica de cada tipo de gasto'
    },
    {
      value: 'unified',
      label: 'Unificados',
      description: 'Todos los gastos en una sola card simple para cada moneda',
      icon: <LayoutOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      iconSelected: <LayoutOutlined style={{ fontSize: '24px', color: 'white' }} />,
      preview: 'Una card con total de gastos y variación mensual por moneda'
    },
    {
      value: 'hybrid',
      label: 'Híbrido',
      description: 'Total unificado con desglose detallado para cada moneda',
      icon: <EyeOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      iconSelected: <EyeOutlined style={{ fontSize: '24px', color: 'white' }} />,
      preview: 'Total principal + desglose visual de cada tipo de gasto por moneda'
    }
  ];

  return (
    <div style={{ padding: '48px 60px', width: '100%' }}>
      <Spin spinning={loading}>
        <Card style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
          {/* Header con botón de regreso */}
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Title level={2} style={{ margin: 0, color: '#262626' }}>
                Configuración del Dashboard
              </Title>
            </div>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/configuration')}
              type="text"
            >
              Volver
            </Button>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <SettingOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>
                  Vista de Gastos
                </Title>
              </div>
              <Text style={{ color: '#8c8c8c', fontSize: '16px' }}>
                Elige cómo quieres ver los gastos fijos y diarios (USD y Pesos)
              </Text>
            </div>

            <Radio.Group
              value={expenseViewMode}
              onChange={handleModeChange}
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {viewModes.map((mode) => (
                  <div key={mode.value} style={{ 
                    border: expenseViewMode === mode.value ? '2px solid #1890ff' : '2px solid #e8e8e8',
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: expenseViewMode === mode.value ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' : '#fff',
                    boxShadow: expenseViewMode === mode.value 
                      ? '0 8px 24px rgba(24, 144, 255, 0.15)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (expenseViewMode !== mode.value) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expenseViewMode !== mode.value) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                    }
                  }}>
                    {/* Decorative element */}
                    {expenseViewMode === mode.value && (
                      <div style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(64, 169, 255, 0.1))',
                        borderRadius: '50%',
                        zIndex: 1
                      }} />
                    )}
                    
                    <Radio 
                      value={mode.value} 
                      style={{ 
                        width: '100%',
                        margin: 0,
                        fontSize: '16px',
                        position: 'relative',
                        zIndex: 2
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: expenseViewMode === mode.value 
                            ? 'linear-gradient(135deg, #1890ff, #40a9ff)'
                            : 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: expenseViewMode === mode.value 
                            ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                            : '0 2px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                          {expenseViewMode === mode.value ? mode.iconSelected : mode.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: '18px', 
                            color: expenseViewMode === mode.value ? '#1890ff' : '#262626',
                            marginBottom: '4px'
                          }}>
                            {mode.label}
                            {expenseViewMode === mode.value && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#40a9ff',
                                marginLeft: '8px',
                                fontWeight: 'normal'
                              }}>
                                (Activo)
                              </span>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: expenseViewMode === mode.value ? '#40a9ff' : '#8c8c8c',
                            marginBottom: '8px'
                          }}>
                            {mode.description}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: expenseViewMode === mode.value ? '#1890ff' : '#666',
                            opacity: 0.8
                          }}>
                            {mode.preview}
                          </div>
                        </div>
                      </div>
                    </Radio>
                  </div>
                ))}
              </div>
            </Radio.Group>
          </div>

          <div style={{ 
            marginTop: '32px', 
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(64, 169, 255, 0.02) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(24, 144, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(64, 169, 255, 0.05))',
              borderRadius: '50%',
              zIndex: 1
            }} />
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                </div>
                <Text strong style={{ color: '#1890ff', fontSize: '16px', margin: 0 }}>
                  Consejo
                </Text>
              </div>
              <Text style={{ 
                color: '#1890ff', 
                fontSize: '14px', 
                lineHeight: '1.6',
                margin: 0,
                opacity: 0.8
              }}>
                La vista <strong style={{ color: '#1890ff' }}>Separados</strong> es recomendada para la mayoría de usuarios, ya que permite 
                analizar cada tipo de gasto por separado con información específica y detallada.
              </Text>
            </div>
          </div>

        </Card>
      </Spin>
    </div>
  );
};

export default DashboardConfig;
