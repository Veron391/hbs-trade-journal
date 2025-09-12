'use client';

import { memo, useState } from 'react';
import SectionCard from '../ui/SectionCard';
import AvatarBadge from '../ui/AvatarBadge';
import { formatCurrency } from '../../../lib/mock';
import { TrendingDown, DollarSign, Activity, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface RiskMonitoringProps {
  largestDrawdowns: Array<{
    rank: number;
    name: string;
    drawdown: number;
    studentId: string;
  }>;
  maxSingleTradeLosses: Array<{
    rank: number;
    name: string;
    loss: number;
    studentId: string;
  }>;
  highFrequencyTraders: {
    traders: Array<{
      rank: number;
      name: string;
      tradesThisWeek: number;
      studentId: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const RiskMonitoring = memo(({ 
  largestDrawdowns, 
  maxSingleTradeLosses, 
  highFrequencyTraders
}: RiskMonitoringProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-red-400 font-bold">#{rank}</span>;
    if (rank === 2) return <span className="text-orange-400 font-bold">#{rank}</span>;
    if (rank === 3) return <span className="text-yellow-400 font-bold">#{rank}</span>;
    return <span className="text-neutral-400 text-sm font-medium">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Risk Monitoring</h2>
          <p className="text-neutral-400">Real-time risk assessment and alerts</p>
        </div>
      </div>

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Largest Drawdowns */}
        <SectionCard
          title="Largest Drawdown (7d)"
          icon={TrendingDown}
          subtitle="Top 3 students"
        >
          <div className="space-y-3">
            {largestDrawdowns.map((student) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between p-4 hover:bg-blue-900/30 hover:border-blue-500/20 rounded-xl transition-colors border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(student.rank)}
                  </div>
                  <AvatarBadge name={student.name} size="sm" />
                  <div>
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-neutral-400 text-sm">Student ID: {student.studentId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-semibold">
                    -{formatCurrency(student.drawdown)}
                  </p>
                  <p className="text-neutral-400 text-sm">Drawdown</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Max Single Trade Loss */}
        <SectionCard
          title="Max Single Trade Loss (7d)"
          icon={DollarSign}
          subtitle="Worst single trades"
        >
          <div className="space-y-3">
            {maxSingleTradeLosses.map((student) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between p-4 hover:bg-blue-900/30 hover:border-blue-500/20 rounded-xl transition-colors border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(student.rank)}
                  </div>
                  <AvatarBadge name={student.name} size="sm" />
                  <div>
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-neutral-400 text-sm">Student ID: {student.studentId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-semibold">
                    -{formatCurrency(student.loss)}
                  </p>
                  <p className="text-neutral-400 text-sm">Single Loss</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* High Frequency Trading - Full Width */}
        <div className="lg:col-span-2">
          <SectionCard
            title="High Frequency Trading"
            icon={Activity}
            subtitle=">150 trades/week"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highFrequencyTraders.traders.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-neutral-500">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-neutral-600" />
                    <p>No high frequency traders detected</p>
                  </div>
                ) : (
                  highFrequencyTraders.traders.map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-4 hover:bg-blue-900/30 hover:border-blue-500/20 rounded-xl transition-colors border border-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(student.rank)}
                        </div>
                        <AvatarBadge name={student.name} size="sm" />
                        <div>
                          <p className="text-white font-medium">{student.name}</p>
                          <p className="text-neutral-400 text-sm">Student ID: {student.studentId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-semibold">
                          {student.tradesThisWeek} trades
                        </p>
                        <p className="text-neutral-400 text-sm">This week</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {highFrequencyTraders.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                  <div className="text-sm text-neutral-400">
                    Showing {((currentPage - 1) * highFrequencyTraders.pageSize) + 1} to {Math.min(currentPage * highFrequencyTraders.pageSize, highFrequencyTraders.total)} of {highFrequencyTraders.total} traders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 bg-neutral-800 rounded-lg text-sm">
                      {currentPage} / {highFrequencyTraders.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(highFrequencyTraders.totalPages, prev + 1))}
                      disabled={currentPage === highFrequencyTraders.totalPages}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
});

RiskMonitoring.displayName = 'RiskMonitoring';

export default RiskMonitoring;
