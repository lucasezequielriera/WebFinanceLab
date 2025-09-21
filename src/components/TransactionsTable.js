import React from 'react';
import { Spin, Empty, Typography, Row, Col } from 'antd';
import { CalendarOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

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
    <div style={{ background: '#1a1a1a' }}>
      {/* Resumen de transacciones */}
      {showSummary && (
        <div style={{
          background: 'rgba(45, 55, 72, 0.3)',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '12px',
          border: '1px solid rgba(74, 85, 104, 0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Typography.Text strong style={{ color: '#60a5fa', fontSize: '12px' }}>
                  Total Transacciones
                </Typography.Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa', marginTop: '2px' }}>
                  {sortedTransactions.length}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Typography.Text strong style={{ color: '#34d399', fontSize: '12px' }}>
                  Total ARS
                </Typography.Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}>
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
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24', marginTop: '2px' }}>
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
        marginTop: '8px',
        background: 'rgba(26, 26, 26, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(45, 55, 72, 0.4)',
        backdropFilter: 'blur(10px)'
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
            background: 'rgba(45, 55, 72, 0.4)',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(74, 85, 104, 0.3)',
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
                padding: '12px 16px',
                borderBottom: index < sortedTransactions.length - 1 ? '1px solid #2d3748' : 'none',
                background: index % 2 === 0 ? 'rgba(26, 26, 26, 0.2)' : 'rgba(15, 20, 25, 0.3)',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s ease',
                cursor: 'pointer',
                width: 'max-content',
                minWidth: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(45, 55, 72, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = index % 2 === 0 ? 'rgba(26, 26, 26, 0.2)' : 'rgba(15, 20, 25, 0.3)';
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
                  <DollarOutlined style={{ 
                    color: transaction.currency === 'USD' ? '#fbbf24' : '#34d399',
                    fontSize: '10px',
                    flexShrink: 0
                  }} />
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
            background: 'rgba(45, 55, 72, 0.3)',
            padding: '8px 16px',
            borderTop: '1px solid rgba(74, 85, 104, 0.2)',
            fontSize: '10px',
            color: '#94a3b8',
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
