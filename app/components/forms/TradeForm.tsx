"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Trade, TradeType, Direction } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useTrades } from '../../context/TradeContext';
import { useFormContext } from '../../context/FormContext';
import { X, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import DatePicker from '../ui/DatePicker';

interface TradeFormProps {
  existingTrade?: Trade;
  onComplete: () => void;
}

export default function TradeForm({ existingTrade, onComplete }: TradeFormProps) {
  const { t } = useI18n();
  const { addTrade, updateTrade } = useTrades();
  const { setIsTradeFormOpen } = useFormContext();
  const [showSuccess, setShowSuccess] = useState(false);
  const [tradeTypes, setTradeTypes] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [isFormOpen, setIsFormOpen] = useState(true);

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
      link: existingTrade.link,
    } : {
      type: '' as unknown as TradeType,
      symbol: '',
      direction: 'long' as Direction,
      entryDate: '',
      exitDate: '',
      entryPrice: undefined,
      exitPrice: undefined,
      quantity: undefined,
      setupNotes: '',
      link: '',
    }
  });

  // Fetch trade types from backend (via internal proxy)
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/journal/trades/type', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            setTradeTypes(data.results);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchTypes();
  }, []);

  const entryDate = watch('entryDate');

  // Block navigation when form is open (only for new trades, not editing)
  useEffect(() => {
    if (existingTrade) return; // Don't block navigation for editing existing trades

    // Set global form state
    setIsTradeFormOpen(isFormOpen);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormOpen) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (isFormOpen) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push a state to prevent back button
    if (isFormOpen) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      setIsTradeFormOpen(false); // Clean up on unmount
    };
  }, [isFormOpen, existingTrade, setIsTradeFormOpen]);

  const onSubmit = async (data: Omit<Trade, 'id'>) => {
    const tradeData = {
      ...data,
      symbol: data.symbol.replace(/USDT$/i, '')
    };

    try {
      if (existingTrade) {
        await updateTrade(existingTrade.id, tradeData);
      } else {
        await addTrade(tradeData);
      }

      setShowSuccess(true);
      setIsFormOpen(false); // Allow navigation after successful submission
      setTimeout(() => {
        onComplete();
      }, 800);
    } catch (error) {
      console.error('Error saving trade:', error);
      setShowSuccess(true);
      setIsFormOpen(false); // Allow navigation after error
      setTimeout(() => {
        onComplete();
      }, 800);
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#1C1719] rounded-lg shadow-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('tradeType')}</label>
          <select
            {...register('type', { required: 'Trade type is required' })}
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white",
              errors.type ? "border-danger" : "border-white/15"
            )}
          >
            <option value="" disabled hidden>{t('selectType')}</option>
            {(tradeTypes.length > 0 ? tradeTypes : [
              { id: 2, name: 'STOCK', slug: 'stock' },
              { id: 1, name: 'CRYPTO', slug: 'crypto' },
            ]).map(t => (
              <option key={t.id} value={t.slug.toLowerCase()}>{t.name}</option>
            ))}
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
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/30",
              errors.symbol ? "border-danger" : "border-white/15"
            )}
            style={{
              WebkitBoxShadow: '0 0 0 1000px #342f31 inset',
              WebkitTextFillColor: 'white',
              transition: 'background-color 5000s ease-in-out 0s'
            }}
          />
          {errors.symbol && (
            <p className="text-danger text-sm mt-1">{errors.symbol.message}</p>
          )}
        </div>

        <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('direction')}</label>
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
            style={{
              WebkitBoxShadow: '0 0 0 1000px #342f31 inset',
              WebkitTextFillColor: 'white',
              transition: 'background-color 5000s ease-in-out 0s'
            }}
          />
          {errors.quantity && (
            <p className="text-danger text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>


        <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('entryDate')}</label>
          <Controller
            name="entryDate"
            control={control}
            rules={{ required: 'Entry date is required' }}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder={t('selectEntryDate')}
                error={!!errors.entryDate}
              />
            )}
          />
          {errors.entryDate && (
            <p className="text-danger text-sm mt-1">{errors.entryDate.message}</p>
          )}
        </div>

        <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('exitDate')}</label>
          <Controller
            name="exitDate"
            control={control}
            rules={{ 
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
                placeholder={t('selectExitDate')}
                error={!!errors.exitDate}
              />
            )}
          />
          {errors.exitDate && (
            <p className="text-red-500 text-sm mt-1">{errors.exitDate.message}</p>
          )}
        </div>

        <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('entryPrice')}</label>
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
            style={{
              WebkitBoxShadow: '0 0 0 1000px #342f31 inset',
              WebkitTextFillColor: 'white',
              transition: 'background-color 5000s ease-in-out 0s'
            }}
          />
          {errors.entryPrice && (
            <p className="text-danger text-sm mt-1">{errors.entryPrice.message}</p>
          )}
        </div>

        <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('exitPrice')}</label>
          <input
            type="number"
            inputMode="decimal"
            {...register('exitPrice', {
              setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)),
              validate: (v) => {
                // Allow empty for pending trades; if provided, must be > 0
                if (v === '' || v == null) return true;
                const num = typeof v === 'number' ? v : Number(v);
                return num >= 0 || 'Exit price must be zero or positive';
              }
            })}
            step="any"
            placeholder="0.00"
            className={clsx(
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-500/40",
              errors.exitPrice ? "border-danger" : "border-white/15"
            )}
            style={{
              WebkitBoxShadow: '0 0 0 1000px #342f31 inset',
              WebkitTextFillColor: 'white',
              transition: 'background-color 5000s ease-in-out 0s'
            }}
          />
          {errors.exitPrice && (
            <p className="text-danger text-sm mt-1">{errors.exitPrice.message}</p>
          )}
        </div>
      </div>

      {/* Link field - full width */}
      <div>
          <label className="block text-sm font-medium mb-1 text-white" style={{ color: '#ffffff' }}>{t('tradeLink')}</label>
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
              "w-full rounded-md border px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/20",
              errors.link ? "border-danger" : "border-white/15"
            )}
          style={{
            WebkitBoxShadow: '0 0 0 1000px #342f31 inset',
            WebkitTextFillColor: 'white',
            color: 'white',
            transition: 'background-color 5000s ease-in-out 0s'
          }}
        />
        {errors.link && (
          <p className="text-danger text-sm mt-1">{errors.link.message}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">Add a link to trade screenshot, chart, or analysis</p>
      </div>


      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">{t('setupNotes')}</label>
        <textarea
          {...register('setupNotes')}
          rows={4}
          placeholder="Describe your trade setup and strategy..."
          className="w-full rounded-md border border-white/15 px-3 py-2 bg-[#342f31] text-white placeholder-gray-400/20"
        ></textarea>
      </div>


      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(false); // Allow navigation when canceling
            onComplete();
          }}
          className="px-4 py-2 border border-white/15 rounded-md bg-[#342f31] text-white hover:bg-yellow-600/80 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
          aria-label={existingTrade ? 'Update trade information' : 'Add new trade'}
        >
          {existingTrade ? 'Update Trade' : 'Add Trade'}
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