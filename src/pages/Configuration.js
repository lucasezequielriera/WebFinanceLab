import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, Space } from 'antd';
import { 
  SettingOutlined, 
  DashboardOutlined, 
  BellOutlined, 
  BgColorsOutlined, 
  GlobalOutlined, 
  SafetyOutlined,
  UserOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Configuration = () => {
  const navigate = useNavigate();

  const configurationSections = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      description: 'Configurar la visualización del dashboard y las cards',
      icon: <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      available: true,
      path: '/configuration/dashboard'
    },
    {
      key: 'notifications',
      title: 'Notificaciones',
      description: 'Gestionar alertas y recordatorios',
      icon: <BellOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      available: false,
      comingSoon: true
    },
    {
      key: 'theme',
      title: 'Tema y Apariencia',
      description: 'Personalizar colores y estilo visual',
      icon: <BgColorsOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      available: false,
      comingSoon: true
    },
    {
      key: 'language',
      title: 'Idioma',
      description: 'Cambiar idioma de la aplicación',
      icon: <GlobalOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      available: true,
      path: '/configuration/language'
    },
    {
      key: 'privacy',
      title: 'Privacidad',
      description: 'Configurar privacidad y seguridad',
      icon: <SafetyOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
      available: false,
      comingSoon: true
    },
    {
      key: 'profile',
      title: 'Perfil',
      description: 'Información personal y preferencias',
      icon: <UserOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
      available: true,
      path: '/configuration/profile'
    }
  ];

  const handleSectionClick = (section) => {
    if (section.available) {
      navigate(section.path);
    }
  };

  return (
    <div style={{ 
      padding: '48px 60px', 
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '8px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(24, 144, 255, 0.25)'
          }}>
            <SettingOutlined style={{ fontSize: '24px', color: 'white' }} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: '#262626', fontSize: '24px' }}>
              Configuración
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: '15px' }}>
              Personaliza tu experiencia en WebFinanceLab
            </Text>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: '64px' }}>
          {configurationSections.map((section) => (
            <Col xs={24} sm={12} lg={8} key={section.key}>
              <Card
                hoverable={section.available}
                style={{
                  height: '100%',
                  borderRadius: 16,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
                  boxShadow: section.available 
                    ? '0 6px 24px rgba(0,0,0,0.12)'
                    : '0 3px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: section.available ? 'pointer' : 'not-allowed',
                  opacity: section.available ? 1 : 0.7,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                bodyStyle={{ 
                  padding: '20px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'transparent'
                }}
                className="custom-card-body"
                onClick={() => handleSectionClick(section)}
                onMouseEnter={(e) => {
                  if (section.available) {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (section.available) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
                  }
                }}
              >
                {/* Decorative background element */}
                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  background: section.available 
                    ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(64, 169, 255, 0.1))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  borderRadius: '50%',
                  zIndex: 1
                }} />

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 2
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #4a5568, #2d3748)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)'
                  }}>
                    {section.icon}
                  </div>
                  
                  
                  {section.comingSoon && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#a0aec0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      Próximamente
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                  <Title level={4} style={{ 
                    margin: 0, 
                    marginBottom: '8px',
                    color: section.available ? '#ffffff' : '#a0aec0',
                    fontSize: '16px',
                    fontWeight: 600
                  }}>
                    {section.title}
                  </Title>
                  <Text style={{ 
                    color: section.available ? '#e2e8f0' : '#718096',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    {section.description}
                  </Text>
                </div>

                {section.available && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '8px 0 0 0',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Text style={{ 
                        color: '#60a5fa',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        Configurar
                      </Text>
                      <RightOutlined style={{ 
                        color: '#60a5fa',
                        fontSize: '12px'
                      }} />
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          ))}
      </Row>

      {/* Tip Section */}
      <div style={{ 
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(64, 169, 255, 0.05) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(24, 144, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(64, 169, 255, 0.05))',
          borderRadius: '50%',
          zIndex: 1
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
            }}>
              <SettingOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <Text strong style={{ color: '#1890ff', fontSize: '18px', margin: 0 }}>
              💡 Consejo
            </Text>
          </div>
          <Text style={{ 
            color: '#2c5282', 
            fontSize: '15px', 
            lineHeight: '1.6',
            margin: 0
          }}>
            Comienza configurando tu <strong style={{ color: '#1890ff' }}>Dashboard</strong> para personalizar cómo ves tus finanzas. 
            Las demás opciones estarán disponibles próximamente.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Configuration; 

// CSS personalizado para forzar el padding
const customStyles = `
  .custom-card-body .ant-card-body {
    padding: 20px !important;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
} 