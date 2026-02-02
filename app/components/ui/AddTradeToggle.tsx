"use client";

import { useRef, useLayoutEffect, useState, useEffect } from 'react';

export type AddTradeToggleOption = { value: string; label: string };

/** Per-option pill color (e.g. { stock: '#4A74FF', crypto: '#F07E3B' }). Falls back to activeColor if missing. */
export type ActiveColorMap = Record<string, string>;

interface AddTradeToggleProps {
  options: AddTradeToggleOption[];
  value: string;
  onChange: (value: string) => void;
  /** Active pill color when no map; or fallback */
  activeColor: string;
  /** Per-value pill color (Stock=blue, Crypto=orange, Long=green, Short=red) */
  activeColorMap?: ActiveColorMap;
  label?: string;
  error?: boolean;
}

function lightenHex(hex: string, amount = 22): string {
  const n = parseInt(hex.slice(1), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function darkenHex(hex: string, amount = 18): string {
  const n = parseInt(hex.slice(1), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, ((n >> 16) & 0xff) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`;
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function AddTradeToggle({
  options,
  value,
  onChange,
  activeColor,
  activeColorMap,
  label,
  error,
}: AddTradeToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 6, width: 0 });

  const pillColor = (activeColorMap && activeColorMap[value]) || activeColor;
  const pillGradient = `linear-gradient(180deg, ${lightenHex(pillColor)} 0%, ${pillColor} 45%, ${darkenHex(pillColor)} 100%)`;
  const pillGlow = `0 0 17px 5px ${hexToRgba(pillColor, 0.34)}`;
  const pill3DShadow = `2px 2px 4px rgba(0,0,0,0.28), 0 1px 0 ${hexToRgba(darkenHex(pillColor, 12), 0.5)}`;
  const pillBoxShadow = `${pillGlow}, ${pill3DShadow}`;

  const updatePillPosition = () => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx < 0) return;
    const btn = buttonRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPillStyle({
      left: br.left - cr.left + container.scrollLeft,
      width: br.width,
    });
  };

  useLayoutEffect(() => {
    updatePillPosition();
  }, [value, options]);

  useEffect(() => {
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [value, options]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1 text-white">
          {label}
        </label>
      )}
      <div
        ref={containerRef}
        className={`
          add-trade-toggle-track relative flex rounded-full p-0.5 min-h-[40px]
          transition-[outline-color] duration-200
          ${error ? 'ring-1 ring-red-500' : ''}
        `}
        style={{
          backgroundColor: '#202020',
          outline: '2px solid rgba(30, 30, 30, 0.6)',
          outlineOffset: 0,
        }}
      >
        {/* Sliding pill – gradient, glow, 3D outline */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
            background: pillGradient,
            boxShadow: pillBoxShadow,
            border: `1px solid ${hexToRgba(darkenHex(pillColor, 25), 0.35)}`,
          }}
        />
        {options.map((opt, idx) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              onClick={() => onChange(opt.value)}
              className={`
                relative z-10 flex items-center justify-center gap-1.5 flex-1 min-w-0
                py-2 px-3 rounded-full text-xs font-medium
                transition-colors duration-300 ease-out
                active:scale-[0.98]
                ${isActive ? 'text-white' : 'text-[#A0A0A0] hover:text-[#B0B0B0]'}
              `}
            >
              <span
                className="shrink-0 w-1 h-1 rounded-full"
                style={{
                  backgroundColor: isActive ? '#FFFFFF' : '#A0A0A0',
                }}
              />
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
