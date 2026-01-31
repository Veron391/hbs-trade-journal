"use client";

import { useI18n } from '../../context/I18nContext';

export default function LanguageSelector() {
  const { lang, setLang, t } = useI18n();

  // Map language codes to emoji flags - using direct Unicode for better cross-platform support
  const flagEmojis: Record<string, string> = {
    uz: '🇺🇿',
    ru: '🇷🇺',
    en: '🇬🇧',
  };

  // Get current flag emoji
  const currentFlag = flagEmojis[lang] || flagEmojis.en;

  return (
    <div className="flex items-center gap-2 mr-3">
      <div className="relative flex items-center">
        {/* Display emoji flag outside the select with cross-platform font support */}
        <span
          className="absolute left-3 text-base pointer-events-none z-10 select-none flex items-center justify-center"
          style={{
            fontFamily: '"Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", system-ui, sans-serif',
            lineHeight: '1',
            width: '20px',
            height: '20px',
            fontSize: '18px',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
          aria-hidden="true"
          role="img"
        >
          {currentFlag}
        </span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          className="appearance-none bg-[#3f3f3f] text-white text-sm rounded-full border border-white/10 pl-9 pr-8 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#3f3f3f]/40 cursor-pointer"
          style={{
            minWidth: '120px',
            paddingLeft: '36px',
          }}
        >
          <option value="uz">O'zbek</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
        <span
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 select-none"
          aria-hidden="true"
        >
          ▾
        </span>
      </div>
    </div>
  );
}


