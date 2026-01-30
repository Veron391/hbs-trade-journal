"use client";

import { useEffect, useState } from 'react';
import StatsOverview from '../../components/dashboard/StatsOverview';
import DetailedStats from '../../components/dashboard/DetailedStats';
import StatsCharts from '../../components/dashboard/StatsCharts';
import TimePeriodSelector from '../../components/dashboard/TimePeriodSelector';
import { useTimePeriod } from '../../context/TimePeriodContext';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { TradeType } from '../../types';
import { useI18n } from '../../context/I18nContext';

export default function StatsPage() {
  const { t } = useI18n();
  const { selectedPeriod, setSelectedPeriod } = useTimePeriod();
  const [activeTab, setActiveTab] = useState<TradeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('statsTradeType') as TradeType | null;
      if (saved === 'total' || saved === 'stock' || saved === 'crypto') return saved;
    }
    return 'total';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('statsTradeType', activeTab);
    }
  }, [activeTab]);

  return (
    <ProtectedRoute>
      <div className="py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{t('tradingStatistics')}</h1>
          <TimePeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-8">
          <div className="flex space-x-1 bg-[#1C1719] p-1 rounded-lg border border-white/20 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab('total')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap min-h-[44px] ${
                activeTab === 'total'
                  ? 'bg-[#A8BBA3] text-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('total')}
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap min-h-[44px] ${
                activeTab === 'stock'
                  ? 'bg-[#EBD9D1] text-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('stock')}
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap min-h-[44px] ${
                activeTab === 'crypto'
                  ? 'bg-[#D97706] text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('crypto')}
            </button>
          </div>
        </div>

        {/* Stats Content */}
        <StatsOverview selectedPeriod={selectedPeriod} tradeType={activeTab} />
        <StatsCharts selectedPeriod={selectedPeriod} tradeType={activeTab} />
        <DetailedStats selectedPeriod={selectedPeriod} tradeType={activeTab} />
      </div>
    </ProtectedRoute>
  );
}
