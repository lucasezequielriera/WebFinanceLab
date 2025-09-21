import React from 'react';
import { Card, Row, Col } from 'antd';
import { DollarOutlined, SearchOutlined } from '@ant-design/icons';
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
import '../styles/ExpenseList.css';

const ExpenseList = ({ expenses, onCategoryClick }) => {
  // Función para detectar el tipo de categoría y asignar ícono
  const getCategoryIcon = (category) => {
    const categoryLower = category.toLowerCase();
    console.log('Categoría detectada:', category, '->', categoryLower);
    
    // Transporte - Bus
    if (categoryLower.includes('auto') || categoryLower.includes('carro') || categoryLower.includes('vehiculo') || 
        categoryLower.includes('gasolina') || categoryLower.includes('nafta') || categoryLower.includes('taxi') || 
        categoryLower.includes('uber') || categoryLower.includes('transporte') || categoryLower.includes('bus') ||
        categoryLower.includes('transport')) {
      console.log('Detectado como TRANSPORTE');
      return <FaBus style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Tren
    if (categoryLower.includes('tren') || categoryLower.includes('train') || categoryLower.includes('metro') ||
        categoryLower.includes('subte') || categoryLower.includes('ferrocarril')) {
      console.log('Detectado como TREN');
      return <FaTrain style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Hogar
    if (categoryLower.includes('casa') || categoryLower.includes('hogar') || categoryLower.includes('alquiler') || 
        categoryLower.includes('renta') || categoryLower.includes('hipoteca') || categoryLower.includes('luz') || 
        categoryLower.includes('agua') || categoryLower.includes('gas') || categoryLower.includes('electricidad') ||
        categoryLower.includes('apartment')) {
      console.log('Detectado como HOGAR');
      return <FaHome style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Salud
    if (categoryLower.includes('salud') || categoryLower.includes('medico') || categoryLower.includes('farmacia') || 
        categoryLower.includes('hospital') || categoryLower.includes('clinica') || categoryLower.includes('medicina') || 
        categoryLower.includes('doctor') || categoryLower.includes('dentista')) {
      return <FaHeartbeat style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Supermercado
    if (categoryLower.includes('supermercado') || categoryLower.includes('supermarket') || 
        categoryLower.includes('mercado') || categoryLower.includes('grocery')) {
      console.log('Detectado como SUPERMERCADO');
      return <FaShoppingCart style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Café
    if (categoryLower.includes('cafe') || categoryLower.includes('coffee') || categoryLower.includes('cafeteria') ||
        categoryLower.includes('cappuccino') || categoryLower.includes('latte') || categoryLower.includes('espresso') ||
        categoryLower.includes('café') || categoryLower.includes('cafetería') || categoryLower.includes('barista') ||
        categoryLower.includes('americano') || categoryLower.includes('mocha') || categoryLower.includes('macchiato')) {
      console.log('Detectado como CAFÉ');
      return <FaCoffee style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Restaurante
    if (categoryLower.includes('restaurante') || categoryLower.includes('restaurant') || 
        categoryLower.includes('dining') || categoryLower.includes('comer') || categoryLower.includes('almorzar') ||
        categoryLower.includes('cenar') || categoryLower.includes('desayunar') || categoryLower.includes('lunch') ||
        categoryLower.includes('dinner') || categoryLower.includes('breakfast') || categoryLower.includes('comida afuera') ||
        categoryLower.includes('fuera') || categoryLower.includes('out') || categoryLower.includes('takeaway') ||
        categoryLower.includes('delivery') || categoryLower.includes('pedido')) {
      console.log('Detectado como RESTAURANTE');
      return <FaUtensils style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Comida general
    if (categoryLower.includes('comida') || categoryLower.includes('food') || 
        categoryLower.includes('almuerzo') || categoryLower.includes('cena') || categoryLower.includes('desayuno')) {
      console.log('Detectado como COMIDA');
      return <FaShoppingCart style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Cosas dulces - Chocolate
    if (categoryLower.includes('dulces') || categoryLower.includes('dulce') || categoryLower.includes('chocolate') || 
        categoryLower.includes('caramelo') || categoryLower.includes('golosina') || categoryLower.includes('postre') ||
        categoryLower.includes('helado') || categoryLower.includes('torta') || categoryLower.includes('cake') ||
        categoryLower.includes('sweet') || categoryLower.includes('candy') || categoryLower.includes('galleta') ||
        categoryLower.includes('cookie')) {
      console.log('Detectado como COSAS DULCES');
      return <FaCookieBite style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Bebidas
    if (categoryLower.includes('bebidas') || categoryLower.includes('drinks') || categoryLower.includes('bebida') ||
        categoryLower.includes('agua') || categoryLower.includes('refresco') || categoryLower.includes('soda') ||
        categoryLower.includes('jugo') || categoryLower.includes('zumo') || categoryLower.includes('cerveza') ||
        categoryLower.includes('beer') || categoryLower.includes('vino') || categoryLower.includes('wine') ||
        categoryLower.includes('cocktail') || categoryLower.includes('coctel')) {
      console.log('Detectado como BEBIDAS');
      return <FaWineGlass style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Regalos
    if (categoryLower.includes('regalo') || categoryLower.includes('gift') || categoryLower.includes('cumple') || 
        categoryLower.includes('navidad') || categoryLower.includes('aniversario') || categoryLower.includes('sorpresa')) {
      return <FaGift style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Lujo
    if (categoryLower.includes('lujo') || categoryLower.includes('luxury') || categoryLower.includes('joyas') ||
        categoryLower.includes('jewelry') || categoryLower.includes('diamantes') || categoryLower.includes('diamonds') ||
        categoryLower.includes('oro') || categoryLower.includes('gold') || categoryLower.includes('plata') ||
        categoryLower.includes('silver') || categoryLower.includes('perfume') || categoryLower.includes('perfumes') ||
        categoryLower.includes('reloj') || categoryLower.includes('watch') || categoryLower.includes('relojes') ||
        categoryLower.includes('watches') || categoryLower.includes('cartera') || categoryLower.includes('handbag') ||
        categoryLower.includes('bolso') || categoryLower.includes('bag') || categoryLower.includes('zapatos de lujo') ||
        categoryLower.includes('designer') || categoryLower.includes('marca') || categoryLower.includes('brand') ||
        categoryLower.includes('exclusivo') || categoryLower.includes('exclusive') || categoryLower.includes('premium')) {
      console.log('Detectado como LUJO');
      return <FaGem style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Finanzas
    if (categoryLower.includes('banco') || categoryLower.includes('tarjeta') || categoryLower.includes('credito') || 
        categoryLower.includes('debito') || categoryLower.includes('pago') || categoryLower.includes('cuota') || 
        categoryLower.includes('prestamo') || categoryLower.includes('inversion')) {
      return <FaCreditCard style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Internet/Conectividad
    if (categoryLower.includes('internet') || categoryLower.includes('wifi') || categoryLower.includes('conectividad') ||
        categoryLower.includes('red') || categoryLower.includes('network') || categoryLower.includes('conexion')) {
      console.log('Detectado como INTERNET');
      return <FaWifi style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Streaming & Apps (debe ir antes que Tecnología)
    if (categoryLower.includes('streaming') || categoryLower.includes('apps') || categoryLower.includes('app') ||
        categoryLower.includes('spotify') || categoryLower.includes('music') || categoryLower.includes('musica') || 
        categoryLower.includes('entretenimiento') || categoryLower.includes('plataforma') || categoryLower.includes('servicio') || 
        categoryLower.includes('subscription') || categoryLower.includes('netflix') || categoryLower.includes('youtube')) {
      console.log('Detectado como STREAMING & APPS');
      return <FaSpotify style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Tecnología
    if (categoryLower.includes('telefono') || categoryLower.includes('celular') || 
        categoryLower.includes('tecnologia') || categoryLower.includes('software') || 
        categoryLower.includes('digital')) {
      return <FaPhone style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    
    // Música general
    if (categoryLower.includes('musica') || categoryLower.includes('music') || categoryLower.includes('diversion') || 
        categoryLower.includes('juego') || categoryLower.includes('videojuego')) {
      return <FaMusic style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Educación
    if (categoryLower.includes('educacion') || categoryLower.includes('curso') || categoryLower.includes('libro') || 
        categoryLower.includes('universidad') || categoryLower.includes('colegio') || categoryLower.includes('estudio') || 
        categoryLower.includes('aprendizaje')) {
      return <FaBook style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Gym/Deportes
    if (categoryLower.includes('gym') || categoryLower.includes('fitness') || categoryLower.includes('ejercicio') ||
        categoryLower.includes('musculacion') || categoryLower.includes('pesas') || categoryLower.includes('entrenamiento') ||
        categoryLower.includes('crossfit') || categoryLower.includes('spinning') || categoryLower.includes('yoga')) {
      console.log('Detectado como GYM');
      return <FaDumbbell style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Deportes
    if (categoryLower.includes('deporte') || categoryLower.includes('correr') || categoryLower.includes('futbol') || 
        categoryLower.includes('tenis') || categoryLower.includes('natacion') || categoryLower.includes('basquet') ||
        categoryLower.includes('volley') || categoryLower.includes('handball')) {
      console.log('Detectado como DEPORTES');
      return <FaTrophy style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Ropa
    if (categoryLower.includes('ropa') || categoryLower.includes('vestimenta') || categoryLower.includes('zapatos') || 
        categoryLower.includes('moda') || categoryLower.includes('tienda') || categoryLower.includes('fashion') ||
        categoryLower.includes('clothes') || categoryLower.includes('clothing') || categoryLower.includes('shoes') ||
        categoryLower.includes('calzado') || categoryLower.includes('accesorios') || categoryLower.includes('accessories') ||
        categoryLower.includes('camisa') || categoryLower.includes('pantalon') || categoryLower.includes('vestido') ||
        categoryLower.includes('jeans') || categoryLower.includes('sweater') || categoryLower.includes('chaqueta')) {
      console.log('Detectado como ROPA');
      return <FaTshirt style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Belleza/Peluquería - Tijeras
    if (categoryLower.includes('corte') || categoryLower.includes('pelo') || categoryLower.includes('peluqueria') ||
        categoryLower.includes('belleza') || categoryLower.includes('estetica') || categoryLower.includes('barberia') ||
        categoryLower.includes('salon')) {
      console.log('Detectado como BELLEZA');
      return <FaCut style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Viajes
    if (categoryLower.includes('viaje') || categoryLower.includes('travel') || categoryLower.includes('vacaciones') || 
        categoryLower.includes('hotel') || categoryLower.includes('avion') || categoryLower.includes('vuelo') ||
        categoryLower.includes('turismo') || categoryLower.includes('trip')) {
      console.log('Detectado como VIAJES');
      return <FaCamera style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Other/Otros
    if (categoryLower.includes('other') || categoryLower.includes('otros') || categoryLower.includes('otro') ||
        categoryLower.includes('misc') || categoryLower.includes('miscelaneo') || categoryLower.includes('varios') ||
        categoryLower.includes('diversos') || categoryLower.includes('general')) {
      console.log('Detectado como OTHER');
      return <FaGift style={{ color: 'white', fontSize: '18px' }} />;
    }
    
    // Por defecto, ícono de compras
    console.log('No detectado, usando ícono por defecto');
    return <FaShoppingBag style={{ color: 'white', fontSize: '18px' }} />;
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        count: 0,
        currency: expense.currency || 'ARS'
      };
    }
    acc[category].total += Number(expense.amount) || 0;
    acc[category].count += 1;
    return acc;
  }, {});

  const dataSource = Object.entries(groupedExpenses).map(([category, data], index) => ({
    key: index,
    category,
    total: data.total,
    count: data.count,
    currency: data.currency
  }));

  return (
    <div className="expense-list">
      <Row gutter={[12, 12]}>
        {dataSource.map(({ category, total, count, currency }, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={category}>
            <Card 
              hoverable
              style={{ 
                marginBottom: 0,
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: 'none',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                cursor: 'pointer'
              }}
              bodyStyle={{ 
                padding: 0,
                position: 'relative',
                zIndex: 2
              }}
              onClick={() => {
                if (onCategoryClick) {
                  onCategoryClick(category, expenses.filter(exp => exp.category === category));
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.18)';
                // Efecto en el ícono
                const iconElement = e.currentTarget.querySelector('.category-icon');
                if (iconElement) {
                  iconElement.style.background = 'linear-gradient(135deg, #1890ff50, #40a9ff50)';
                  iconElement.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                // Restaurar el ícono
                const iconElement = e.currentTarget.querySelector('.category-icon');
                if (iconElement) {
                  iconElement.style.background = 'linear-gradient(135deg, #1890ff30, #40a9ff30)';
                  iconElement.style.transform = 'scale(1)';
                }
              }}
            >
              {/* Decorative background element - visual only */}
              <div 
                className="category-icon"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 50,
                  height: 50,
                  background: 'linear-gradient(135deg, #1890ff30, #40a9ff30)',
                  borderRadius: '50%',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  pointerEvents: 'none'
                }}
              >
                <SearchOutlined style={{ 
                  color: '#1890ff', 
                  fontSize: '16px'
                }} />
              </div>
              
              {/* Content container with padding */}
              <div style={{
                padding: '24px 20px 16px 20px',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Category header */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                position: 'relative',
                zIndex: 3
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}>
                        {getCategoryIcon(category)}
                </div>
                <div>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: '700', 
                    color: '#1a202c',
                    marginBottom: 2,
                    lineHeight: 1.2
                  }}>
                    {category}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Categoría
                  </div>
                </div>
              </div>
              
              {/* Amount section */}
              <div style={{ marginBottom: 16, position: 'relative', zIndex: 3 }}>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 8
                }}>
                  Total Gastado
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#1a202c',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4
                }}>
                  <DollarOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                  {total.toLocaleString('es-AR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#64748b',
                    fontWeight: '600',
                    marginLeft: 4
                  }}>
                    {currency}
                  </span>
                </div>
              </div>
              
              {/* Count badge */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: 12,
                border: '1px solid #bae6fd',
                position: 'relative',
                zIndex: 3
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #34d399)',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }} />
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#065f46',
                    fontWeight: '600'
                  }}>
                    {count} {count === 1 ? 'transacción' : 'transacciones'}
                  </span>
                </div>
              </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ExpenseList;