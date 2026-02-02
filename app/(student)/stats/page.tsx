"use client";

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import StatsOverview from '../../components/dashboard/StatsOverview';
import DetailedStats from '../../components/dashboard/DetailedStats';
import StatsCharts from '../../components/dashboard/StatsCharts';
import TimePeriodSelector from '../../components/dashboard/TimePeriodSelector';
import { useTimePeriod } from '../../context/TimePeriodContext';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { TradeType } from '../../types';
import { useI18n } from '../../context/I18nContext';

const TABS: TradeType[] = ['total', 'stock', 'crypto'];

const TAB_BG: Record<TradeType, string> = {
  total: '#D9FE43',
  stock: '#EBD9D1',
  crypto: '#D97706',
};

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
  const [pillStyle, setPillStyle] = useState({ left: 4, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('statsTradeType', activeTab);
    }
  }, [activeTab]);

  const updatePillPosition = () => {
    const idx = TABS.indexOf(activeTab);
    const btn = buttonRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPillStyle({
      left: br.left - cr.left + container.scrollLeft,
      width: br.width,
    });
  };

  useLayoutEffect(() => {
    updatePillPosition();
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
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

        {/* Tab Navigation with sliding pill */}
        <div className="mb-4 sm:mb-8">
          <div
            ref={containerRef}
            className="relative flex space-x-1 bg-[#171717] p-1 rounded-lg border border-white/20 w-full sm:w-fit overflow-x-auto"
          >
            <div
              className="absolute top-1 bottom-1 rounded-lg shadow-sm pointer-events-none transition-all duration-300 ease-out"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                backgroundColor: TAB_BG[activeTab],
              }}
            />
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                ref={(el) => { buttonRefs.current[idx] = el; }}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap min-h-[44px] transition-colors duration-300 ease-out active:scale-[0.98] ${activeTab === tab
                  ? activeTab === 'crypto' ? 'text-white' : 'text-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                {t(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Content – fade-in when tab changes */}
        <div key={activeTab} className="stats-tab-content">
          <StatsOverview selectedPeriod={selectedPeriod} tradeType={activeTab} />
          <StatsCharts selectedPeriod={selectedPeriod} tradeType={activeTab} />
          <DetailedStats selectedPeriod={selectedPeriod} tradeType={activeTab} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
