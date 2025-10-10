import useSWR from 'swr'
import { listTrades, createTrade, updateTrade, deleteTrade, Trade, CreateTradeData, UpdateTradeData } from '@/lib/api/trades'

export function useTrades() {
  const { data, error, isLoading, mutate } = useSWR<Trade[]>('/api/journal/trades', async () => listTrades(), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Disable automatic refresh
    dedupingInterval: 0 // Disable deduplication
  })

  const addTrade = async (tradeData: CreateTradeData) => {
    const created = await createTrade(tradeData)
    // Force immediate revalidation
    await mutate()
    return created
  }

  const editTrade = async (id: string, tradeData: UpdateTradeData) => {
    const updated = await updateTrade(id, tradeData)
    // Force immediate revalidation
    await mutate()
    return updated
  }

  const removeTrade = async (id: string) => {
    await deleteTrade(id)
    // Force immediate revalidation
    await mutate()
  }

  return {
    trades: data || [],
    isLoading,
    error,
    addTrade,
    editTrade,
    removeTrade,
    mutate,
  }
}
