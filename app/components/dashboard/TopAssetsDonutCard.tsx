import React, { useMemo, useState, useEffect } from 'react';
import { labelForPeriod, labelForCategory, useDonutData } from '../../../lib/dataService';
import { useFilters } from '../../../lib/filters';
import SegmentedDonut from '../charts/SegmentedDonut';
import { getTopAssets, type TopAsset } from '../../../lib/services/admin';

const TopAssetsDonutCard = React.memo(() => {
  const { period, category } = useFilters();
  const legacyDonutData = useDonutData();
  const [mockAssets, setMockAssets] = useState<TopAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load mock data from API
  useEffect(() => {
    const loadMockData = async () => {
      try {
        setLoading(true);
        const topAssets = await getTopAssets({ period, category, limit: 7 });
        setMockAssets(topAssets);
      } catch (error) {
        console.error('Error loading top assets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMockData();
  }, [period, category]);

  // Convert mock data to donut format
  const mockDonutData = useMemo(() => {
    if (!mockAssets || !Array.isArray(mockAssets)) {
      return [];
    }
    return mockAssets
      .filter(asset => asset && asset.symbol && typeof asset.trades === 'number' && asset.trades > 0)
      .map(asset => ({
        label: asset.symbol,
        value: asset.trades
      }));
  }, [mockAssets]);

  // Use mock data if available, otherwise fallback to legacy data
  const donutData = mockDonutData.length > 0 ? mockDonutData : legacyDonutData;

  // Use real data without modification
  const modifiedDonutData = useMemo(() => {
    if (donutData.length === 0) return [];
    
    // Return top 7 assets sorted by trade count (highest first)
    return donutData.slice(0, 7);
  }, [donutData]);

  const totalValue = useMemo(() => {
    return modifiedDonutData.reduce((sum, item) => sum + item.value, 0);
  }, [modifiedDonutData]);

  const totalLabel = labelForCategory(category);

  // Loading state
  if (loading) {
    return (
      <section className="panel bg-[#1A1A1F] border-neutral-700/50 p-5 md:p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-100">Top Assets by Trades</h3>
            <p className="text-sm text-neutral-400">
              {totalLabel} • {labelForPeriod(period)}
            </p>
          </div>
        </div>
        
        <div className="flex h-[320px] items-center justify-center text-neutral-400">
          Loading chart data...
        </div>
      </section>
    );
  }

  // Empty state
  if (modifiedDonutData.length === 0 || totalValue === 0) {
    return (
      <section className="panel bg-[#1A1A1F] border-neutral-700/50 p-5 md:p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-100">Top Assets by Trades</h3>
            <p className="text-sm text-neutral-400">
              {totalLabel} • {labelForPeriod(period)}
            </p>
          </div>
        </div>
        
        <div className="flex h-[320px] items-center justify-center text-neutral-400">
          No data in this period
        </div>
      </section>
    );
  }

  return (
    <section className="panel bg-[#1A1A1F] border-neutral-700/50 p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">Top Assets by Trades</h3>
        <p className="text-sm text-neutral-400">
          {totalLabel} • {labelForPeriod(period)}
        </p>
      </div>
      
          <div className="flex items-center justify-center gap-10 h-[320px]">
            <div className="flex justify-center">
              <SegmentedDonut
                data={modifiedDonutData.slice(0, 7)}
                totalLabel="Total"
                size={220}
                thickness={22}
                gapDeg={5}
              />
            </div>
            <div className="flex-1 flex justify-center">
              <ul className="space-y-3 text-sm">
                {modifiedDonutData.slice(0, 7).map((d, i) => {
                  // Use the same color palette as the chart
                  const palette = ["#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#ef7722", "#f59e0b", "#fbbf24"];
                  return (
                    <li key={d.label} className="flex items-center gap-3">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ background: palette[i % palette.length] }}
                      />
                      <span className="text-neutral-200 font-medium w-16 text-left">{d.label}</span>
                      <span className="text-neutral-400 font-mono tabular-nums">{d.value.toLocaleString()}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
    </section>
  );
});

TopAssetsDonutCard.displayName = 'TopAssetsDonutCard';

export default TopAssetsDonutCard;
