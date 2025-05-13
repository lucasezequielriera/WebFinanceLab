import React from 'react';
import { Typography, Divider, Space, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, SafetyCertificateOutlined, FileTextOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import logo from '../assets/transparent-logo.png';

const { Title, Paragraph, Text } = Typography;

const Legal = () => {
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
            Volver al inicio
          </Link>
          <img src={logo} alt="WebFinanceLab Logo" style={{ width: '40px' }} />
        </div>

        <Row gutter={[48, 48]}>
          <Col xs={24} lg={12}>
            <div className="legal-section">
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#00a389', marginBottom: '16px' }} />
                <Title level={2} style={{ margin: 0 }}>Términos y Condiciones</Title>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>1. Aceptación de los Términos</Title>
                  <Paragraph>
                    Al acceder y utilizar WebFinanceLab, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>2. Descripción del Servicio</Title>
                  <Paragraph>
                    WebFinanceLab es una plataforma de gestión financiera que permite a los usuarios gestionar sus finanzas personales y empresariales, incluyendo el seguimiento de gastos, ingresos y la generación de informes financieros.
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>3. Cuentas de Usuario</Title>
                  <Paragraph>
                    Para utilizar nuestros servicios, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, y acepta la responsabilidad por todas las actividades que ocurran bajo su cuenta.
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>4. Privacidad y Protección de Datos</Title>
                  <Paragraph>
                    El tratamiento de sus datos personales se realiza de acuerdo con nuestra Política de Privacidad y en cumplimiento con el Reglamento General de Protección de Datos (RGPD) y otras leyes aplicables.
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>5. Uso Aceptable</Title>
                  <Paragraph>
                    Usted acepta no utilizar el servicio para:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Actividades ilegales o fraudulentas
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Violar derechos de propiedad intelectual
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Interferir con el funcionamiento del servicio
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Compartir información confidencial de terceros
                    </li>
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>6. Jurisdicción y Ley Aplicable</Title>
                  <Paragraph>
                    Estos términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                  </Paragraph>

                  <Paragraph>
                    Para usuarios en la Unión Europea:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con el RGPD (Reglamento General de Protección de Datos)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Derecho a la portabilidad de datos
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Derecho al olvido y supresión de datos
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Consentimiento explícito para el tratamiento de datos
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Notificación de violaciones de datos en 72 horas
                    </li>
                  </ul>

                  <Paragraph>
                    Para usuarios en países europeos fuera de la UE:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con las leyes locales de protección de datos
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Adaptación a regulaciones específicas de cada país
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Respeto a las jurisdicciones locales
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con acuerdos de transferencia internacional de datos
                    </li>
                  </ul>

                  <Paragraph>
                    Para usuarios en Reino Unido:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con UK GDPR y Data Protection Act 2018
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Registro en la Information Commissioner's Office (ICO)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con Privacy and Electronic Communications Regulations (PECR)
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Adaptación a las regulaciones post-Brexit
                    </li>
                  </ul>

                  <Paragraph>
                    Para usuarios en otros países de América:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Canadá: Cumplimiento con PIPEDA (Personal Information Protection and Electronic Documents Act)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      México: Cumplimiento con Ley Federal de Protección de Datos Personales en Posesión de Particulares
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Brasil: Cumplimiento con LGPD (Lei Geral de Proteção de Dados)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Chile: Cumplimiento con Ley N° 19.628 sobre Protección de la Vida Privada
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Colombia: Cumplimiento con Ley 1581 de 2012 de Protección de Datos Personales
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Perú: Cumplimiento con Ley de Protección de Datos Personales N° 29733
                    </li>
                  </ul>

                  <Paragraph>
                    Para usuarios en Argentina:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Se aplica la Ley de Protección de Datos Personales N° 25.326
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Los usuarios tienen derecho a acceder, rectificar y suprimir sus datos personales
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      La Dirección Nacional de Protección de Datos Personales es la autoridad de aplicación
                    </li>
                  </ul>

                  <Paragraph>
                    Para usuarios en Estados Unidos:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Se aplican las leyes federales y estatales de protección de datos
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con CCPA (California Consumer Privacy Act) para usuarios de California
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cumplimiento con COPPA (Children's Online Privacy Protection Act)
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Derecho a solicitar información sobre datos personales recopilados
                    </li>
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>7. Cumplimiento Internacional</Title>
                  <Paragraph>
                    WebFinanceLab cumple con las regulaciones internacionales de protección de datos y privacidad, incluyendo:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      RGPD (Reglamento General de Protección de Datos) para la Unión Europea
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Convenio 108 del Consejo de Europa para países no-UE
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Ley de Protección de Datos Personales de Argentina
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Leyes de privacidad de Estados Unidos aplicables
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Acuerdos de transferencia internacional de datos (SCC)
                    </li>
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>8. Transferencia Internacional de Datos</Title>
                  <Paragraph>
                    WebFinanceLab garantiza que todas las transferencias internacionales de datos cumplen con las regulaciones aplicables:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Cláusulas Contractuales Estándar (SCC) para transferencias fuera de la UE
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Evaluaciones de impacto en la protección de datos (DPIA)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Registro de actividades de tratamiento
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Medidas técnicas y organizativas apropiadas
                    </li>
                  </ul>
                </div>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="legal-section">
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <LockOutlined style={{ fontSize: '48px', color: '#00a389', marginBottom: '16px' }} />
                <Title level={2} style={{ margin: 0 }}>Aviso Legal</Title>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>1. Información Legal</Title>
                  <Paragraph>
                    WebFinanceLab es una plataforma de gestión financiera registrada que opera bajo las regulaciones de protección de datos de:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Unión Europea (RGPD)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Argentina (Ley de Protección de Datos Personales N° 25.326)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Estados Unidos (CCPA, COPPA y leyes estatales aplicables)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Canadá (PIPEDA)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      México (Ley Federal de Protección de Datos Personales)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Brasil (LGPD)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Chile (Ley N° 19.628)
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Colombia (Ley 1581 de 2012)
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SafetyCertificateOutlined style={{ color: '#00a389' }} />
                      Perú (Ley N° 29733)
                    </li>
                  </ul>
                  <Paragraph>
                    <Text type="secondary">
                      Nota: La plataforma cumple con todas las regulaciones de protección de datos aplicables, garantizando la seguridad y privacidad de los datos de todos los usuarios, independientemente de su ubicación geográfica.
                    </Text>
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>2. Propiedad Intelectual</Title>
                  <Paragraph>
                    Todo el contenido de WebFinanceLab, incluyendo textos, gráficos, logotipos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, es propiedad de WebFinanceLab o de sus proveedores de contenido y está protegido por las leyes de propiedad intelectual.
                  </Paragraph>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>3. Protección de Datos</Title>
                  <Paragraph>
                    De acuerdo con el RGPD y la LOPDGDD, le informamos que:
                  </Paragraph>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockOutlined style={{ color: '#00a389' }} />
                      Responsable del tratamiento: WebFinanceLab
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockOutlined style={{ color: '#00a389' }} />
                      Finalidad: Gestión de usuarios y prestación de servicios financieros
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockOutlined style={{ color: '#00a389' }} />
                      Legitimación: Consentimiento del usuario y cumplimiento de obligaciones legales
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockOutlined style={{ color: '#00a389' }} />
                      Destinatarios: No se cederán datos a terceros salvo obligación legal
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockOutlined style={{ color: '#00a389' }} />
                      Derechos: Acceso, rectificación, supresión, limitación, oposición y portabilidad
                    </li>
                  </ul>
                </div>

                <div className="legal-subsection">
                  <Title level={4} style={{ color: '#00a389' }}>4. Contacto</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MailOutlined style={{ color: '#00a389' }} />
                      <a href="mailto:webfinancelab@gmail.com" style={{ color: '#001529' }}>webfinancelab@gmail.com</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PhoneOutlined style={{ color: '#00a389' }} />
                      <a href="tel:+34627043397" style={{ color: '#001529' }}>+34 627 043 397</a>
                    </div>
                  </Space>
                </div>
              </Space>
            </div>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Text type="secondary">
            Última actualización: {new Date().toLocaleDateString()}
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