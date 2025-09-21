import React, { useState, useEffect } from 'react';
import { Card, Radio, Typography, Button, message, Spin, Modal } from 'antd';
import { GlobalOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import i18n from '../i18n';

const { Title, Text } = Typography;

const LanguageConfig = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(i18nInstance.language);
  const [userLanguage, setUserLanguage] = useState(null);

  const languages = [
    {
      key: 'es',
      label: 'Español',
      flag: '🇪🇸',
      description: 'Idioma por defecto'
    },
    {
      key: 'en',
      label: 'English',
      flag: '🇺🇸',
      description: 'Default language'
    }
  ];

  // Cargar idioma del usuario desde la base de datos
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (!currentUser) {
        setInitialLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const savedLanguage = data.language || 'es';
          setUserLanguage(savedLanguage);
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserLanguage();
  }, [currentUser]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
  };

  const handleSave = async () => {
    if (selectedLanguage === userLanguage) {
      message.info('El idioma ya está seleccionado');
      return;
    }

    if (!currentUser) {
      message.error('Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      // Guardar en la base de datos
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        language: selectedLanguage,
        lastActivity: Timestamp.now()
      });

      // Cambiar el idioma en la aplicación
      await i18nInstance.changeLanguage(selectedLanguage);
      
      // Actualizar el estado local
      setUserLanguage(selectedLanguage);
      
      message.success('Idioma cambiado exitosamente');
      
      // Recargar la página para aplicar todos los cambios de idioma
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error changing language:', error);
      message.error('Error al cambiar el idioma');
    } finally {
      setLoading(false);
    }
  };

  const showChangeConfirmation = () => {
    if (selectedLanguage === userLanguage) {
      message.info('El idioma ya está seleccionado');
      return;
    }

    Modal.confirm({
      title: 'Cambiar idioma',
      content: '¿Estás seguro de que quieres cambiar el idioma? La página se recargará para aplicar los cambios.',
      okText: 'Cambiar',
      cancelText: 'Cancelar',
      onOk: handleSave,
    });
  };

  return (
    <div style={{ padding: '48px 60px', width: '100%' }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Configuración de Idioma
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

      <Spin spinning={loading || initialLoading}>
        <Card style={{ width: '100%', background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <GlobalOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
              <Title level={3} style={{ margin: 0 }}>
                Seleccionar Idioma
              </Title>
            </div>
            <Text style={{ color: '#8c8c8c', fontSize: '16px' }}>
              Elige el idioma que prefieres para la interfaz de WebFinanceLab
            </Text>
          </div>

          <Radio.Group 
            value={selectedLanguage} 
            onChange={handleLanguageChange}
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {languages.map((language) => (
                <div key={language.key} style={{ 
                  border: selectedLanguage === language.key ? '2px solid #1890ff' : '2px solid #e8e8e8',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: selectedLanguage === language.key ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' : '#fff',
                  boxShadow: selectedLanguage === language.key 
                    ? '0 8px 24px rgba(24, 144, 255, 0.15)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (selectedLanguage !== language.key) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLanguage !== language.key) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                  }
                }}>
                  {/* Decorative element */}
                  {selectedLanguage === language.key && (
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
                    value={language.key} 
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
                        background: selectedLanguage === language.key 
                          ? 'linear-gradient(135deg, #1890ff, #40a9ff)'
                          : 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: selectedLanguage === language.key 
                          ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                          : '0 2px 6px rgba(0, 0, 0, 0.1)'
                      }}>
                        <span style={{ fontSize: '24px' }}>{language.flag}</span>
                      </div>
                      <div>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: '18px', 
                          color: selectedLanguage === language.key ? '#1890ff' : '#262626',
                          marginBottom: '4px'
                        }}>
                          {language.label}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: selectedLanguage === language.key ? '#40a9ff' : '#8c8c8c'
                        }}>
                          {language.description}
                        </div>
                      </div>
                    </div>
                  </Radio>
                </div>
              ))}
            </div>
          </Radio.Group>

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
                  Información
                </Text>
              </div>
              <Text style={{ 
                color: '#1890ff', 
                fontSize: '14px', 
                lineHeight: '1.6',
                margin: 0,
                opacity: 0.8
              }}>
                Al cambiar el idioma, la página se recargará automáticamente para aplicar 
                todos los cambios en la interfaz, incluyendo menús, botones y mensajes.
              </Text>
            </div>
          </div>

          <div style={{ 
            marginTop: '32px', 
            display: 'flex', 
            justifyContent: 'center'
          }}>
            <Button 
              type="primary" 
              onClick={showChangeConfirmation}
              disabled={selectedLanguage === userLanguage}
              size="large"
              style={{ 
                minWidth: '160px',
                height: '48px',
                borderRadius: '12px',
                background: selectedLanguage === userLanguage 
                  ? '#d9d9d9' 
                  : 'linear-gradient(135deg, #1890ff, #40a9ff)',
                border: 'none',
                boxShadow: selectedLanguage === userLanguage 
                  ? 'none' 
                  : '0 4px 16px rgba(24, 144, 255, 0.3)',
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              {selectedLanguage === userLanguage ? 'Idioma Actual' : 'Aplicar Cambios'}
            </Button>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default LanguageConfig;
