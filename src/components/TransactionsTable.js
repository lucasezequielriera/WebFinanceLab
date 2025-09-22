import React from 'react';
import { Spin, Empty, Typography, Row, Col } from 'antd';
import { CalendarOutlined, ShoppingOutlined, DollarOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  FaBus, 
  FaHome, 
  FaHeartbeat, 
  FaShoppingCart, 
  FaBirthdayCake, 
  FaGift, 
  FaCreditCard, 
  FaPhone, 
  FaBook, 
  FaTrophy, 
  FaCamera, 
  FaUser, 
  FaCut, 
  FaTrain, 
  FaSpotify,
  FaVideo,
  FaYoutube,
  FaMusic,
  FaCoffee,
  FaCookieBite,
  FaDumbbell,
  FaWineGlass,
  FaWifi,
  FaBeer,
  FaCocktail,
  FaShoppingBag,
  FaUtensils,
  FaTshirt,
  FaGem
} from 'react-icons/fa';

// Función para generar colores aleatorios para los iconos
const getRandomColor = (category) => {
  const colors = [
    'linear-gradient(135deg, #ff4757, #ff3742)', // Rojo vibrante
    'linear-gradient(135deg, #3742fa, #2f3542)', // Azul oscuro
    'linear-gradient(135deg, #ff9ff3, #f368e0)', // Rosa magenta
    'linear-gradient(135deg, #ffa502, #ff6348)', // Naranja brillante
    'linear-gradient(135deg, #5f27cd, #341f97)', // Púrpura profundo
    'linear-gradient(135deg, #00d2d3, #54a0ff)', // Cian azul
    'linear-gradient(135deg, #ff9f43, #ff6b6b)', // Naranja rojo
    'linear-gradient(135deg, #a55eea, #26de81)', // Púrpura verde
    'linear-gradient(135deg, #fd79a8, #fdcb6e)', // Rosa amarillo
    'linear-gradient(135deg, #6c5ce7, #a29bfe)', // Púrpura claro
    'linear-gradient(135deg, #00b894, #00cec9)', // Verde turquesa
    'linear-gradient(135deg, #e17055, #d63031)', // Rojo coral
    'linear-gradient(135deg, #74b9ff, #0984e3)', // Azul cielo
    'linear-gradient(135deg, #fdcb6e, #e17055)', // Amarillo naranja
    'linear-gradient(135deg, #fd79a8, #e84393)', // Rosa fucsia
    'linear-gradient(135deg, #00b894, #00cec9)', // Verde esmeralda
    'linear-gradient(135deg, #6c5ce7, #a29bfe)', // Púrpura índigo
    'linear-gradient(135deg, #fdcb6e, #e17055)', // Dorado
    'linear-gradient(135deg, #fd79a8, #fdcb6e)', // Rosa dorado
    'linear-gradient(135deg, #00d2d3, #54a0ff)', // Turquesa azul
  ];
  
  // Usar el nombre de la categoría para generar un índice consistente
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Función para detectar el tipo de categoría y asignar ícono
const getCategoryIcon = (category) => {
  const categoryLower = category.toLowerCase();
  
  // Transporte - Bus
  if (categoryLower.includes('auto') || categoryLower.includes('carro') || categoryLower.includes('vehiculo') || 
      categoryLower.includes('gasolina') || categoryLower.includes('nafta') || categoryLower.includes('taxi') || 
      categoryLower.includes('uber') || categoryLower.includes('transporte') || categoryLower.includes('bus') ||
      categoryLower.includes('transport')) {
    return <FaBus style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Hogar - Casa
  if (categoryLower.includes('hogar') || categoryLower.includes('casa') || categoryLower.includes('vivienda') || 
      categoryLower.includes('alquiler') || categoryLower.includes('hipoteca') || categoryLower.includes('servicios') ||
      categoryLower.includes('luz') || categoryLower.includes('agua') || categoryLower.includes('gas')) {
    return <FaHome style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Salud - Corazón
  if (categoryLower.includes('salud') || categoryLower.includes('medico') || categoryLower.includes('farmacia') || 
      categoryLower.includes('hospital') || categoryLower.includes('clinica') || categoryLower.includes('medicina') ||
      categoryLower.includes('doctor') || categoryLower.includes('dentista')) {
    return <FaHeartbeat style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Compras - Carrito
  if (categoryLower.includes('compras') || categoryLower.includes('shopping') || categoryLower.includes('tienda') || 
      categoryLower.includes('supermercado') || categoryLower.includes('mercado') || categoryLower.includes('comercio')) {
    return <FaShoppingCart style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Celebración - Pastel
  if (categoryLower.includes('cumpleanos') || categoryLower.includes('fiesta') || categoryLower.includes('celebracion') || 
      categoryLower.includes('evento') || categoryLower.includes('reunion')) {
    return <FaBirthdayCake style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Regalos - Regalo
  if (categoryLower.includes('regalo') || categoryLower.includes('gift') || categoryLower.includes('presente') || 
      categoryLower.includes('sorpresa')) {
    return <FaGift style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Finanzas - Tarjeta
  if (categoryLower.includes('banco') || categoryLower.includes('tarjeta') || categoryLower.includes('credito') || 
      categoryLower.includes('debito') || categoryLower.includes('pago') || categoryLower.includes('cuota') || 
      categoryLower.includes('prestamo') || categoryLower.includes('inversion')) {
    return <FaCreditCard style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Comunicación - Teléfono
  if (categoryLower.includes('telefono') || categoryLower.includes('celular') || categoryLower.includes('comunicacion') || 
      categoryLower.includes('internet') || categoryLower.includes('wifi')) {
    return <FaPhone style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Educación - Libro
  if (categoryLower.includes('educacion') || categoryLower.includes('estudio') || categoryLower.includes('curso') || 
      categoryLower.includes('libro') || categoryLower.includes('universidad') || categoryLower.includes('colegio')) {
    return <FaBook style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Deporte - Trofeo
  if (categoryLower.includes('deporte') || categoryLower.includes('gym') || categoryLower.includes('ejercicio') || 
      categoryLower.includes('fitness') || categoryLower.includes('deportivo')) {
    return <FaTrophy style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Fotografía - Cámara
  if (categoryLower.includes('foto') || categoryLower.includes('fotografia') || categoryLower.includes('camara') || 
      categoryLower.includes('imagen')) {
    return <FaCamera style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Personal - Usuario
  if (categoryLower.includes('personal') || categoryLower.includes('cuidado') || categoryLower.includes('belleza') || 
      categoryLower.includes('estetica') || categoryLower.includes('spa')) {
    return <FaUser style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Peluquería - Tijeras
  if (categoryLower.includes('peluqueria') || categoryLower.includes('corte') || categoryLower.includes('cabello') || 
      categoryLower.includes('barberia')) {
    return <FaCut style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Viaje - Tren
  if (categoryLower.includes('viaje') || categoryLower.includes('turismo') || categoryLower.includes('vacaciones') || 
      categoryLower.includes('hotel') || categoryLower.includes('avion')) {
    return <FaTrain style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Música - Spotify
  if (categoryLower.includes('musica') || categoryLower.includes('spotify') || categoryLower.includes('audio') || 
      categoryLower.includes('sonido')) {
    return <FaSpotify style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Video - Video
  if (categoryLower.includes('video') || categoryLower.includes('youtube') || categoryLower.includes('streaming') || 
      categoryLower.includes('netflix') || categoryLower.includes('pelicula')) {
    return <FaVideo style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // YouTube - YouTube
  if (categoryLower.includes('youtube') || categoryLower.includes('canal') || categoryLower.includes('video')) {
    return <FaYoutube style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Música - Música
  if (categoryLower.includes('musica') || categoryLower.includes('cancion') || categoryLower.includes('audio')) {
    return <FaMusic style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Café - Café
  if (categoryLower.includes('cafe') || categoryLower.includes('bebida') || categoryLower.includes('restaurant') || 
      categoryLower.includes('comida')) {
    return <FaCoffee style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Comida - Galleta
  if (categoryLower.includes('comida') || categoryLower.includes('alimento') || categoryLower.includes('restaurant') || 
      categoryLower.includes('cena') || categoryLower.includes('almuerzo')) {
    return <FaCookieBite style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Gimnasio - Pesas
  if (categoryLower.includes('gym') || categoryLower.includes('gimnasio') || categoryLower.includes('ejercicio') || 
      categoryLower.includes('fitness')) {
    return <FaDumbbell style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Bebida - Copa
  if (categoryLower.includes('bebida') || categoryLower.includes('alcohol') || categoryLower.includes('bar') || 
      categoryLower.includes('copa')) {
    return <FaWineGlass style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Internet - WiFi
  if (categoryLower.includes('internet') || categoryLower.includes('wifi') || categoryLower.includes('conectividad') ||
      categoryLower.includes('red') || categoryLower.includes('network') || categoryLower.includes('conexion')) {
    return <FaWifi style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Cerveza - Cerveza
  if (categoryLower.includes('cerveza') || categoryLower.includes('beer') || categoryLower.includes('alcohol')) {
    return <FaBeer style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Cóctel - Cóctel
  if (categoryLower.includes('coctel') || categoryLower.includes('cocktail') || categoryLower.includes('bebida')) {
    return <FaCocktail style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Bolsa - Bolsa
  if (categoryLower.includes('bolsa') || categoryLower.includes('bag') || categoryLower.includes('compras')) {
    return <FaShoppingBag style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Utensilios - Utensilios
  if (categoryLower.includes('utensilios') || categoryLower.includes('cocina') || categoryLower.includes('casa')) {
    return <FaUtensils style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Ropa - Camiseta
  if (categoryLower.includes('ropa') || categoryLower.includes('vestimenta') || categoryLower.includes('moda') || 
      categoryLower.includes('tienda')) {
    return <FaTshirt style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Joyería - Gema
  if (categoryLower.includes('joyeria') || categoryLower.includes('joya') || categoryLower.includes('gema') || 
      categoryLower.includes('accesorio')) {
    return <FaGem style={{ color: 'white', fontSize: '12px' }} />;
  }
  
  // Por defecto - Buscar
  return <SearchOutlined style={{ color: 'white', fontSize: '12px' }} />;
};

const TransactionsTable = ({ 
  transactions = [], 
  loading = false, 
  showSummary = true,
  maxHeight = '400px',
  title = 'Transacciones'
}) => {
  // Ordenar transacciones por fecha (más reciente primero)
  const sortedTransactions = React.useMemo(() => {
    return [...transactions].sort((a, b) => {
      try {
        // Función helper para obtener fecha válida
        const getValidDate = (transaction) => {
          if (!transaction.timestamp) return new Date(0); // Fecha muy antigua si no hay timestamp
          
          if (transaction.timestamp?.toDate) {
            return transaction.timestamp.toDate();
          } else if (transaction.timestamp instanceof Date) {
            return transaction.timestamp;
          } else {
            const dayjsDate = dayjs(transaction.timestamp);
            return dayjsDate.isValid() ? dayjsDate.toDate() : new Date(0);
          }
        };

        const dateA = getValidDate(a);
        const dateB = getValidDate(b);
        
        // Ordenar por fecha descendente (más reciente primero)
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.error('Error ordenando transacciones:', error);
        return 0;
      }
    });
  }, [transactions]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: '#1a1a1a' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#e2e8f0' }}>
          Cargando transacciones...
        </div>
      </div>
    );
  }

  if (sortedTransactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: '#1a1a1a' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No hay transacciones para mostrar"
          style={{ color: '#e2e8f0' }}
        />
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent' }}>
      {/* Resumen de transacciones */}
      {showSummary && (
        <div style={{
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '12px',
          marginTop: '-8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Typography.Text strong style={{ color: '#60a5fa', fontSize: '12px' }}>
                  Total Transacciones
                </Typography.Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>
                  {sortedTransactions.length}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Typography.Text strong style={{ color: '#34d399', fontSize: '12px' }}>
                  Total ARS
                </Typography.Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}>
                  ${sortedTransactions
                    .filter(t => t.currency === 'ARS')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
                    .toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Typography.Text strong style={{ color: '#fbbf24', fontSize: '12px' }}>
                  Total USD
                </Typography.Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>
                  ${sortedTransactions
                    .filter(t => t.currency === 'USD')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
                    .toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Tabla personalizada de transacciones */}
      <div style={{
        marginTop: '0',
        background: 'transparent',
        borderRadius: '0',
        overflow: 'hidden',
        border: 'none',
        backdropFilter: 'none',
        boxShadow: 'none'
      }}>
        {/* Contenedor con scroll sincronizado */}
        <div style={{ 
          maxHeight, 
          overflowY: 'auto',
          overflowX: 'auto',
          minWidth: '100%'
        }}>
          {/* Header de la tabla - dentro del scroll */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            backdropFilter: 'blur(5px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            width: 'max-content',
            minWidth: '100%'
          }}>
            <div style={{ 
              width: '100px',
              fontSize: '11px', 
              fontWeight: '600', 
              color: '#60a5fa',
              flexShrink: 0
            }}>
              FECHA
            </div>
            <div style={{ 
              flex: '1',
              minWidth: '200px',
              fontSize: '11px', 
              fontWeight: '600', 
              color: '#34d399',
              marginLeft: '16px'
            }}>
              DESCRIPCIÓN
            </div>
            <div style={{ 
              width: '150px',
              fontSize: '11px', 
              fontWeight: '600', 
              color: '#fbbf24', 
              textAlign: 'right',
              flexShrink: 0,
              marginLeft: '16px'
            }}>
              MONTO
            </div>
          </div>

          {/* Cuerpo de la tabla */}
          {sortedTransactions.map((transaction, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                borderBottom: index < sortedTransactions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                width: 'max-content',
                minWidth: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Fecha */}
              <div style={{ 
                width: '100px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarOutlined style={{ color: '#60a5fa', fontSize: '10px' }} />
                  <span style={{ fontSize: '11px', color: '#e2e8f0' }}>
                    {(() => {
                      try {
                        // Si no hay timestamp, mostrar mensaje
                        if (!transaction.timestamp) {
                          return 'Sin fecha';
                        }

                        // Intentar diferentes formatos de fecha
                        let date;
                        
                        // Si es un objeto Firestore Timestamp
                        if (transaction.timestamp?.toDate) {
                          date = dayjs(transaction.timestamp.toDate());
                        }
                        // Si es un objeto Date
                        else if (transaction.timestamp instanceof Date) {
                          date = dayjs(transaction.timestamp);
                        }
                        // Si es un string o número
                        else {
                          date = dayjs(transaction.timestamp);
                        }

                        if (date.isValid()) {
                          return date.format('DD/MM/YY');
                        } else {
                          return 'Fecha inválida';
                        }
                      } catch (error) {
                        console.error('Error formateando fecha:', error, transaction.timestamp);
                        return 'Error fecha';
                      }
                    })()}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div style={{ 
                flex: '1',
                minWidth: '200px',
                marginLeft: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingOutlined style={{ color: '#34d399', fontSize: '10px', flexShrink: 0 }} />
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#e2e8f0', 
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {transaction.description || 'Sin descripción'}
                  </span>
                </div>
              </div>

              {/* Monto */}
              <div style={{ 
                width: '150px',
                flexShrink: 0,
                marginLeft: '16px',
                textAlign: 'right'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end', 
                  gap: '3px',
                  flexWrap: 'nowrap'
                }}>
                  <span style={{ 
                    color: transaction.currency === 'USD' ? '#fbbf24' : '#34d399',
                    fontSize: '11px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    ${Number(transaction.amount).toLocaleString('es-AR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                  <div style={{
                    background: transaction.currency === 'USD' ? '#fbbf24' : '#34d399',
                    color: '#1a1a1a',
                    fontSize: '8px',
                    fontWeight: '600',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    marginLeft: '4px',
                    flexShrink: 0
                  }}>
                    {transaction.currency}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Footer con información de paginación */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#e2e8f0',
            textAlign: 'center',
            backdropFilter: 'blur(5px)',
            width: '100%',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            left: 0,
            right: 0
          }}>
            Mostrando {sortedTransactions.length} transacciones
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
