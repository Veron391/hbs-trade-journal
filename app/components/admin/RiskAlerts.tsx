'use client';

import { memo, useState } from 'react';
import SectionCard from '../ui/SectionCard';
import { RiskAlert, filterAlertsBySeverity, getAlertCounts } from '../../../lib/rules';
import { AlertTriangle, X, Filter, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface RiskAlertsProps {
  alerts: RiskAlert[];
  onMarkAsRead?: () => void;
  isAllRead?: boolean;
}

const RiskAlerts = memo(({ alerts, onMarkAsRead, isAllRead }: RiskAlertsProps) => {
  const [filter, setFilter] = useState<'all' | 'red' | 'amber'>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const filteredAlerts = filterAlertsBySeverity(alerts, filter);
  const counts = getAlertCounts(alerts);

  const handleDismissAlert = (alertId: number) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleMarkAllAsRead = () => {
    // Dismiss all visible alerts
    const allAlertIds = filteredAlerts.map(alert => alert.id);
    setDismissedAlerts(prev => new Set([...prev, ...allAlertIds]));
    
    // Call parent's mark as read function
    if (onMarkAsRead) {
      onMarkAsRead();
    }
  };

  const visibleAlerts = filteredAlerts.filter(alert => !dismissedAlerts.has(alert.id));

  const getSeverityColor = (severity: 'red' | 'amber') => {
    return severity === 'red' 
      ? 'bg-red-900/30 text-red-400 border-red-500/30' 
      : 'bg-amber-900/30 text-amber-400 border-amber-500/30';
  };

  const getSeverityIcon = (severity: 'red' | 'amber') => {
    return severity === 'red' 
      ? <AlertTriangle className="h-4 w-4 text-red-400" />
      : <AlertTriangle className="h-4 w-4 text-amber-400" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SectionCard
      title="Risk Alerts"
      icon={AlertTriangle}
      action={
        <div className="flex items-center gap-2">
          {onMarkAsRead && !isAllRead && visibleAlerts.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              title="Mark all as read"
            >
              <Check className="h-3 w-3" />
              Mark as Read
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-neutral-700 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-neutral-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            )}
          </button>
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'red' | 'amber')}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All ({counts.total})</option>
            <option value="red">Red ({counts.red})</option>
            <option value="amber">Amber ({counts.amber})</option>
          </select>
        </div>
      }
    >
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-3">
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-neutral-600" />
              <p>No {filter === 'all' ? '' : filter} alerts found</p>
            </div>
          ) : (
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{alert.studentName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'red' 
                            ? 'bg-red-500/20 text-red-300' 
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <span>Value: {alert.value.toFixed(1)}%</span>
                        <span>Threshold: {alert.threshold}%</span>
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-neutral-400 hover:text-neutral-200 transition-colors p-1 hover:bg-neutral-700 rounded"
                    title="Dismiss alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
});

RiskAlerts.displayName = 'RiskAlerts';

export default RiskAlerts;
