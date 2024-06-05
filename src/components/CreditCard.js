import React, { useState } from 'react';
import { Modal, notification } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import '../styles/CreditCard.css';

const CreditCard = ({ card, currentUser, updateCardClosingDate }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  let initialClosingDate = card.closingDate;
  
  const [closingDate, setClosingDate] = useState(initialClosingDate);
  const [tempClosingDate, setTempClosingDate] = useState(initialClosingDate);

  const getCardLogo = (cardType) => {
    switch (cardType) {
      case 'Visa':
        return 'https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Fvisa.png?alt=media&token=0af963f5-4b62-4d71-aee0-c1c25dde7290';
      case 'MasterCard':
        return 'https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Fmastercard.png?alt=media&token=1d150640-6fe9-4466-a6c8-9fb2e0a3d92e';
      case 'American Express':
        return 'https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/projectImages%2Famericanexpress.png?alt=media&token=ec68eff4-dbde-4c81-93e8-5d1b0a851e05';
      default:
        return '';
    }
  };

  const handleEditDate = () => {
    setTempClosingDate(closingDate);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const userDocRef = doc(db, `users/${currentUser.uid}`);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const updatedCards = userData.creditCards.map((c) => {
        if (c.bank === card.bank && c.cardBank === card.cardBank && c.cardType === card.cardType) {
          return { ...c, closingDate: tempClosingDate };
        }
        return c;
      });

      await updateDoc(userDocRef, {
        creditCards: updatedCards,
      });
      setClosingDate(tempClosingDate);
      updateCardClosingDate(card.bank, card.cardBank, card.cardType, tempClosingDate);
      notification.success({
        message: 'Closing Date Updated',
        description: 'The closing date has been successfully updated.',
      });
    } catch (e) {
      console.error('Error updating closing date: ', e);
      notification.error({
        message: 'Error',
        description: 'There was an error updating the closing date. Please try again.',
      });
    } finally {
      setIsModalVisible(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDateChange = (date) => {
    setTempClosingDate(date);
  };

  return (
    <div className="credit-card" style={{ background: card.color }}>
      <div className="credit-card__type">{card.cardType}</div>
      <div className="credit-card__name">{card.bank}</div>
      {card.cardType !== 'Cash' && <div className="credit-card__number">#### #### #### ####</div>}
      {card.cardType === 'Credit Card' && (
        <div className="credit-card__closing-date">
          Closing date: <span className="credit-card__closing-date__date">{card.closingDate ? moment(card.closingDate).format('DD/MM') : 'N/A'}</span> <EditOutlined onClick={handleEditDate} />
        </div>
      )}
      <div className="credit-card__details">
        <div className="credit-card__amount">Expenses: <span className="credit-card__amount__amount">${card.amount}</span></div>
        <img src={getCardLogo(card.cardBank)} alt={card.cardBank} className="credit-card__logo" />
      </div>

      <Modal
        title="Edit Closing Date"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <DatePicker
          selected={tempClosingDate}
          onChange={handleDateChange}
          dateFormat="dd/MM"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </Modal>
    </div>
  );
};

export default CreditCard;
