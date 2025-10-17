import React, { useState, useEffect } from 'react';
import { labelForPeriod, labelForCategory, useLineSeries } from '../../../lib/dataService';
import { useFilters } from '../../../lib/filters';
import PLLine from '../charts/PLLine';
import { getPLSeries, type PLPoint } from '../../../lib/services/admin';

const PLLineCard = React.memo(() => {
  const { period, category, tradeType, customStartDate, customEndDate } = useFilters();
  const legacyData = useLineSeries();
  const [pnlData, setPnlData] = useState<PLPoint[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load PnL data from API
  useEffect(() => {
    const loadPnLData = async () => {
      try {
        setLoading(true);
        console.log('PLLineCard: Loading PnL data with filters:', { 
          period, 
          category, 
          tradeType, 
          customStartDate, 
          customEndDate 
        });
        
        const plSeries = await getPLSeries({ 
          period, 
          category, 
          tradeType, 
          customStartDate, 
          customEndDate 
        });
        
        console.log('PLLineCard: Received PnL data:', plSeries);
        setPnlData(plSeries);
      } catch (error) {
        console.error('PLLineCard: Error loading P/L series:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPnLData();
  }, [period, category, tradeType, customStartDate, customEndDate]);
  
  // Use PnL data if available, otherwise fallback to legacy data
  const data = pnlData.length > 0 ? pnlData : legacyData;
  
  return (
    <section className="panel bg-[#1A1A1F] border-neutral-700/50 p-5 md:p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">Total P/L (All students)</h3>
          <p className="text-sm text-neutral-400">
            {labelForCategory(category)} • {labelForPeriod(period)}
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-neutral-400">
          Loading chart data...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-neutral-400">
          No data in this period
        </div>
      ) : (
        <PLLine data={data} />
      )}
    </section>
  );
});

PLLineCard.displayName = 'PLLineCard';

export default PLLineCard;
