import React, { useState, useRef, useEffect } from 'react';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './CustomDatePicker.css';

const CustomDatePicker = ({ value, onChange, placeholder = "Seleccionar fecha", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? dayjs(value) : dayjs());
  const [selectedDate, setSelectedDate] = useState(value ? dayjs(value) : null);
  const dropdownRef = useRef(null);

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar cuando cambia la prop "value" (p.ej., al abrir modal de edición)
  useEffect(() => {
    if (value) {
      const d = dayjs(value);
      setSelectedDate(d);
      setCurrentMonth(d);
    }
  }, [value]);

  // Generar días del mes
  const generateDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days = [];
    let current = startOfCalendar;

    while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
      days.push({
        date: current,
        isCurrentMonth: current.isSame(currentMonth, 'month'),
        isToday: current.isSame(dayjs(), 'day'),
        isSelected: selectedDate && current.isSame(selectedDate, 'day')
      });
      current = current.add(1, 'day');
    }

    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentMonth(date);
    onChange && onChange(date);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handlePrevYear = () => {
    setCurrentMonth(currentMonth.subtract(1, 'year'));
  };

  const handleNextYear = () => {
    setCurrentMonth(currentMonth.add(1, 'year'));
  };

  const handleToday = () => {
    const today = dayjs();
    setSelectedDate(today);
    setCurrentMonth(today);
    onChange && onChange(today);
    setIsOpen(false);
  };

  const formatDisplayDate = (date) => {
    if (!date) return placeholder;
    return date.format('DD/MM/YYYY');
  };

  const days = generateDays();

  return (
    <div className={`custom-date-picker ${className}`} ref={dropdownRef}>
      <div 
        className="date-picker-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="date-picker-text">
          {formatDisplayDate(selectedDate)}
        </span>
        <CalendarOutlined className="date-picker-icon" />
      </div>

      {isOpen && (
        <div className="date-picker-dropdown">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button 
                className="nav-button"
                onClick={handlePrevYear}
                title="Año anterior"
              >
                <LeftOutlined />
                <LeftOutlined />
              </button>
              <button 
                className="nav-button"
                onClick={handlePrevMonth}
                title="Mes anterior"
              >
                <LeftOutlined />
              </button>
            </div>
            
            <div className="calendar-title">
              <span className="month-year">
                {months[currentMonth.month()]} {currentMonth.year()}
              </span>
            </div>
            
            <div className="calendar-nav">
              <button 
                className="nav-button"
                onClick={handleNextMonth}
                title="Mes siguiente"
              >
                <RightOutlined />
              </button>
              <button 
                className="nav-button"
                onClick={handleNextYear}
                title="Año siguiente"
              >
                <RightOutlined />
                <RightOutlined />
              </button>
            </div>
          </div>

          <div className="calendar-days-header">
            {daysOfWeek.map(day => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((day, index) => (
              <button
                key={index}
                className={`calendar-day ${
                  !day.isCurrentMonth ? 'other-month' : ''
                } ${day.isToday ? 'today' : ''} ${
                  day.isSelected ? 'selected' : ''
                }`}
                onClick={() => handleDateSelect(day.date)}
              >
                {day.date.date()}
              </button>
            ))}
          </div>

          <div className="calendar-footer">
            <button 
              className="today-button"
              onClick={handleToday}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
