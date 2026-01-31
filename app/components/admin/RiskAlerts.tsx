'use client';

import { memo, useState } from 'react';
import SectionCard from '../ui/SectionCard';
import { RiskAlert, filterAlertsBySeverity, getAlertCounts } from '../../../lib/rules';
import { AlertTriangle, Filter, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface RiskAlertsProps {
  alerts: RiskAlert[];
  onMarkAsRead?: () => void;
  isAllRead?: boolean;
}

const RiskAlerts = memo(({ alerts, onMarkAsRead, isAllRead }: RiskAlertsProps) => {
  const [filter, setFilter] = useState<'all' | 'red' | 'amber'>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [openAlerts, setOpenAlerts] = useState<Set<string>>(new Set());
  const filteredAlerts = filterAlertsBySeverity(alerts, filter);
  const counts = getAlertCounts(alerts);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const toggleAlert = (alertId: string) => {
    setOpenAlerts(prev =>
      prev.has(alertId)
        ? new Set([...prev].filter(id => id !== alertId))
        : new Set([...prev, alertId])
    );
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="space-y-1">
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-neutral-600" />
              <p>No {filter === 'all' ? '' : filter} alerts found</p>
            </div>
          ) : (
            visibleAlerts.map((alert, index) => {
              const isOpen = openAlerts.has(alert.id);
              const isAboveOpen = index > 0 && openAlerts.has(visibleAlerts[index - 1].id);
              const isBelowOpen = index < visibleAlerts.length - 1 && openAlerts.has(visibleAlerts[index + 1].id);

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border transition-all duration-300 ${isOpen
                      ? `border-2 ${alert.severity === 'red'
                        ? 'border-red-500 hover:border-red-400 shadow-[inset_0_1px_0_rgba(239,68,68,0.3),inset_0_-1px_0_rgba(185,28,28,0.5),0_2px_4px_rgba(0,0,0,0.1)]'
                        : 'border-amber-500 hover:border-amber-400 shadow-[inset_0_1px_0_rgba(245,158,11,0.3),inset_0_-1px_0_rgba(180,83,9,0.5),0_2px_4px_rgba(0,0,0,0.1)]'
                      }`
                      : `${getSeverityColor(alert.severity)} hover:border-neutral-500/70`
                    } ${isAboveOpen ? 'mt-2' : ''
                    } ${isBelowOpen ? 'mb-2' : ''
                    }`}
                  style={{
                    transform: isOpen ? 'scale(1.02)' : 'scale(1)',
                    zIndex: isOpen ? 10 : 1,
                    position: 'relative',
                    width: '95%',
                    marginLeft: '2.5%'
                  }}
                >
                  {/* Alert Header */}
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`w-full p-4 text-left flex items-center justify-between transition-all duration-200 ${isOpen
                        ? getSeverityColor(alert.severity) + ' hover:opacity-90'
                        : 'hover:bg-neutral-800/30'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full transition-all duration-200 ${isOpen
                          ? 'bg-neutral-700/50 scale-110'
                          : 'bg-neutral-700/50'
                        }`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {alert.studentName}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'red'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                            }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 mb-1">
                          {formatTimestamp(alert.timestamp)}
                        </div>
                        {!isOpen && (
                          <div className="text-sm text-neutral-300 line-clamp-2">
                            {alert.message.length > 80
                              ? `${alert.message.substring(0, 80)}...`
                              : alert.message
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">
                        {isOpen ? 'Hide' : 'Show'} Details
                      </span>
                      <div className={`p-1 rounded-full transition-all duration-200 ${isOpen
                          ? 'bg-neutral-700/50 rotate-180'
                          : 'bg-neutral-700/50'
                        }`}>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Alert Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className={`px-4 pb-4 pt-2 border-t rounded-b-xl ${alert.severity === 'red'
                        ? 'border-red-500/50'
                        : 'border-amber-500/50'
                      } ${alert.severity === 'red'
                        ? 'bg-red-900/10'
                        : 'bg-amber-900/10'
                      }`}>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-white mb-2">Alert Details</h4>
                        <p className="text-sm text-neutral-300 leading-relaxed">{alert.message}</p>
                      </div>

                      <div className={`mb-3 p-3 rounded-xl border ${alert.severity === 'red'
                          ? 'bg-red-900/10 border-red-500/50'
                          : 'bg-amber-900/10 border-amber-500/50'
                        }`}>
                        <h5 className="text-xs font-medium text-neutral-300 mb-2">Risk Metrics</h5>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-neutral-400">Current Value:</span>
                            <span className="ml-2 font-medium text-white">{alert.value.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Threshold:</span>
                            <span className="ml-2 font-medium text-white">{alert.threshold}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Deviation:</span>
                            <span className={`ml-2 font-medium ${Math.abs(alert.value - alert.threshold) > 5
                                ? 'text-red-400'
                                : 'text-amber-400'
                              }`}>
                              {Math.abs(alert.value - alert.threshold).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Severity:</span>
                            <span className={`ml-2 font-medium ${alert.severity === 'red'
                                ? 'text-red-400'
                                : 'text-amber-400'
                              }`}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissAlert(alert.id);
                            }}
                            className="px-3 py-1 bg-red-600/20 text-red-400 text-xs rounded-md hover:bg-red-600/30 transition-all duration-200 hover:scale-105"
                          >
                            Dismiss
                          </button>
                          <button className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-md hover:bg-blue-600/30 transition-all duration-200 hover:scale-105">
                            Mark as Read
                          </button>
                          <button className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-md hover:bg-green-600/30 transition-all duration-200 hover:scale-105">
                            Take Action
                          </button>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Alert ID: #{alert.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </SectionCard>
  );
});

RiskAlerts.displayName = 'RiskAlerts';

export default RiskAlerts;
