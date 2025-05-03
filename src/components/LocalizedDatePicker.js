import React, { useMemo } from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import { useTranslation } from 'react-i18next';
import { es as esFns, enUS as enUSFns } from 'date-fns/locale';
import esES from 'antd/es/locale/es_ES';
import enUS from 'antd/es/locale/en_US';
import dayjs from 'dayjs';

const LocalizedDatePicker = ({ showTime, format, displayRender, value, ...props }) => {
  const { i18n } = useTranslation();
  const antdLocale = i18n.language === 'es' ? esES : enUS;
  const currentLocale = i18n.language === 'en' ? enUSFns : esFns;

  const defaultDisplayRender = useMemo(() => (date) => {
    if (!date) return '';
    if (i18n.language === 'es') {
      const month = date.format('MMMM');
      const year = date.format('YYYY');
      return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }
    return date.format(format || 'MMMM YYYY');
  }, [i18n.language, format]);

  const customFormat = useMemo(() => (date) => {
    if (!date) return '';
    if (i18n.language === 'es') {
      const month = date.format('MMMM');
      const year = date.format('YYYY');
      return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }
    return date.format(format || 'MMMM YYYY');
  }, [i18n.language, format]);

  const datePicker = useMemo(() => (
    <ConfigProvider locale={antdLocale}>
      <DatePicker
        showTime={showTime}
        format={customFormat}
        locale={currentLocale}
        getPopupContainer={trigger => document.body}
        displayRender={displayRender || defaultDisplayRender}
        value={value}
        {...props}
      />
    </ConfigProvider>
  ), [showTime, format, displayRender, value, antdLocale, currentLocale, customFormat, defaultDisplayRender, props]);

  return datePicker;
};

export default LocalizedDatePicker; 