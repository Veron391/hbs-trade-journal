"use client";

import { useTrades } from '../../context/TradeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  defaults,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { differenceInDays } from 'date-fns';
import { useState, useMemo } from 'react';
import { useI18n } from '../../context/I18nContext';
import CumulativePLChartNew from '../charts/CumulativePLChart.New';
import { filterTradesByPeriod, TimePeriod } from './TimePeriodSelector';
import { TradeType } from '../../types';
import { filterCompletedTrades } from '@/lib/utils/tradeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Set default font color for Chart.js to match theme
defaults.color = '#ffffff';

interface StatsChartsProps {
  selectedPeriod: TimePeriod;
  tradeType?: TradeType;
}

export default function StatsCharts({ selectedPeriod, tradeType }: StatsChartsProps) {
  const { t } = useI18n();
  const { trades } = useTrades();
  const [hiddenSegments, setHiddenSegments] = useState<Set<number>>(new Set());
  const [hiddenTradeTypeSegments, setHiddenTradeTypeSegments] = useState<Set<number>>(new Set());

  // Filter trades based on selected period and calculate stats
  const { filteredTrades, filteredStats } = useMemo(() => {
    let filtered = filterTradesByPeriod(trades, selectedPeriod);

    // Filter by trade type if specified (not 'total')
    if (tradeType && tradeType !== 'total') {
      filtered = filtered.filter(trade => trade.type === tradeType);
    }

    // Filter out pending trades - only calculate stats for completed trades
    filtered = filterCompletedTrades(filtered);

    if (filtered.length === 0) {
      return {
        filteredTrades: [],
        filteredStats: {
          winningTrades: 0,
          losingTrades: 0,
          breakEvenTrades: 0,
          winRate: 0,
        }
      };
    }

    // Process each trade and categorize them
    const processedTrades = filtered.map(trade => {
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;

      const entryTotal = entryPrice * quantity;
      const exitTotal = exitPrice * quantity;

      let profitLoss = 0;
      if (trade.direction === 'long') {
        profitLoss = exitTotal - entryTotal;
      } else {
        profitLoss = entryTotal - exitTotal;
      }

      return {
        ...trade,
        profitLoss,
        isWinner: profitLoss > 0.01,
        isLoser: profitLoss < -0.01,
        isBreakEven: Math.abs(profitLoss) <= 0.01,
      };
    });

    // Filter trades by result
    const winningTrades = processedTrades.filter(t => t.isWinner);
    const losingTrades = processedTrades.filter(t => t.isLoser);
    const breakEvenTrades = processedTrades.filter(t => t.isBreakEven);

    const winRate = processedTrades.length > 0 ? winningTrades.length / processedTrades.length : 0;

    return {
      filteredTrades: filtered,
      filteredStats: {
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        breakEvenTrades: breakEvenTrades.length,
        winRate,
      }
    };
  }, [trades, selectedPeriod, tradeType]);

  if (filteredTrades.length === 0) {
    return (
      <div className="mt-8 space-y-8">
        <h2 className="text-xl font-semibold text-white">{t('performanceCharts')}</h2>
        <div className="text-center py-12 bg-[#101010] rounded-lg">
          <p className="text-gray-300">No trades found for the selected period.</p>
        </div>
      </div>
    );
  }

  // Helpers to create gradients safely (avoid NaN/undefined coordinates during initial layout)
  const createSafeGradient = (
    chart: any,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    dark: string,
    light: string,
    fallbackSolid: string
  ) => {
    const valuesAreFinite = [startX, startY, endX, endY].every(
      v => typeof v === 'number' && Number.isFinite(v)
    );
    if (!valuesAreFinite) {
      const area = chart && chart.chartArea;
      if (area && [area.left, area.top, area.right, area.bottom].every(v => Number.isFinite(v))) {
        const g = chart.ctx.createLinearGradient(area.left, area.top, area.right, area.top);
        g.addColorStop(0, dark);
        g.addColorStop(1, light);
        return g;
      }
      return fallbackSolid;
    }
    const g = chart.ctx.createLinearGradient(startX, startY, endX, endY);
    g.addColorStop(0, dark);
    g.addColorStop(1, light);
    return g;
  };

  const arcAlignedGradient = (
    chart: any,
    arc: any,
    dark: string,
    light: string,
    fallbackSolid: string
  ) => {
    if (!arc) {
      const area = chart && chart.chartArea;
      if (area && [area.left, area.top, area.right, area.bottom].every(v => Number.isFinite(v))) {
        const g = chart.ctx.createLinearGradient(area.left, area.top, area.right, area.top);
        g.addColorStop(0, dark);
        g.addColorStop(1, light);
        return g;
      }
      return fallbackSolid;
    }
    const x = arc.x;
    const y = arc.y;
    const startAngle = arc.startAngle;
    const endAngle = arc.endAngle;
    const innerRadius = arc.innerRadius;
    const outerRadius = arc.outerRadius;
    const radius = ((innerRadius || 0) + (outerRadius || 0)) / 2;
    const startX = x + Math.cos(startAngle) * radius;
    const startY = y + Math.sin(startAngle) * radius;
    const endX = x + Math.cos(endAngle) * radius;
    const endY = y + Math.sin(endAngle) * radius;
    return createSafeGradient(chart, startX, startY, endX, endY, dark, light, fallbackSolid);
  };

  // Process data for Win/Loss ratio chart
  const winLossData = {
    labels: ['Winning Trades', 'Losing Trades', 'Break Even'],
    datasets: [
      {
        data: [filteredStats.winningTrades, filteredStats.losingTrades, filteredStats.breakEvenTrades],
        backgroundColor: [
          'rgba(57, 158, 212, 0.85)', // Winning trades (blue)
          'rgba(208, 0, 0, 0.85)', // Losing trades (softer red)
          'rgba(214, 213, 201, 0.9)', // Break even (soft gray)
        ],
        borderWidth: 0,
        spacing: 6,
        borderRadius: 20,
        hoverOffset: 12,
      },
    ],
  };

  // Toggle segment visibility
  const toggleSegment = (index: number) => {
    const newHidden = new Set(hiddenSegments);
    if (newHidden.has(index)) {
      newHidden.delete(index);
    } else {
      newHidden.add(index);
    }
    setHiddenSegments(newHidden);
  };

  // Toggle trade type segment visibility
  const toggleTradeTypeSegment = (index: number) => {
    const newHidden = new Set(hiddenTradeTypeSegments);
    if (newHidden.has(index)) {
      newHidden.delete(index);
    } else {
      newHidden.add(index);
    }
    setHiddenTradeTypeSegments(newHidden);
  };

  // Filter data based on hidden segments
  const filteredWinLossData = {
    ...winLossData,
    datasets: [{
      ...winLossData.datasets[0],
      data: winLossData.datasets[0].data.map((value, index) =>
        hiddenSegments.has(index) ? 0 : value
      ),
      backgroundColor: (ctx: any) => {
        const index = ctx.dataIndex;
        if (hiddenSegments.has(index)) {
          return 'rgba(0,0,0,0.1)';
        }
        if (index === 0) {
          return '#399ed4'; // Winning trades - solid blue
        } else if (index === 1) {
          return '#ED213A'; // Losing trades - solid red
        } else if (index === 2) {
          return 'rgba(251, 243, 213, 1)'; // Break even - solid beige
        }
        return (winLossData.datasets[0].backgroundColor as any)[index];
      },
    }]
  };

  // Center text plugin to show win rate percentage
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart: any, _args: any, pluginOptions?: any) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      // Prefer the value provided via plugin options to avoid stale closures
      const providedText = pluginOptions && pluginOptions.text;
      const winRatePercent = providedText ?? `${(filteredStats.winRate * 100).toFixed(2)}%`;

      // Debug logging
      console.log('Filtered Stats Data:', {
        winningTrades: filteredStats.winningTrades,
        losingTrades: filteredStats.losingTrades,
        breakEvenTrades: filteredStats.breakEvenTrades,
        winRate: filteredStats.winRate,
        winRatePercent: winRatePercent
      });

      const text = typeof winRatePercent === 'string' ? winRatePercent : `${winRatePercent}%`;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;

      // Main percent
      ctx.font = '600 26px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x, y - 8);

      // Subtitle: Win Rate (translated)
      ctx.font = '500 13px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      ctx.fillStyle = 'rgba(229, 231, 235, 0.85)'; // text-gray-200-ish
      ctx.fillText(t('winRate'), x, y + 16);
      ctx.restore();
    },
  };

  // Center text plugin to show total trades count for Trade Type Distribution
  const tradeTypeCenterTextPlugin = {
    id: 'tradeTypeCenterText',
    afterDraw(chart: any, _args: any, pluginOptions?: any) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const totalTrades = allTradesForPeriod.length;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;

      // Main number
      ctx.font = '600 26px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(totalTrades.toString(), x, y - 8);

      // Subtitle: Total Trades (translated)
      ctx.font = '500 13px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      ctx.fillStyle = 'rgba(229, 231, 235, 0.85)'; // text-gray-200-ish
      ctx.fillText(t('totalTrades'), x, y + 16);
      ctx.restore();
    },
  };

  // Plugin: visually enlarge only the hovered bar slightly
  const barHoverPlugin = {
    id: 'barHoverPlugin',
    afterDatasetsDraw(chart: any) {
      const active = chart.getActiveElements && chart.getActiveElements();
      if (!active || active.length === 0) return;
      const { datasetIndex, index } = active[0];
      const meta = chart.getDatasetMeta(datasetIndex);
      const bar: any = meta && meta.data ? meta.data[index] : undefined;
      if (!bar) return;

      const value = (chart.data.datasets?.[datasetIndex]?.data?.[index] as number) ?? 0;
      const ctx = chart.ctx;
      const x = bar.x;
      const y = bar.y;
      const base = bar.base;
      const width = bar.width;

      // Enlarge hovered bar by ~6% width and 3px height
      const inflateX = Math.max(2, Math.round(width * 0.06));
      const inflateY = 3;
      const left = x - width / 2 - inflateX / 2;
      const right = x + width / 2 + inflateX / 2;
      const top = Math.min(y, base) - inflateY;
      const bottom = Math.max(y, base) + inflateY;

      const radius = 22; // keep corners rounded nicely
      const color = value >= 0 ? '#2DDD1A' : '#FF4D4D';

      ctx.save();
      ctx.beginPath();
      // rounded rectangle path
      const rTopLeft = value >= 0 ? radius : 4;
      const rTopRight = value >= 0 ? radius : 4;
      const rBottomLeft = value >= 0 ? 4 : radius;
      const rBottomRight = value >= 0 ? 4 : radius;
      const w = right - left;
      const h = bottom - top;
      const x0 = left;
      const y0 = top;

      // top-left corner
      ctx.moveTo(x0 + rTopLeft, y0);
      ctx.lineTo(x0 + w - rTopRight, y0);
      ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rTopRight);
      ctx.lineTo(x0 + w, y0 + h - rBottomRight);
      ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rBottomRight, y0 + h);
      ctx.lineTo(x0 + rBottomLeft, y0 + h);
      ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rBottomLeft);
      ctx.lineTo(x0, y0 + rTopLeft);
      ctx.quadraticCurveTo(x0, y0, x0 + rTopLeft, y0);

      ctx.fillStyle = color;
      ctx.globalAlpha = 1; // draw solid to feel like actual enlargement
      ctx.shadowColor = 'transparent';
      ctx.fill();
      ctx.restore();
    }
  };

  // Plugin: soft glow behind cumulative line (mint glow)
  const lineGlowPlugin = {
    id: 'lineGlow',
    beforeDatasetsDraw(chart: any, _args: any, pluginOptions?: { datasetIndex?: number }) {
      const datasetIndex = pluginOptions && typeof pluginOptions.datasetIndex === 'number' ? pluginOptions.datasetIndex : 0;
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || !meta.dataset) return;
      const ctx = chart.ctx;
      ctx.save();
      ctx.shadowColor = 'rgba(54, 215, 167, 0.45)';
      ctx.shadowBlur = 12;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      meta.dataset.draw(ctx);
      ctx.restore();
    },
  };

  // Remove the old rounded donut plugin as we're using Chart.js built-in borderRadius now

  // Process data for P&L per trade chart - last 10 trades from filtered trades
  const last10Trades = [...filteredTrades]
    .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
    .slice(0, 10)
    .reverse();

  // Ensure we have exactly 10 trades, fill with empty data if needed
  while (last10Trades.length < 10) {
    last10Trades.push({
      symbol: `Trade ${last10Trades.length + 1}`,
      exitDate: new Date().toISOString(),
      entryPrice: 0,
      exitPrice: 0,
      quantity: 0,
      direction: 'long'
    } as any);
  }

  const calculatePnL = (trade: any) => {
    const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : 0;
    const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : 0;
    const quantity = typeof trade.quantity === 'number' ? trade.quantity : 0;

    const entryValue = entryPrice * quantity;
    const exitValue = exitPrice * quantity;

    if (trade.direction === 'long') {
      return exitValue - entryValue;
    } else {
      return entryValue - exitValue;
    }
  };

  const pnlPerTradeData = {
    labels: last10Trades.map(trade => trade.symbol.replace('USDT', '')),
    datasets: [
      {
        label: 'Profit/Loss',
        data: last10Trades.map(trade => calculatePnL(trade)),
        backgroundColor: (ctx: any) => {
          const value = ctx.parsed.y;
          if (value >= 0) {
            return '#08CB00'; // Profit: yashil
          } else {
            return '#E62727'; // Loss: qizil
          }
        },
        borderWidth: 0,
        borderColor: (ctx: any) => {
          const value = ctx.parsed.y;
          return value >= 0 ? '#08CB00' : '#E62727';
        },
        hoverBorderColor: (ctx: any) => {
          const value = ctx.parsed.y;
          return value >= 0 ? '#2DDD1A' : '#FF4D4D';
        },
        hoverBorderWidth: 0,
        borderRadius: (ctx: any) => {
          const value = ctx.parsed.y;
          if (value >= 0) {
            // Profit: tepa uchlari yumaloq
            return {
              topLeft: 20,
              topRight: 20,
              bottomLeft: 0,
              bottomRight: 0,
            };
          } else {
            // Loss: pastki uchlari yumaloq
            return {
              topLeft: 0,
              topRight: 0,
              bottomLeft: 20,
              bottomRight: 20,
            };
          }
        },
        borderSkipped: false,
        hoverBackgroundColor: (ctx: any) => {
          const value = ctx.parsed.y;
          if (value >= 0) {
            return '#2DDD1A'; // Profit hover: yanada ochroq yashil
          } else {
            return '#FF4D4D'; // Loss hover: yanada ochroq qizil
          }
        },
        hoverBorderRadius: (ctx: any) => {
          const value = ctx.parsed.y;
          if (value >= 0) {
            // Profit: tepa uchlari yumaloq
            return {
              topLeft: 25,
              topRight: 25,
              bottomLeft: 0,
              bottomRight: 0,
            };
          } else {
            // Loss: pastki uchlari yumaloq
            return {
              topLeft: 0,
              topRight: 0,
              bottomLeft: 25,
              bottomRight: 25,
            };
          }
        },
        // Hover qilinganda barchartdagi faqat tanlangan bar vizual ravishda ajralib turadi
      },
    ],
  };

  // Process data for trade type distribution - use ALL trades from period (not filtered by trade type)
  const allTradesForPeriod = filterTradesByPeriod(trades, selectedPeriod);
  const tradeTypeData = {
    labels: ['Stock', 'Crypto'],
    datasets: [
      {
        data: [
          allTradesForPeriod.filter(t => t.type === 'stock').length,
          allTradesForPeriod.filter(t => t.type === 'crypto').length,
        ],
        backgroundColor: [
          '#f0ae88', // Stock (beige)
          '#f5deb3', // Crypto (light beige)
        ],
        borderWidth: 0,
        spacing: 6,
        borderRadius: 20,
        hoverOffset: 12,
      },
    ],
  };

  // Filter trade type data based on hidden segments
  const filteredTradeTypeData = {
    ...tradeTypeData,
    datasets: [{
      ...tradeTypeData.datasets[0],
      data: tradeTypeData.datasets[0].data.map((value, index) =>
        hiddenTradeTypeSegments.has(index) ? 0 : value
      ),
      backgroundColor: [
        hiddenTradeTypeSegments.has(0) ? 'rgba(0,0,0,0.1)' : '#EBD9D1', // Light beige for Stock
        hiddenTradeTypeSegments.has(1) ? 'rgba(0,0,0,0.1)' : '#D97706', // Darker orange for Crypto
      ],
      hoverBackgroundColor: [
        hiddenTradeTypeSegments.has(0) ? 'rgba(0,0,0,0.1)' : '#DCC5B2', // Darker beige on hover
        hiddenTradeTypeSegments.has(1) ? 'rgba(0,0,0,0.1)' : '#B45309', // Even darker orange on hover
      ],
    }]
  };

  // Cumulative P&L over time
  const sortedTrades = [...filteredTrades].sort((a, b) =>
    new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );

  let cumulativePnL = 0;
  const cumulativePnLData = {
    labels: sortedTrades.map(trade => trade.symbol.replace('USDT', '')),
    datasets: [
      {
        label: 'Cumulative P&L',
        data: sortedTrades.map(trade => {
          cumulativePnL += calculatePnL(trade);
          return cumulativePnL;
        }),
        borderColor: '#36D7A7',
        borderWidth: 3,
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(54, 215, 167, 0.08)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(54, 215, 167, 0.25)');
          g.addColorStop(1, 'rgba(54, 215, 167, 0.02)');
          return g;
        },
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#36D7A7',
        pointHoverBorderColor: '#0E1F28',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  // Trade hold time vs. P&L
  const holdTimeVsPnLData = {
    datasets: [
      {
        label: 'Winning Trades',
        data: filteredTrades
          .filter(trade => calculatePnL(trade) > 0)
          .map(trade => ({
            x: differenceInDays(new Date(trade.exitDate), new Date(trade.entryDate)),
            y: calculatePnL(trade),
            symbol: trade.symbol,
          })),
        backgroundColor: '#059669',
      },
      {
        label: 'Losing Trades',
        data: filteredTrades
          .filter(trade => calculatePnL(trade) < 0)
          .map(trade => ({
            x: differenceInDays(new Date(trade.exitDate), new Date(trade.entryDate)),
            y: calculatePnL(trade),
            symbol: trade.symbol,
          })),
        backgroundColor: '#DC2626',
      },
    ],
  };

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-xl font-semibold text-white">{t('performanceCharts')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Win/Loss Ratio */}
        <div className="bg-[#101010] p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-100">{t('winLossRatio')}</h3>
          <div className="h-80 flex items-center gap-8">
            {/* Custom legend (always white text) */}
            <div className="hidden md:flex flex-col text-white text-base space-y-6">
              <div
                className={`flex items-center gap-4 cursor-pointer transition-all duration-200 ${hiddenSegments.has(0) ? 'opacity-50' : ''
                  }`}
                onClick={() => toggleSegment(0)}
              >
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#399ed4', border: 'none' }} />
                <span className={hiddenSegments.has(0) ? 'line-through' : ''}>{t('winningTrades')}</span>
              </div>
              <div
                className={`flex items-center gap-4 cursor-pointer transition-all duration-200 ${hiddenSegments.has(1) ? 'opacity-50' : ''
                  }`}
                onClick={() => toggleSegment(1)}
              >
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#D00000', border: 'none' }} />
                <span className={hiddenSegments.has(1) ? 'line-through' : ''}>{t('losingTrades')}</span>
              </div>
              <div
                className={`flex items-center gap-4 cursor-pointer transition-all duration-200 ${hiddenSegments.has(2) ? 'opacity-50' : ''
                  }`}
                onClick={() => toggleSegment(2)}
              >
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#d6d5c9', border: 'none' }} />
                <span className={hiddenSegments.has(2) ? 'line-through' : ''}>{t('breakEven')}</span>
              </div>
            </div>
            <div
              className="flex-1 min-w-0 h-full flex items-center justify-center"
            >
              <Doughnut
                data={filteredWinLossData}
                options={{
                  color: '#ffffff',
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '62%',
                  rotation: -90,
                  circumference: 360,
                  layout: { padding: 20 },
                  plugins: {
                    centerText: { text: `${(filteredStats.winRate * 100).toFixed(2)}%` },
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      usePointStyle: true,
                      displayColors: true,
                      titleAlign: 'center',
                      bodyAlign: 'center',
                      boxPadding: 10,
                      callbacks: {
                        label: function (context: TooltipItem<'doughnut'>) {
                          const value = context.parsed as number;
                          return `${value}`;
                        },
                      }
                    },
                  },
                } as any}
                plugins={[centerTextPlugin]}
              />
            </div>
          </div>
        </div>

        {/* Trade Type Distribution */}
        <div className="bg-[#101010] p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-100">{t('tradeTypeDistribution')}</h3>
          <div className="h-80 flex">
            <div className="flex flex-col justify-center gap-6 pr-8">
              <div
                className={`flex items-center gap-4 cursor-pointer transition-all duration-200 ${hiddenTradeTypeSegments.has(0) ? 'opacity-50' : ''
                  }`}
                onClick={() => toggleTradeTypeSegment(0)}
              >
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#EBD9D1', border: 'none' }} />
                <span className={hiddenTradeTypeSegments.has(0) ? 'line-through' : ''}>{t('stock')}</span>
              </div>
              <div
                className={`flex items-center gap-4 cursor-pointer transition-all duration-200 ${hiddenTradeTypeSegments.has(1) ? 'opacity-50' : ''
                  }`}
                onClick={() => toggleTradeTypeSegment(1)}
              >
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B', border: 'none' }} />
                <span className={hiddenTradeTypeSegments.has(1) ? 'line-through' : ''}>{t('crypto')}</span>
              </div>
            </div>
            <div
              className="flex-1 min-w-0 h-full flex items-center justify-center"
            >
              <Doughnut
                data={filteredTradeTypeData}
                options={{
                  color: '#ffffff',
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '62%',
                  rotation: -90,
                  circumference: 360,
                  layout: { padding: 20 },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      usePointStyle: true,
                      displayColors: true,
                      titleAlign: 'center',
                      bodyAlign: 'center',
                      boxPadding: 10,
                      callbacks: {
                        label: function (context) {
                          const value = context.parsed as number;
                          return `${value}`;
                        },
                      }
                    },
                  },
                }}
                plugins={[tradeTypeCenterTextPlugin]}
              />
            </div>
          </div>
        </div>

        {/* P&L per Trade (Last 10) */}
        <div className="bg-[#101010] p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-100">{t('pnlPerTrade')}</h3>
          <div className="h-80">
            <Bar
              data={pnlPerTradeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                barPercentage: 0.45, // Barlarni 20% ga kengaytirildi (0.25 -> 0.45)
                categoryPercentage: 0.8, // Bar orasidagi masofa
                interaction: { mode: 'nearest', intersect: true },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    usePointStyle: true,
                    boxWidth: 6,
                    boxHeight: 6,
                    callbacks: {
                      title: function (context: TooltipItem<'bar'>[]) {
                        return context[0].label; // Aktiv tikeri
                      },
                      label: function (context: TooltipItem<'bar'>) {
                        const value = context.parsed.y as number;
                        const sign = value >= 0 ? '+' : '';
                        const pad = "\u00a0\u00a0\u00a0\u00a0"; // extra gap after color dot
                        return `${pad}${sign}${value.toFixed(2)}$`; // +30$ / -30$
                      },
                      labelPointStyle: function (context: TooltipItem<'bar'>) {
                        return { pointStyle: 'circle', rotation: 0 } as any;
                      },
                      labelColor: function (context: TooltipItem<'bar'>) {
                        const value = (context.parsed.y as number) ?? 0;
                        const color = value >= 0 ? '#2DDD1A' : '#FF4D4D';
                        return {
                          borderColor: color,
                          backgroundColor: color,
                        } as any;
                      }
                    }
                  }
                },
                onHover: (event: any, elements: any) => {
                  const canvas = event.native?.target as HTMLCanvasElement;
                  if (canvas) {
                    canvas.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.05)'
                    }
                  }
                },
              } as any}
              plugins={[barHoverPlugin]}
            />
          </div>
        </div>

        {/* Cumulative P&L */}
        <CumulativePLChartNew selectedPeriod={selectedPeriod} tradeType={tradeType} />
      </div>
    </div>
  );
} 