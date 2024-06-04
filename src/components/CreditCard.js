import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import '../styles/CreditCard.css'; // Asegúrate de crear este archivo para los estilos

const CreditCard = ({ card }) => {
  const getCardLogo = (cardType) => {
    switch (cardType) {
      case 'Visa':
        return 'https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Fvisa.png?alt=media&token=0af963f5-4b62-4d71-aee0-c1c25dde7290'; // Añade el logo de Visa en tu carpeta de imágenes
      case 'MasterCard':
        return 'https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Fmastercard.png?alt=media&token=1d150640-6fe9-4466-a6c8-9fb2e0a3d92e'; // Añade el logo de MasterCard en tu carpeta de imágenes
      case 'American Express':
        return 'https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Famericanexpress.png?alt=media&token=ec68eff4-dbde-4c81-93e8-5d1b0a851e05'; // Añade el logo de American Express en tu carpeta de imágenes
      default:
        return '';
    }
  };

  console.log(card)

  return (
    <div className="credit-card" style={{ background: card.color }}>
      <div className="credit-card__type">{card.type}</div>
      <div className="credit-card__name">{card.name}</div>
      <div className="credit-card__number">#### #### #### ####</div>
      <div className="credit-card__closing-date">Closing date: <span className="credit-card__closing-date__date">28/04</span> <EditOutlined /></div>
      <div className="credit-card__details">
        <div className="credit-card__amount">Expenses: <span className="credit-card__amount__amount">${card.amount}</span></div>
        <img src={getCardLogo(card.cardType)} alt={card.cardType} className="credit-card__logo" />
      </div>
    </div>
  );
};

export default CreditCard;
