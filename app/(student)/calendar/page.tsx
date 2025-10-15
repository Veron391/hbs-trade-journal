"use client";

import TradeCalendar from '../../components/forms/TradeCalendar';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useI18n } from '../../context/I18nContext';

export default function CalendarPage() {
  const { t } = useI18n();
  
  return (
    <ProtectedRoute>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-8 text-white">{t('tradeCalendar')}</h1>
        <TradeCalendar />
      </div>
    </ProtectedRoute>
  );
} 