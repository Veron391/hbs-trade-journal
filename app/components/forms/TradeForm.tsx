"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Trade, TradeType, Direction } from '../../types';
import { useTradeMutations } from '../../../lib/hooks/useTrades';
import { X, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import DatePicker from '../ui/DatePicker';

interface TradeFormProps {
  existingTrade?: Trade;
  onComplete: () => void;
}

export default function TradeForm({ existingTrade, onComplete }: TradeFormProps) {
  const { createTrade, updateTrade } = useTradeMutations();
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>(existingTrade?.tags || []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<Omit<Trade, 'id'>>({
    defaultValues: existingTrade ? {
      type: existingTrade.type,
      symbol: existingTrade.symbol,
      direction: existingTrade.direction,
      entryDate: existingTrade.entryDate,
      exitDate: existingTrade.exitDate,
      entryPrice: existingTrade.entryPrice,
      exitPrice: existingTrade.exitPrice,
      quantity: existingTrade.quantity,
      setupNotes: existingTrade.setupNotes,
      mistakesNotes: existingTrade.mistakesNotes,
      tags: existingTrade.tags,
      link: existingTrade.link,
    } : {
      type: 'stock' as TradeType,
      symbol: '',
      direction: 'long' as Direction,
      entryDate: '',
      exitDate: '',
      entryPrice: undefined,
      exitPrice: undefined,
      quantity: undefined,
      setupNotes: '',
      mistakesNotes: '',
      tags: [],
      link: '',
    }
  });

  const entryDate = watch('entryDate');

  const onSubmit = async (data: Omit<Trade, 'id'>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Form data received:', data);
      
      const tradeData = {
        ...data,
        symbol: data.symbol.replace(/USDT$/i, ''), // Remove USDT suffix (case insensitive)
        tags: tags || []
      };
      
      console.log('Processed trade data:', tradeData);
      
      if (existingTrade) {
        // Convert to API format
        const apiPayload = {
          assetType: tradeData.type as 'stock' | 'crypto',
          symbol: tradeData.symbol,
          side: tradeData.direction === 'long' ? 'buy' : 'sell',
          qty: typeof tradeData.quantity === 'number' ? tradeData.quantity : parseFloat(String(tradeData.quantity || '1')),
          price: typeof tradeData.exitPrice === 'number' ? tradeData.exitPrice : parseFloat(String(tradeData.exitPrice || '0')), // Exit price
          entryPrice: typeof tradeData.entryPrice === 'number' ? tradeData.entryPrice : parseFloat(String(tradeData.entryPrice || '0')), // Entry price
          pnl: tradeData.entryPrice && tradeData.exitPrice ? 
            (tradeData.direction === 'long' ? 
              (parseFloat(String(tradeData.exitPrice)) - parseFloat(String(tradeData.entryPrice))) * parseFloat(String(tradeData.quantity || '1')) :
              (parseFloat(String(tradeData.entryPrice)) - parseFloat(String(tradeData.exitPrice))) * parseFloat(String(tradeData.quantity || '1'))
            ) : undefined,
          occurredAt: tradeData.exitDate || tradeData.entryDate,
          entryDate: tradeData.entryDate,
          exitDate: tradeData.exitDate,
          setupNotes: tradeData.setupNotes,
          mistakesNotes: tradeData.mistakesNotes,
          tags: tradeData.tags && tradeData.tags.length > 0 ? tradeData.tags.join(', ') : undefined,
          link: tradeData.link,
        };
        
        console.log('API payload for update:', apiPayload);
        await updateTrade(existingTrade.id, apiPayload);
      } else {
        // Convert to API format
        const apiPayload = {
          assetType: tradeData.type as 'stock' | 'crypto',
          symbol: tradeData.symbol,
          side: tradeData.direction === 'long' ? 'buy' : 'sell',
          qty: typeof tradeData.quantity === 'number' ? tradeData.quantity : parseFloat(String(tradeData.quantity || '1')),
          price: typeof tradeData.exitPrice === 'number' ? tradeData.exitPrice : parseFloat(String(tradeData.exitPrice || '0')), // Exit price
          entryPrice: typeof tradeData.entryPrice === 'number' ? tradeData.entryPrice : parseFloat(String(tradeData.entryPrice || '0')), // Entry price
          pnl: tradeData.entryPrice && tradeData.exitPrice ? 
            (tradeData.direction === 'long' ? 
              (parseFloat(String(tradeData.exitPrice)) - parseFloat(String(tradeData.entryPrice))) * parseFloat(String(tradeData.quantity || '1')) :
              (parseFloat(String(tradeData.entryPrice)) - parseFloat(String(tradeData.exitPrice))) * parseFloat(String(tradeData.quantity || '1'))
            ) : undefined,
          occurredAt: tradeData.exitDate || tradeData.entryDate,
          entryDate: tradeData.entryDate,
          exitDate: tradeData.exitDate,
          setupNotes: tradeData.setupNotes,
          mistakesNotes: tradeData.mistakesNotes,
          tags: tradeData.tags && tradeData.tags.length > 0 ? tradeData.tags.join(', ') : undefined,
          link: tradeData.link,
        };
        
        console.log('API payload for create:', apiPayload);
        await createTrade(apiPayload);
      }
      
      console.log('Trade created/updated successfully');
      // Show success message
      setShowSuccess(true);
      
      // Wait a bit before completing
      setTimeout(() => {
        setShowSuccess(false);
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error in onSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() !== '' && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#1C1719] rounded-lg shadow-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Trade Type</label>
          <select
            {...register('type', { required: 'Trade type is required' })}
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white",
              errors.type ? "border-danger" : "border-white/15"
            )}
          >
            <option value="stock">Stock</option>
            <option value="crypto">Cryptocurrency</option>
          </select>
          {errors.type && (
            <p className="text-danger text-sm mt-1">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Symbol</label>
          <input
            type="text"
            {...register('symbol', { required: 'Symbol is required' })}
            placeholder="AAPL, BTC, etc."
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/60",
              errors.symbol ? "border-danger" : "border-white/15"
            )}
          />
          {errors.symbol && (
            <p className="text-danger text-sm mt-1">{errors.symbol.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Direction</label>
          <select
            {...register('direction', { required: 'Direction is required' })}
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white",
              errors.direction ? "border-danger" : "border-white/15"
            )}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          {errors.direction && (
            <p className="text-danger text-sm mt-1">{errors.direction.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Quantity</label>
          <input
            type="number"
            {...register('quantity', { 
              required: 'Quantity is required',
              min: { value: 0.0001, message: 'Quantity must be positive' }
            })}
            step="any"
            placeholder="0"
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-500/40",
              errors.quantity ? "border-danger" : "border-white/15"
            )}
          />
          {errors.quantity && (
            <p className="text-danger text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Entry Date</label>
          <Controller
            name="entryDate"
            control={control}
            rules={{ required: 'Entry date is required' }}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Select entry date"
                error={!!errors.entryDate}
              />
            )}
          />
          {errors.entryDate && (
            <p className="text-danger text-sm mt-1">{errors.entryDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Exit Date</label>
          <Controller
            name="exitDate"
            control={control}
            rules={{ 
              required: 'Exit date is required',
              validate: (value) => {
                if (!entryDate || !value) return true;
                const entry = new Date(entryDate);
                const exit = new Date(value);
                return exit >= entry || 'Exit date cannot be earlier than entry date';
              }
            }}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Select exit date"
                error={!!errors.exitDate}
              />
            )}
          />
          {errors.exitDate && (
            <p className="text-red-500 text-sm mt-1">{errors.exitDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Entry Price</label>
          <input
            type="number"
            {...register('entryPrice', { 
              required: 'Entry price is required',
              min: { value: 0.00000001, message: 'Entry price must be positive' }
            })}
            step="any"
            placeholder="0.00"
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-500/40",
              errors.entryPrice ? "border-danger" : "border-white/15"
            )}
          />
          {errors.entryPrice && (
            <p className="text-danger text-sm mt-1">{errors.entryPrice.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Exit Price</label>
          <input
            type="number"
            {...register('exitPrice', { 
              required: 'Exit price is required',
              min: { value: 0.00000001, message: 'Exit price must be positive' }
            })}
            step="any"
            placeholder="0.00"
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-500/40",
              errors.exitPrice ? "border-danger" : "border-white/15"
            )}
          />
          {errors.exitPrice && (
            <p className="text-danger text-sm mt-1">{errors.exitPrice.message}</p>
          )}
        </div>
      </div>

      {/* Link field - full width */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">Trade Link (Optional)</label>
        <input
          type="url"
          {...register('link', {
            pattern: {
              value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
              message: 'Please enter a valid URL'
            }
          })}
          placeholder="https://example.com/trade-screenshot"
          className={clsx(
            "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/60",
            errors.link ? "border-danger" : "border-white/15"
          )}
        />
        {errors.link && (
          <p className="text-danger text-sm mt-1">{errors.link.message}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">Add a link to trade screenshot, chart, or analysis</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <div key={index} className="bg-[#342f31] border border-white/15 px-3 py-1 rounded-full flex items-center">
              <span className="mr-1 text-gray-200">{tag}</span>
              <button 
                type="button" 
                onClick={() => handleRemoveTag(tag)}
                className="text-gray-400 hover:text-danger"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {/* Unified input + button inside one bordered container */}
        <div className="flex items-center rounded-md border border-white/15 bg-[#342f31] overflow-hidden">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag and press Enter"
            className="flex-grow px-3 py-2 bg-transparent text-white placeholder-gray-400/60 outline-none border-none"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 text-white/90 hover:text-yellow-300 hover:bg-yellow-500/15 border-l border-white/10 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">Trade Setup Notes</label>
        <textarea
          {...register('setupNotes')}
          rows={4}
          placeholder="Describe your trade setup and strategy..."
          className="w-full rounded-md border border-white/15 px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/60"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">Mistakes & Learnings</label>
        <textarea
          {...register('mistakesNotes')}
          rows={4}
          placeholder="What mistakes did you make? What did you learn?"
          className="w-full rounded-md border border-white/15 px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/60"
        ></textarea>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onComplete}
          disabled={isSubmitting}
          className="px-4 py-2 border border-white/15 rounded-md bg-[#342f31] text-white hover:bg-yellow-600/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={existingTrade ? 'Update trade information' : 'Add new trade'}
        >
          {isSubmitting ? 'Saving...' : (existingTrade ? 'Update Trade' : 'Add Trade')}
        </button>
      </div>
      
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col items-center">
            <CheckCircle className="text-success h-16 w-16 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {existingTrade ? 'Trade Updated!' : 'Trade Added!'}
            </h3>
            <p className="text-gray-300 mb-4">Your trade has been successfully saved.</p>
          </div>
        </div>
      )}
      </form>
    </div>
  );
} 