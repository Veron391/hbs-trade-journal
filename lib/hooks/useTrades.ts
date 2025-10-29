import useSWR from 'swr'
import { listTrades, createTrade, updateTrade, deleteTrade, Trade, CreateTradeData, UpdateTradeData, TradesListResponse } from '@/lib/api/trades'
import { useAuth } from '@/app/context/AuthContext'

export function useTrades(limit: number = 10, offset: number = 0) {
  const { user, loading } = useAuth()
  
  const { data, error, isLoading, mutate } = useSWR<TradesListResponse>(
    user ? `/api/journal/trades?limit=${limit}&offset=${offset}` : null, // Only fetch when user is authenticated
    async () => listTrades(limit, offset), 
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Disable automatic refresh
      dedupingInterval: 0 // Disable deduplication
    }
  )

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
    trades: data?.trades || [],
    count: data?.count || 0,
    next: data?.next || null,
    previous: data?.previous || null,
    isLoading: loading || isLoading, // Show loading while auth is loading or data is loading
    error,
    addTrade,
    editTrade,
    removeTrade,
    mutate,
  }
}
