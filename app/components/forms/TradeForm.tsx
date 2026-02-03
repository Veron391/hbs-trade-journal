"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Trade, TradeType, Direction } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useTrades } from '../../context/TradeContext';
import { useFormContext } from '../../context/FormContext';
import clsx from 'clsx';
import DatePicker from '../ui/DatePicker';
import AddTradeToggle from '../ui/AddTradeToggle';

interface TradeFormProps {
  existingTrade?: Trade;
  onComplete: () => void;
}

export default function TradeForm({ existingTrade, onComplete }: TradeFormProps) {
  const { t } = useI18n();
  const { addTrade, updateTrade } = useTrades();
  const { setIsTradeFormOpen } = useFormContext();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const dotlottieContainerRef = useRef<HTMLDivElement>(null);

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
      type: 'stock' as TradeType,
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
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving trade:', error);
      setShowSuccess(true);
      setIsFormOpen(false);
    }
  };

  // When confirmation is shown, wait for the Lottie animation to finish before calling onComplete
  useEffect(() => {
    if (!showSuccess) return;
    const fallbackTimer = setTimeout(() => onComplete(), 4000);
    const handleComplete = () => {
      clearTimeout(fallbackTimer);
      onComplete();
    };
    let removeComplete: (() => void) | undefined;
    const t = setTimeout(() => {
      const el = dotlottieContainerRef.current?.querySelector('dotlottie-wc') as (HTMLElement & { dotLottie?: { addEventListener: (e: string, fn: () => void) => void; removeEventListener: (e: string, fn: () => void) => void } }) | null;
      if (el?.dotLottie) {
        el.dotLottie.addEventListener('complete', handleComplete);
        removeComplete = () => el.dotLottie?.removeEventListener?.('complete', handleComplete);
      }
    }, 100);
    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(t);
      removeComplete?.();
    };
  }, [showSuccess, onComplete]);


  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#101010] rounded-lg shadow-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="add-trade-form space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Trade type is required' }}
              render={({ field }) => (
                <AddTradeToggle
                  label={t('tradeType')}
                  options={[
                    { value: 'stock', label: t('stock') },
                    { value: 'crypto', label: t('crypto') },
                  ]}
                  value={field.value || 'stock'}
                  onChange={field.onChange}
                  activeColor="#F07E3B"
                  activeColorMap={{ stock: '#2563EB', crypto: '#EA580C' }}
                  error={!!errors.type}
                />
              )}
            />
            {errors.type && (
              <p className="text-danger text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Controller
              name="direction"
              control={control}
              rules={{ required: 'Direction is required' }}
              render={({ field }) => (
                <AddTradeToggle
                  label={t('direction')}
                  options={[
                    { value: 'long', label: 'Long' },
                    { value: 'short', label: 'Short' },
                  ]}
                  value={field.value || 'long'}
                  onChange={field.onChange}
                  activeColor="#4EB676"
                  activeColorMap={{ long: '#16A34A', short: '#DC2626' }}
                  error={!!errors.direction}
                />
              )}
            />
            {errors.direction && (
              <p className="text-danger text-sm mt-1">{errors.direction.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Symbol</label>
            <input
              type="text"
              {...register('symbol', { required: 'Symbol is required' })}
              placeholder="AAPL, BTC, etc."
              className={clsx(
                "w-full rounded-md border px-3 py-2 min-h-[48px] bg-[#202020] text-white placeholder-[#303030]",
                errors.symbol ? "border-danger" : "border-[0.4px] border-white/10"
              )}
              style={{
                WebkitBoxShadow: '0 0 0 1000px #202020 inset',
                WebkitTextFillColor: 'white',
                transition: 'background-color 5000s ease-in-out 0s'
              }}
            />
            {errors.symbol && (
              <p className="text-danger text-sm mt-1">{errors.symbol.message}</p>
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
                "w-full rounded-md border px-3 py-2 min-h-[48px] bg-[#202020] text-white placeholder-[#303030]",
                errors.quantity ? "border-danger" : "border-[0.4px] border-white/10"
              )}
              style={{
                WebkitBoxShadow: '0 0 0 1000px #202020 inset',
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
                "w-full rounded-md border px-3 py-2 min-h-[48px] bg-[#202020] text-white placeholder-[#303030]",
                errors.entryPrice ? "border-danger" : "border-[0.4px] border-white/10"
              )}
              style={{
                WebkitBoxShadow: '0 0 0 1000px #202020 inset',
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
                  // Allow empty for pending trades; if provided, must be >= 0
                  if (v == null || v === undefined) return true;
                  const num = typeof v === 'number' ? v : Number(v);
                  return num >= 0 || 'Exit price must be zero or positive';
                }
              })}
              step="any"
              placeholder="0.00"
              className={clsx(
                "w-full rounded-md border px-3 py-2 min-h-[48px] bg-[#202020] text-white placeholder-[#303030]",
                errors.exitPrice ? "border-danger" : "border-[0.4px] border-white/10"
              )}
              style={{
                WebkitBoxShadow: '0 0 0 1000px #202020 inset',
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
              "w-full rounded-md border px-3 py-2 min-h-[48px] bg-[#202020] text-white placeholder-[#303030]",
              errors.link ? "border-danger" : "border-[0.4px] border-white/10"
            )}
            style={{
              WebkitBoxShadow: '0 0 0 1000px #202020 inset',
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
            className="w-full rounded-md border-[0.4px] border-white/10 px-3 py-2 bg-[#202020] text-white placeholder-[#303030]"
          ></textarea>
        </div>


        <div className="add-trade-form-actions flex justify-end gap-4">
          <button
            type="button"
            className="add-trade-cancel-btn px-4 py-2 border border-[#1e1e1e]/60 rounded-md bg-[#202020] text-white transition-colors duration-200 focus:outline-none focus:ring-0"
            onClick={() => {
              setIsFormOpen(false); // Allow navigation when canceling
              onComplete();
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="add-trade-submit-btn px-4 py-2 bg-[#202020] text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-0"
            aria-label={existingTrade ? 'Update trade information' : 'Add new trade'}
          >
            {existingTrade ? 'Update Trade' : 'Add Trade'}
          </button>
        </div>

        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
            <div className="confirmation-done flex flex-col items-center justify-center rounded-2xl p-8 max-w-sm text-center">
              <div ref={dotlottieContainerRef} className="lottie-success-done mb-5 flex items-center justify-center flex-shrink-0">
                {/* @ts-expect-error dotlottie-wc web component */}
                <dotlottie-wc
                  src="https://lottie.host/f8d70e51-c7b3-416b-81ee-c685d2cde7da/oQc6G8AypK.lottie"
                  style={{ width: '200px', height: '200px' }}
                  autoplay
                />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">
                {existingTrade ? 'Trade updated' : 'Trade added'}
              </h2>
              <p className="text-sm text-neutral-400">
                {existingTrade ? 'Your changes have been saved.' : 'Your trade has been saved successfully.'}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 