'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

const LOCALE_COOKIE_KEY = 'locale';

const getLocaleFromCookie = () => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_KEY}=`))
    ?.split('=')[1];
};

export default function LocaleSwitcher() {
  const router = useRouter();
  const nextIntlLocale = useLocale();
  const [currentLocale, setCurrentLocale] = useState<string>(() => {
    return getLocaleFromCookie() ?? nextIntlLocale ?? 'en';
  });

  const switchLocale = (locale: string) => {
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000`; // 1 year
    setCurrentLocale(locale);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLocale === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('ja')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLocale === 'ja'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        JP
      </button>
    </div>
  );
}
