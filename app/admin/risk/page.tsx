"use client";

import { useState, useEffect } from 'react';
import RiskMonitoring from '../../components/admin/RiskMonitoring';
import RiskAlerts from '../../components/admin/RiskAlerts';
import { mockData } from '../../../lib/mock';
import { generateRiskAlerts, RiskAlert } from '../../../lib/rules';
import { useRisk } from '../../context/RiskContext';

export default function RiskPage() {
  const [largestDrawdowns, setLargestDrawdowns] = useState<any[]>([]);
  const [maxSingleTradeLosses, setMaxSingleTradeLosses] = useState<any[]>([]);
  const [highFrequencyTraders, setHighFrequencyTraders] = useState<any>({
    traders: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [userRiskAlerts, setUserRiskAlerts] = useState<any[]>([]);
  const { isAllRead, setIsAllRead } = useRisk();

  useEffect(() => {
    // Load risk data
    const drawdowns = mockData.getLargestDrawdowns();
    const losses = mockData.getMaxSingleTradeLosses();
    const hfTraders = mockData.getHighFrequencyTraders(1, 10); // Page 1, 10 items per page
    const metrics = mockData.getRiskMetrics();
    
    // Generate risk alerts
    const alerts = generateRiskAlerts(metrics);
    
    // Generate mock user risk alerts
    const mockUserRiskAlerts = [
      {
        id: 1,
        studentName: 'John Doe',
        message: 'Total loss exceeded maximum limit',
        severity: 'red' as const,
        value: 85.5,
        threshold: 80,
        timestamp: new Date().toISOString(),
        type: 'total_loss'
      },
      {
        id: 2,
        studentName: 'Jane Smith',
        message: 'Single trade loss approaching limit',
        severity: 'amber' as const,
        value: 15.2,
        threshold: 20,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'single_trade_loss'
      },
      {
        id: 3,
        studentName: 'Mike Johnson',
        message: 'Drawdown limit exceeded',
        severity: 'red' as const,
        value: 92.3,
        threshold: 90,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        type: 'drawdown'
      },
      {
        id: 4,
        studentName: 'Sarah Wilson',
        message: 'Capital depletion warning',
        severity: 'amber' as const,
        value: 18.7,
        threshold: 25,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: 'capital_depletion'
      }
    ];
    
    setLargestDrawdowns(drawdowns);
    setMaxSingleTradeLosses(losses);
    setHighFrequencyTraders(hfTraders);
    setRiskAlerts(alerts);
    setUserRiskAlerts(mockUserRiskAlerts);
  }, []);

  const handleMarkAsRead = () => {
    setIsAllRead(true);
    // In real app, this would update the backend
  };

  return (
    <div className="space-y-6">
      {/* Risk Monitoring Cards */}
      <RiskMonitoring
        largestDrawdowns={largestDrawdowns}
        maxSingleTradeLosses={maxSingleTradeLosses}
        highFrequencyTraders={highFrequencyTraders}
      />

      {/* User Risk Alerts */}
      {userRiskAlerts.length > 0 && (
        <div className="mt-6">
          <RiskAlerts 
            alerts={userRiskAlerts} 
            onMarkAsRead={handleMarkAsRead}
            isAllRead={isAllRead}
          />
        </div>
      )}
    </div>
  );
}
