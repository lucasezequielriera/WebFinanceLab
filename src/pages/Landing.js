import React, { useEffect } from 'react';
import { Button, Typography, Row, Col, Card, Space, Divider, Dropdown } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { 
  DashboardOutlined, 
  LineChartOutlined, 
  DollarOutlined, 
  TeamOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import logo from '../assets/transparent-logo.png';

const { Title, Paragraph } = Typography;

const Landing = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { setSelectedLanguage } = useLanguage();
  const { t, i18n: i18nInstance } = useTranslation('landing');

  const languageItems = [
    {
      key: 'en',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '8px 0'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            position: 'relative',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: '#1a237e'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '50%',
              background: '#ffffff'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              background: '#1a237e'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '50%',
              height: '100%',
              background: '#ffffff'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              background: '#ffffff',
              borderRadius: '50%',
              boxShadow: '0 0 0 2px #1a237e'
            }} />
          </div>
          <span>{t('language.english')}</span>
        </div>
      )
    },
    {
      key: 'es',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '8px 0'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            position: 'relative',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '33.33%',
              background: '#c62828'
            }} />
            <div style={{
              position: 'absolute',
              top: '33.33%',
              left: 0,
              right: 0,
              height: '33.33%',
              background: '#ffd700'
            }} />
            <div style={{
              position: 'absolute',
              top: '66.66%',
              left: 0,
              right: 0,
              height: '33.33%',
              background: '#c62828'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '33.33%',
              height: '100%',
              background: '#c62828'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '16.66%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              background: '#ffd700',
              borderRadius: '50%',
              boxShadow: '0 0 0 2px #c62828'
            }} />
          </div>
          <span>{t('language.spanish')}</span>
        </div>
      )
    }
  ];

  const handleLanguageChange = ({ key }) => {
    setSelectedLanguage(key);
    i18nInstance.changeLanguage(key);
  };

  useEffect(() => {
    // Add scroll reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <DashboardOutlined style={{ fontSize: '32px' }} />,
      title: t('features.dashboard.title'),
      description: t('features.dashboard.description')
    },
    {
      icon: <LineChartOutlined style={{ fontSize: '32px' }} />,
      title: t('features.expenses.title'),
      description: t('features.expenses.description')
    },
    {
      icon: <DollarOutlined style={{ fontSize: '32px' }} />,
      title: t('features.income.title'),
      description: t('features.income.description')
    },
    {
      icon: <TeamOutlined style={{ fontSize: '32px' }} />,
      title: t('features.collaboration.title'),
      description: t('features.collaboration.description')
    }
  ];

  const benefits = [
    {
      icon: <CheckCircleOutlined style={{ fontSize: '24px' }} />,
      text: t('benefits.items.control')
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '24px' }} />,
      text: t('benefits.items.analysis')
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '24px' }} />,
      text: t('benefits.items.goals')
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '24px' }} />,
      text: t('benefits.items.reports')
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header with Logo and Language Selector */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <img 
            src={logo} 
            alt="WebFinanceLab" 
            style={{ 
              width: '48px',
              height: '48px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
        </div>

        <Dropdown
          menu={{
            items: languageItems,
            onClick: handleLanguageChange,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              padding: '8px 0'
            }
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<GlobalOutlined style={{ fontSize: '24px', color: 'white' }} />}
            style={{
              background: 'rgba(0, 21, 41, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0, 21, 41, 0.9)';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0, 21, 41, 0.8)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          />
        </Dropdown>
      </div>

      {/* Hero Section */}
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #001529 0%, #003366 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grid Background */}
        <div className="grid-background">
          <div className="grid-lines"></div>
          <div className="grid-overlay"></div>
        </div>

        {/* Animated background elements */}
        <div className="animated-bg">
          <div className="bg-circle" style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
          <div className="bg-circle" style={{ top: '60%', left: '80%', animationDelay: '1s' }} />
          <div className="bg-circle" style={{ top: '80%', left: '20%', animationDelay: '2s' }} />
        </div>

        <div style={{ 
          padding: '120px 20px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <Title level={1} className="animate-on-scroll" style={{ 
            color: 'white',
            marginBottom: '20px',
            fontSize: '3.5rem',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {t('hero.title')}
          </Title>
          <Title level={3} className="animate-on-scroll" style={{ 
            color: 'white',
            marginBottom: '40px',
            fontWeight: 'normal',
            maxWidth: '800px',
            margin: '0 auto 40px',
            lineHeight: '1.6'
          }}>
            {t('hero.subtitle')}
          </Title>
          <div className="animate-on-scroll" style={{ marginBottom: '40px' }}>
            {currentUser ? (
              <Link to="/dashboard">
                <Button type="primary" size="large" className="glow-button" style={{
                  height: '50px',
                  padding: '0 40px',
                  fontSize: '18px',
                  background: 'linear-gradient(90deg, #00a389, #00bf91)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(0, 191, 145, 0.3)'
                }}>
                  {t('buttons.dashboard')} <ArrowRightOutlined style={{ marginLeft: '8px' }} />
                </Button>
              </Link>
            ) : (
              <Space size="large">
                <Link to="/login">
                  <Button type="primary" size="large" className="glow-button" style={{
                    height: '50px',
                    padding: '0 40px',
                    fontSize: '18px',
                    background: 'linear-gradient(90deg, #00a389, #00bf91)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0, 191, 145, 0.3)'
                  }}>
                    {t('buttons.login')}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="large" className="hover-glow" style={{
                    height: '50px',
                    padding: '0 40px',
                    fontSize: '18px',
                    background: 'white',
                    color: '#001529',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)'
                  }}>
                    {t('buttons.signup')}
                  </Button>
                </Link>
              </Space>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '60px' }}>
            {t('features.title')}
          </Title>
          <Row gutter={[32, 32]} justify="center">
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card 
                  hoverable 
                  className="feature-card animate-on-scroll"
                  style={{ 
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="feature-icon" style={{ 
                    marginBottom: '20px',
                    color: '#00a389',
                    background: 'rgba(0, 163, 137, 0.1)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    transition: 'all 0.3s ease'
                  }}>
                    {feature.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: '16px' }}>{feature.title}</Title>
                  <Paragraph style={{ color: '#666', fontSize: '16px' }}>{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Benefits Section */}
      <div style={{ 
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={12} className="animate-on-scroll">
              <Title level={2} style={{ marginBottom: '32px' }}>
                {t('benefits.title')}
              </Title>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item animate-on-scroll" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      color: '#00a389',
                      fontSize: '24px'
                    }}>
                      {benefit.icon}
                    </div>
                    <Paragraph style={{ margin: 0, fontSize: '18px' }}>{benefit.text}</Paragraph>
                  </div>
                ))}
              </Space>
            </Col>
            <Col xs={24} md={12} className="animate-on-scroll">
              <div className="cta-card" style={{
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <RocketOutlined style={{ fontSize: '48px', color: '#00a389' }} />
                    <Title level={3} style={{ marginTop: '16px' }}>{t('benefits.cta.title')}</Title>
                    <Paragraph style={{ fontSize: '16px', color: '#666' }}>
                      {t('benefits.cta.subtitle')}
                    </Paragraph>
                  </div>
                  {!currentUser && (
                    <div style={{ textAlign: 'center' }}>
                      <Link to="/signup">
                        <Button type="primary" size="large" className="glow-button" style={{
                          height: '50px',
                          padding: '0 40px',
                          fontSize: '18px',
                          background: 'linear-gradient(90deg, #00a389, #00bf91)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(0, 191, 145, 0.3)'
                        }}>
                          {t('benefits.cta.button')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '40px 20px',
        background: '#001529',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grid Background for Footer */}
        <div className="grid-background footer-grid">
          <div className="grid-lines"></div>
          <div className="grid-overlay footer-overlay"></div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="footer-content">
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12}>
                <div className="footer-section">
                  <img src={logo} alt="WebFinanceLab Logo" style={{ width: 80, marginBottom: 16 }} />
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    {t('footer.description')}
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="footer-section">
                  <Title level={4} style={{ color: 'white', marginBottom: 16 }}>{t('footer.contact')}</Title>
                  <Space direction="vertical" size="middle">
                    <Space>
                      <MailOutlined style={{ color: '#00a389' }} />
                      <a href="mailto:webfinancelab@gmail.com" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>webfinancelab@gmail.com</a>
                    </Space>
                    <Space>
                      <PhoneOutlined style={{ color: '#00a389' }} />
                      <a href="tel:+34627043397" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>+34 627 043 397</a>
                    </Space>
                    <Space>
                      <Link to="/legal" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{t('footer.legal')}</Link>
                    </Space>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <Paragraph style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('footer.copyright')}
          </Paragraph>
        </div>
      </div>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/34627043397"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000,
          textDecoration: 'none'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '65px',
            height: '65px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #25D366, #128C7E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'rgba(37, 211, 102, 0.2)',
              animation: 'pulse 2s infinite'
            }}
          />
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <svg
              viewBox="0 0 24 24"
              width="35"
              height="35"
              fill="white"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
        </div>
      </a>

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          @keyframes pulse {
            0% { 
              transform: scale(1);
              opacity: 0.8;
            }
            50% { 
              transform: scale(1.2);
              opacity: 0.4;
            }
            100% { 
              transform: scale(1);
              opacity: 0.8;
            }
          }

          .animated-bg {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .bg-circle {
            position: absolute;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
            animation: float 8s ease-in-out infinite;
            filter: blur(15px);
          }

          .animate-on-scroll {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease-out;
          }

          .animate-on-scroll.animate-in {
            opacity: 1;
            transform: translateY(0);
          }

          .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }

          .feature-card:hover .feature-icon {
            transform: scale(1.1);
            background: rgba(0, 163, 137, 0.2);
          }

          .benefit-item:hover {
            transform: translateX(10px);
          }

          .cta-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }

          .glow-button {
            position: relative;
            overflow: hidden;
          }

          .glow-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 191, 145, 0.4);
          }

          .glow-button::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              transparent,
              rgba(255, 255, 255, 0.1),
              transparent
            );
            transform: rotate(45deg);
            animation: shine 3s infinite;
          }

          .hover-glow:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
          }

          .footer-link {
            color: rgba(255,255,255,0.7);
            transition: all 0.3s ease;
          }

          .footer-link:hover {
            color: white;
            transform: translateX(5px);
          }

          @keyframes shine {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
          }

          .grid-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            opacity: 0.3;
          }

          .grid-lines {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
            transform: perspective(500px) rotateX(60deg);
            transform-origin: top;
            animation: grid-move 20s linear infinite;
          }

          .grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at center,
              transparent 0%,
              rgba(0, 21, 41, 0.6) 100%
            );
          }

          @keyframes grid-move {
            0% {
              transform: perspective(500px) rotateX(60deg) translateY(0);
            }
            100% {
              transform: perspective(500px) rotateX(60deg) translateY(100px);
            }
          }

          .footer-grid {
            opacity: 0.2;
          }

          .footer-grid .grid-lines {
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
            background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
            animation: grid-move-footer 15s linear infinite;
          }

          .footer-overlay {
            background: radial-gradient(
              circle at center,
              transparent 0%,
              rgba(0, 21, 41, 0.8) 100%
            );
          }

          @keyframes grid-move-footer {
            0% {
              transform: perspective(500px) rotateX(60deg) translateY(0);
            }
            100% {
              transform: perspective(500px) rotateX(60deg) translateY(100px);
            }
          }

          .feature-card {
            background: white;
            padding: 20px 12px;
            border-radius: 12px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }

          .ant-dropdown-menu {
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 8px !important;
            padding: 8px 0 !important;
          }

          .ant-dropdown-menu-item {
            color: white !important;
            padding: 8px 16px !important;
            transition: all 0.3s ease !important;
          }

          .ant-dropdown-menu-item:hover {
            background: rgba(255, 255, 255, 0.1) !important;
          }

          .ant-dropdown-menu-item span {
            font-size: 14px;
            font-weight: 500;
          }
        `}
      </style>
    </div>
  );
};

export default Landing; 