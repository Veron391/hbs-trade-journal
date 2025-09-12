import useSWR from 'swr'
import { mutate } from 'swr'
import { Trade, CreateTradePayload, UpdateTradePayload } from '../api/trades'
import { listTrades, createTrade, updateTrade, deleteTrade } from '../api/trades'

const TRADES_KEY = '/api/trades'

// Main hook for fetching trades
export function useTrades() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<Trade[]>(
    TRADES_KEY,
    listTrades,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    trades: data || [],
    isLoading,
    error,
    revalidate,
  }
}

// Hook for trade mutations
export function useTradeMutations() {
  const createTradeMutation = async (payload: CreateTradePayload) => {
    try {
      const newTrade = await createTrade(payload)
      
      // Optimistic update
      mutate(TRADES_KEY, (currentTrades: Trade[] | undefined) => {
        return currentTrades ? [newTrade, ...currentTrades] : [newTrade]
      }, false)
      
      // Revalidate to ensure consistency
      mutate(TRADES_KEY)
      
      return newTrade
    } catch (error) {
      // Revalidate on error to rollback optimistic update
      mutate(TRADES_KEY)
      throw error
    }
  }

  const updateTradeMutation = async (id: string, payload: UpdateTradePayload) => {
    try {
      const updatedTrade = await updateTrade(id, payload)
      
      // Optimistic update
      mutate(TRADES_KEY, (currentTrades: Trade[] | undefined) => {
        if (!currentTrades) return currentTrades
        return currentTrades.map(trade => 
          trade.id === id ? updatedTrade : trade
        )
      }, false)
      
      // Revalidate to ensure consistency
      mutate(TRADES_KEY)
      
      return updatedTrade
    } catch (error) {
      // Revalidate on error to rollback optimistic update
      mutate(TRADES_KEY)
      throw error
    }
  }

  const deleteTradeMutation = async (id: string) => {
    try {
      await deleteTrade(id)
      
      // Optimistic update
      mutate(TRADES_KEY, (currentTrades: Trade[] | undefined) => {
        if (!currentTrades) return currentTrades
        return currentTrades.filter(trade => trade.id !== id)
      }, false)
      
      // Revalidate to ensure consistency
      mutate(TRADES_KEY)
      
    } catch (error) {
      // Revalidate on error to rollback optimistic update
      mutate(TRADES_KEY)
      throw error
    }
  }

  const clearAllTradesMutation = async () => {
    try {
      // Get current trades
      const currentTrades = await listTrades()
      
      // Delete all trades one by one
      await Promise.all(currentTrades.map(trade => deleteTrade(trade.id)))
      
      // Optimistic update - clear all trades
      mutate(TRADES_KEY, [], false)
      
      // Revalidate to ensure consistency
      mutate(TRADES_KEY)
      
    } catch (error) {
      // Revalidate on error to rollback optimistic update
      mutate(TRADES_KEY)
      throw error
    }
  }

  return {
    createTrade: createTradeMutation,
    updateTrade: updateTradeMutation,
    deleteTrade: deleteTradeMutation,
    clearAllTrades: clearAllTradesMutation,
  }
}
