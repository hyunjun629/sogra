import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

const saved = localStorage.getItem('ls_lang') || 'ko';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: saved,
    fallbackLng: 'ko',
    interpolation: { escapeValue: false },
  });

export default i18n;
