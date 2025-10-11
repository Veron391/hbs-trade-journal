"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

type Lang = 'uz' | 'ru' | 'en';

type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  en: {
    calendar: 'Calendar',
    journal: 'Journal',
    stats: 'Stats',
    macroNews: 'Macro News',
    totalPL: 'Total P/L',
    totalTrades: 'Total Trades',
    trades: 'Trades',
    assetsTraded: 'Assets Traded',
    tradeDetails: 'Trade Details',
    setupNotes: 'Setup Notes',
    mistakesLearnings: 'Mistakes & Learnings',
    tradeLink: 'Trade Link',
    winRate: 'Win Rate',
    customDate: 'Custom Date',
    language: 'Language',
    yourTrades: 'Your Trades',
    addNewTrade: 'Add New Trade',
    emptyTradesHint: 'No trades recorded yet. Add your first trade or import from your trading platform.',
    tradeType: 'Trade Type',
    selectType: 'Select Type',
    direction: 'Direction',
    entryDate: 'Entry Date',
    exitDate: 'Exit Date',
    entryPrice: 'Entry Price',
    exitPrice: 'Exit Price',
    quantity: 'Quantity',
    selectEntryDate: 'Select entry date',
    selectExitDate: 'Select exit date',
    tradingStatistics: 'Trading Statistics',
    performanceCharts: 'Performance Charts',
    detailedStatistics: 'Detailed Statistics',
    noTradesForPeriod: 'No trades found for the selected period.',
    total: 'Total',
    stock: 'Stock',
    crypto: 'Crypto',
    long: 'Long',
    short: 'Short',
  },
  ru: {
    calendar: 'Календарь',
    journal: 'Журнал',
    stats: 'Статистика',
    macroNews: 'Макро новости',
    totalPL: 'Итог P/L',
    totalTrades: 'Всего сделок',
    trades: 'Сделки',
    assetsTraded: 'Торгуемые активы',
    tradeDetails: 'Детали сделки',
    setupNotes: 'Заметки по сетапу',
    mistakesLearnings: 'Ошибки и выводы',
    tradeLink: 'Ссылка на сделку',
    winRate: 'Процент побед',
    customDate: 'Выбор даты',
    language: 'Язык',
    yourTrades: 'Ваши сделки',
    addNewTrade: 'Добавить сделку',
    emptyTradesHint: 'Пока нет записей. Добавьте первую сделку или импортируйте с платформы.',
    tradeType: 'Тип сделки',
    selectType: 'Выберите тип',
    direction: 'Направление',
    entryDate: 'Дата входа',
    exitDate: 'Дата выхода',
    entryPrice: 'Цена входа',
    exitPrice: 'Цена выхода',
    quantity: 'Количество',
    selectEntryDate: 'Выберите дату входа',
    selectExitDate: 'Выберите дату выхода',
    tradingStatistics: 'Торговая статистика',
    performanceCharts: 'Графики производительности',
    detailedStatistics: 'Детальная статистика',
    noTradesForPeriod: 'За выбранный период сделки не найдены.',
    total: 'Всего',
    stock: 'Акции',
    crypto: 'Крипто',
    long: 'Лонг',
    short: 'Шорт',
  },
  uz: {
    calendar: 'Kalendar',
    journal: 'Jurnal',
    stats: 'Statistika',
    macroNews: 'Makro yangiliklar',
    totalPL: 'Umumiy P/L',
    totalTrades: 'Jami bitimlar',
    trades: 'Bitimlar',
    assetsTraded: 'Savdo qilingan aktivlar',
    tradeDetails: 'Bitim tafsilotlari',
    setupNotes: 'Setup izohlar',
    mistakesLearnings: 'Xatolar va xulosalar',
    tradeLink: 'Bitim havolasi',
    winRate: 'G‘alaba foizi',
    customDate: 'Sana tanlash',
    language: 'Til',
    yourTrades: 'Bitimlaringiz',
    addNewTrade: 'Yangi bitim qo‘shish',
    emptyTradesHint: 'Hozircha bitimlar yo‘q. Birinchi bitimni qo‘shing yoki platformadan import qiling.',
    tradeType: 'Bitim turi',
    selectType: 'Turini tanlang',
    direction: 'Yo‘nalish',
    entryDate: 'Kirish sanasi',
    exitDate: 'Chiqish sanasi',
    entryPrice: 'Kirish narxi',
    exitPrice: 'Chiqish narxi',
    quantity: 'Miqdor',
    selectEntryDate: 'Kirish sanasini tanlang',
    selectExitDate: 'Chiqish sanasini tanlang',
    tradingStatistics: 'Savdo statistikasi',
    performanceCharts: 'Natija grafiklari',
    detailedStatistics: 'Batafsil statistika',
    noTradesForPeriod: 'Tanlangan davr uchun bitimlar topilmadi.',
    total: 'Jami',
    stock: 'Aksiya',
    crypto: 'Kripto',
    long: 'Long',
    short: 'Short',
  }
};

interface I18nContextType {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') as Lang | null : null;
    if (saved && ['en','ru','uz'].includes(saved)) setLang(saved);
    // Also read cookie set by middleware if present
    if (typeof document !== 'undefined') {
      const cookie = document.cookie.split('; ').find(v => v.startsWith('lang='));
      const cookieLang = cookie?.split('=')[1] as Lang | undefined;
      if (cookieLang && ['en','ru','uz'].includes(cookieLang)) setLang(cookieLang);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
  }, [lang]);

  const value = useMemo<I18nContextType>(() => ({
    lang,
    setLang,
    t: (key: string) => dictionaries[lang][key] ?? key,
  }), [lang]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


