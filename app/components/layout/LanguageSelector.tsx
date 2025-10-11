"use client";

import { useI18n } from '../../context/I18nContext';

export default function LanguageSelector() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex items-center gap-2 mr-3">
      <span className="text-sm text-[#BFC7D5]">{t('language')}:</span>
      <div className="relative">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          className="appearance-none bg-[#18221A] text-white text-sm rounded-full border border-white/10 px-4 py-2 pr-8 shadow-inner focus:outline-none focus:ring-2 focus:ring-green-600/40"
        >
          <option value="uz">🇺🇿 O'zbek</option>
          <option value="ru">🇷🇺 Русский</option>
          <option value="en">🇬🇧 English</option>
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">▾</span>
      </div>
    </div>
  );
}


