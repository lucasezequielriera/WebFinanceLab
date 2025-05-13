import React from 'react';
import { Typography, Divider, Space, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, SafetyCertificateOutlined, FileTextOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import logo from '../assets/transparent-logo.png';

const { Title, Paragraph, Text } = Typography;

const Legal = () => {
  const { t } = useTranslation('legal');

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '40px',
          gap: '20px'
        }}>
          <Link to="/" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            color: '#001529',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}>
            <ArrowLeftOutlined style={{ marginRight: '8px' }} />
            {t('terms.backToHome')}
          </Link>
          <img src={logo} alt="WebFinanceLab Logo" style={{ width: '40px' }} />
        </div>

        <Row gutter={[48, 48]}>
          <Col xs={24} lg={12}>
            <div className="legal-section">
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#00a389', marginBottom: '16px' }} />
                <Title level={2} style={{ margin: 0 }}>{t('terms.title')}</Title>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.acceptance.title')}</Title>
                  <Paragraph>{t('terms.sections.acceptance.content')}</Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.description.title')}</Title>
                  <Paragraph>{t('terms.sections.description.content')}</Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.accounts.title')}</Title>
                  <Paragraph>{t('terms.sections.accounts.content')}</Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.privacy.title')}</Title>
                  <Paragraph>{t('terms.sections.privacy.content')}</Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.acceptableUse.title')}</Title>
                  <Paragraph>{t('terms.sections.acceptableUse.content')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.acceptableUse.items', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.jurisdiction.title')}</Title>
                  <Paragraph>{t('terms.sections.jurisdiction.content')}</Paragraph>

                  <Paragraph>{t('terms.sections.jurisdiction.euUsers')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.jurisdiction.euItems', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Paragraph>{t('terms.sections.jurisdiction.nonEuUsers')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.jurisdiction.nonEuItems', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Paragraph>{t('terms.sections.jurisdiction.ukUsers')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.jurisdiction.ukItems', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Paragraph>{t('terms.sections.jurisdiction.americasUsers')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.jurisdiction.americasItems', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Paragraph>{t('terms.sections.jurisdiction.argentinaUsers')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.jurisdiction.argentinaItems', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Paragraph>{t('terms.sections.jurisdiction.usUsers')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.jurisdiction.usItems', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.compliance.title')}</Title>
                  <Paragraph>{t('terms.sections.compliance.content')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.compliance.items', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('terms.sections.dataTransfer.title')}</Title>
                  <Paragraph>{t('terms.sections.dataTransfer.content')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('terms.sections.dataTransfer.items', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="legal-section">
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <LockOutlined style={{ fontSize: '48px', color: '#00a389', marginBottom: '16px' }} />
                <Title level={2} style={{ margin: 0 }}>{t('legal.title')}</Title>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('legal.sections.info.title')}</Title>
                  <Paragraph>{t('legal.sections.info.content')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('legal.sections.info.items', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Paragraph>
                    <Text type="secondary">{t('legal.sections.info.note')}</Text>
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('legal.sections.intellectual.title')}</Title>
                  <Paragraph>{t('legal.sections.intellectual.content')}</Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('legal.sections.dataProtection.title')}</Title>
                  <Paragraph>{t('legal.sections.dataProtection.content')}</Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {t('legal.sections.dataProtection.items', { returnObjects: true }).map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LockOutlined style={{ color: '#00a389' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>{t('legal.sections.contact.title')}</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MailOutlined style={{ color: '#00a389' }} />
                      <a href={`mailto:${t('legal.sections.contact.email')}`} style={{ color: '#001529' }}>{t('legal.sections.contact.email')}</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PhoneOutlined style={{ color: '#00a389' }} />
                      <a href={`tel:${t('legal.sections.contact.phone')}`} style={{ color: '#001529' }}>{t('legal.sections.contact.phone')}</a>
                    </div>
                  </Space>
                </div>
              </Space>
            </div>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Text type="secondary">
            {t('lastUpdate')} {new Date().toLocaleDateString()}
          </Text>
        </div>
      </div>

      <style>
        {`
          .legal-section {
            padding: 32px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .legal-subsection {
            padding: 16px;
            border-radius: 8px;
            transition: all 0.3s ease;
          }

          .legal-subsection:hover {
            background: rgba(0, 163, 137, 0.05);
          }

          a {
            transition: all 0.3s ease;
          }

          a:hover {
            color: #00a389 !important;
          }
        `}
      </style>
    </div>
  );
};

export default Legal; 