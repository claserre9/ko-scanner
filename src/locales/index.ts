import { messages as enMessages } from './en';
import { messages as frMessages } from './fr';

export type LocaleMessages = typeof enMessages;

export const locales = {
  en: enMessages,
  fr: frMessages,
};

export type LocaleCode = keyof typeof locales;

/**
 * Get messages for the specified locale
 * @param locale The locale code (e.g., 'en', 'fr')
 * @returns The messages for the specified locale, or English messages if the locale is not supported
 */
export function getMessages(locale: string): LocaleMessages {
  return (locales[locale as LocaleCode] || locales.en);
}

/**
 * Get the current locale from browser settings or localStorage
 * @returns The current locale code
 */
export function getCurrentLocale(): LocaleCode {
  // Try to get locale from localStorage
  const savedLocale = localStorage.getItem('ko-scanner-locale');
  if (savedLocale && locales[savedLocale as LocaleCode]) {
    return savedLocale as LocaleCode;
  }
  
  // Try to get locale from browser
  const browserLocale = navigator.language.split('-')[0];
  if (locales[browserLocale as LocaleCode]) {
    return browserLocale as LocaleCode;
  }
  
  // Default to English
  return 'en';
}

/**
 * Set the current locale
 * @param locale The locale code to set
 */
export function setCurrentLocale(locale: LocaleCode): void {
  localStorage.setItem('ko-scanner-locale', locale);
}