import React, { useState, useEffect } from 'react';
import { labelForPeriod, labelForCategory, useLineSeries } from '../../../lib/dataService';
import { useFilters } from '../../../lib/filters';
import PLLine from '../charts/PLLine';
import { getPLSeries, type PLPoint } from '../../../lib/services/admin';

const PLLineCard = React.memo(() => {
  const { period, category } = useFilters();
  const legacyData = useLineSeries();
  const [mockData, setMockData] = useState<PLPoint[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load mock data from API
  useEffect(() => {
    const loadMockData = async () => {
      try {
        setLoading(true);
        const plSeries = await getPLSeries({ period, category });
        setMockData(plSeries);
      } catch (error) {
        console.error('Error loading P/L series:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMockData();
  }, [period, category]);
  
  // Use mock data if available, otherwise fallback to legacy data
  const data = mockData.length > 0 ? mockData : legacyData;
  
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
