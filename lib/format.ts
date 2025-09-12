export const currencyShort = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs/1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs/1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs/1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
};

export const numberShort = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs/1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs/1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs/1e3).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
};

export const pct = (n: number, digits = 1): string => {
  return `${n.toFixed(digits)}%`;
};

export const dateLabel = (dISO: string, locale = 'en-US'): string => {
  const date = new Date(dISO);
  return date.toLocaleDateString(locale, { 
    month: 'short', 
    day: 'numeric' 
  });
};
