"use client";

import TradeCalendar from '../../components/forms/TradeCalendar';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useI18n } from '../../context/I18nContext';
import { useTrades } from '../../context/TradeContext';

export default function CalendarPage() {
  const { t } = useI18n();
  const { isLoading: tradesLoading } = useTrades();

  // Show loading only while trades are loading (initial page load)
  // After that, components load their own data without showing separate loaders
  if (tradesLoading) {
    return (
      <ProtectedRoute>
        <div className="py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8 text-white">{t('tradeCalendar')}</h1>
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="loader"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8 text-white">{t('tradeCalendar')}</h1>
        <TradeCalendar />
      </div>
    </ProtectedRoute>
  );
} 