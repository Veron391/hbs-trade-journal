"use client";

import { useState } from 'react';
import StatsOverview from '../../components/dashboard/StatsOverview';
import DetailedStats from '../../components/dashboard/DetailedStats';
import StatsCharts from '../../components/dashboard/StatsCharts';
import TimePeriodSelector from '../../components/dashboard/TimePeriodSelector';
import { useTimePeriod } from '../../context/TimePeriodContext';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { TradeType } from '../../types';

export default function StatsPage() {
  const { selectedPeriod, setSelectedPeriod } = useTimePeriod();
  const [activeTab, setActiveTab] = useState<TradeType>('total');

  return (
    <ProtectedRoute>
      <div className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-xl font-bold text-white">Trading Statistics</h1>
          <TimePeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-[#1C1719] p-1 rounded-lg border border-white/20 w-fit">
            <button
              onClick={() => setActiveTab('total')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'total'
                  ? 'bg-[#A8BBA3] text-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'stock'
                  ? 'bg-[#EBD9D1] text-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Stock
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'crypto'
                  ? 'bg-[#D97706] text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Crypto
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