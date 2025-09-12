// Risk monitoring rules and alert system
export interface RiskAlert {
  id: string;
  type: 'equityDrop' | 'lowWinRate' | 'highExposure';
  severity: 'red' | 'amber';
  studentId: string;
  studentName: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

export interface RiskMetrics {
  studentId: string;
  studentName: string;
  equityDrop7d: number;
  winRate: number;
  totalTrades: number;
  exposure: number;
  balance: number;
  leverage: number;
  largestDrawdown: number;
  maxSingleTradeLoss: number;
  tradesThisWeek: number;
  isHighFrequency: boolean;
}

// Alert rules
export const RISK_RULES = {
  EQUITY_DROP_THRESHOLD: 20, // 20% drop in 7 days
  LOW_WIN_RATE_THRESHOLD: 35, // 35% win rate
  MIN_TRADES_FOR_WIN_RATE: 50, // Minimum trades to check win rate
  HIGH_EXPOSURE_THRESHOLD: 60, // 60% of balance
  HIGH_FREQUENCY_THRESHOLD: 150, // 150 trades per week
} as const;

// Generate risk alerts based on metrics
export function generateRiskAlerts(metrics: RiskMetrics[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  
  metrics.forEach((metric) => {
    // Equity drop alert
    if (metric.equityDrop7d > RISK_RULES.EQUITY_DROP_THRESHOLD) {
      alerts.push({
        id: `${metric.studentId}-equity-${Date.now()}`,
        type: 'equityDrop',
        severity: 'red',
        studentId: metric.studentId,
        studentName: metric.studentName,
        message: `Equity dropped ${metric.equityDrop7d.toFixed(1)}% in 7 days`,
        value: metric.equityDrop7d,
        threshold: RISK_RULES.EQUITY_DROP_THRESHOLD,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Low win rate alert
    if (metric.winRate < RISK_RULES.LOW_WIN_RATE_THRESHOLD && metric.totalTrades >= RISK_RULES.MIN_TRADES_FOR_WIN_RATE) {
      alerts.push({
        id: `${metric.studentId}-winrate-${Date.now()}`,
        type: 'lowWinRate',
        severity: 'amber',
        studentId: metric.studentId,
        studentName: metric.studentName,
        message: `Win rate ${metric.winRate.toFixed(1)}% with ${metric.totalTrades} trades`,
        value: metric.winRate,
        threshold: RISK_RULES.LOW_WIN_RATE_THRESHOLD,
        timestamp: new Date().toISOString(),
      });
    }
    
    // High exposure alert
    if (metric.exposure > RISK_RULES.HIGH_EXPOSURE_THRESHOLD) {
      alerts.push({
        id: `${metric.studentId}-exposure-${Date.now()}`,
        type: 'highExposure',
        severity: 'amber',
        studentId: metric.studentId,
        studentName: metric.studentName,
        message: `Exposure ${metric.exposure.toFixed(1)}% of balance`,
        value: metric.exposure,
        threshold: RISK_RULES.HIGH_EXPOSURE_THRESHOLD,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  return alerts;
}

// Filter alerts by severity
export function filterAlertsBySeverity(alerts: RiskAlert[], severity: 'all' | 'red' | 'amber'): RiskAlert[] {
  if (severity === 'all') return alerts;
  return alerts.filter(alert => alert.severity === severity);
}

// Get alert count by severity
export function getAlertCounts(alerts: RiskAlert[]) {
  return {
    total: alerts.length,
    red: alerts.filter(alert => alert.severity === 'red').length,
    amber: alerts.filter(alert => alert.severity === 'amber').length,
  };
}
