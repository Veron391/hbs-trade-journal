"use client";

import React, { useMemo } from 'react';
import { useTrades } from "../../context/TradeContext";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

export default function StatsCard() {
  const { trades } = useTrades();

  const stats = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        totalPnL: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        riskRewardRatio: 0,
      };
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let breakEvenTrades = 0;
    let totalPnL = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let largestWin = 0;
    let largestLoss = 0;

    // Process each trade
    trades.forEach((trade) => {
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      
      const entryValue = entryPrice * quantity;
      const exitValue = exitPrice * quantity;
      
      let pnl = 0;
      if (trade.direction === 'long') {
        pnl = exitValue - entryValue;
      } else {
        pnl = entryValue - exitValue;
      }

      totalPnL += pnl;

      if (pnl > 0) {
        winningTrades++;
        totalWinAmount += pnl;
        largestWin = Math.max(largestWin, pnl);
      } else if (pnl < 0) {
        losingTrades++;
        totalLossAmount += Math.abs(pnl);
        largestLoss = Math.max(largestLoss, Math.abs(pnl));
      } else {
        breakEvenTrades++;
      }
    });

    const winRate = (winningTrades / trades.length) * 100;
    const averageWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0;
    // Calculate average risk/reward ratio
    const riskRewardRatio = averageWin && averageLoss ? averageWin / averageLoss : 0;

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      breakEvenTrades,
      totalPnL,
      winRate,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      riskRewardRatio,
    };
  }, [trades]);

  // Format currency with dollar sign and two decimal places
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}$${absValue.toFixed(2)}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Trading Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total P&L */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total P&L</span>
            <div
              className={`flex items-center ${
                stats.totalPnL > 0
                  ? "text-success"
                  : stats.totalPnL < 0
                  ? "text-danger"
                  : "text-gray-400"
              }`}
            >
              {stats.totalPnL > 0 ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : stats.totalPnL < 0 ? (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              ) : null}
            </div>
          </div>
          <div className={`text-2xl font-bold mt-2 ${
              stats.totalPnL > 0
                ? "text-success"
                : stats.totalPnL < 0
                ? "text-danger"
                : "text-gray-400"
            }`}>
            {formatCurrency(stats.totalPnL)}
          </div>
        </div>

        {/* Total Trades */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Total Trades</div>
          <div className="text-2xl font-bold text-white mt-2">{stats.totalTrades}</div>
        </div>

        {/* Win Rate */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Win Rate</div>
          <div className="text-2xl font-bold text-white mt-2">{stats.winRate.toFixed(1)}%</div>
        </div>

        {/* Win/Loss Breakdown */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Win/Loss/Break-Even</div>
          <div className="text-2xl font-bold text-white mt-2">
            <span className="text-success">{stats.winningTrades}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-danger">{stats.losingTrades}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-gray-300">{stats.breakEvenTrades}</span>
          </div>
        </div>

        {/* Average Win */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Average Win</div>
          <div className="text-2xl font-bold text-success mt-2">{formatCurrency(stats.averageWin)}</div>
        </div>

        {/* Average Loss */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Average Loss</div>
          <div className="text-2xl font-bold text-danger mt-2">{formatCurrency(-stats.averageLoss)}</div>
        </div>

        {/* Largest Win */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Largest Win</div>
          <div className="text-2xl font-bold text-success mt-2">{formatCurrency(stats.largestWin)}</div>
        </div>

        {/* Largest Loss */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Largest Loss</div>
          <div className="text-2xl font-bold text-danger mt-2">{formatCurrency(-stats.largestLoss)}</div>
        </div>

        {/* Risk/Reward Ratio */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400">Risk/Reward Ratio</div>
          <div className="text-2xl font-bold text-white mt-2">{stats.riskRewardRatio.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
} 