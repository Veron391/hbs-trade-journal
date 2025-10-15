"use client";

import { useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/admin/FilterBar';
import { mockData, formatCurrency } from '../../../lib/mock';
import { useFilters } from '../../../lib/filters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TradesPage() {
  const { period, category, range } = useFilters();
  const [trades, setTrades] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let filteredTrades = mockData.getTradesLog();
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTrades = filteredTrades.filter(trade => 
        trade.symbol.toLowerCase().includes(query) ||
        trade.userName.toLowerCase().includes(query) ||
        trade.type.toLowerCase().includes(query)
      );
    }
    
    setTrades(filteredTrades);
  }, [period, category, range, searchQuery]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (value: number) => `#${value}`
    },
    {
      key: 'userName',
      label: 'User',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {value.split(' ')[1]?.[0] || 'U'}
          </div>
          <div>
            <div className="font-medium text-white">{value}</div>
            <div className="text-sm text-neutral-400">ID: {row.userId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'symbol',
      label: 'Symbol',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-emerald-400 font-medium">{value}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'BUY' ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'BUY' 
              ? 'bg-green-900/30 text-green-400' 
              : 'bg-red-900/30 text-red-400'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (value: number) => value.toLocaleString()
    },
    {
      key: 'entryPrice',
      label: 'Buy Price',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'exitPrice',
      label: 'Sell Price',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'pnl',
      label: 'P&L',
      sortable: true,
      render: (value: number) => (
        <span className={`font-medium ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const statusConfig = {
          FILLED: { color: 'bg-green-900/30 text-green-400', icon: '✓' },
          PENDING: { color: 'bg-yellow-900/30 text-yellow-400', icon: '⏳' },
          CANCELLED: { color: 'bg-red-900/30 text-red-400', icon: '✗' }
        };
        
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.FILLED;
        
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <span>{config.icon}</span>
            {value}
          </span>
        );
      }
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">
          <div className="text-white">
            {new Date(value).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-neutral-400">
            {new Date(value).toLocaleTimeString('en-US', { 
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      )
    }
  ];

  const handleExport = (data: any[]) => {
    const csvContent = [
      'ID,User,Symbol,Type,Quantity,Buy Price,Sell Price,P&L,Status,Date',
      ...data.map(trade => [
        trade.id,
        trade.userName,
        trade.symbol,
        trade.type,
        trade.quantity,
        trade.entryPrice,
        trade.exitPrice,
        trade.pnl,
        trade.status,
        trade.date
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trades_log.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusCounts = () => {
    const counts = trades.reduce((acc, trade) => {
      acc[trade.status] = (acc[trade.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trades Log</h1>
          <p className="text-neutral-400 mt-1">Monitor all trading activity across the platform</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-neutral-400">Filled: {statusCounts.FILLED || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-neutral-400">Pending: {statusCounts.PENDING || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-neutral-400">Cancelled: {statusCounts.CANCELLED || 0}</span>
            </div>
          </div>
          <div className="text-sm text-neutral-400">
            {trades.length} trades total
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Trades Table */}
      <DataTable
        data={trades}
        columns={columns}
        searchable={true}
        exportable={true}
        exportFilename="trades_log"
        onExport={handleExport}
      />
    </div>
  );
}
