import { Language, TranslationKeys } from './types';
import { en } from './locales/en';
import { id } from './locales/id';
import { ms } from './locales/ms';
import { th } from './locales/th';
import { tl } from './locales/tl';
import { vi } from './locales/vi';
import { lo } from './locales/lo';
import { my } from './locales/my';
import { km } from './locales/km';
import { ja } from './locales/ja';
import { es } from './locales/es';
import { ru } from './locales/ru';
import { ar } from './locales/ar';
import { ko } from './locales/ko';
import { de } from './locales/de';
import { ptBr } from './locales/pt-br';

const translations: Record<Language, TranslationKeys> = {
  en,
  id,
  ms,
  th,
  tl,
  vi,
  lo,
  my,
  km,
  ja,
  es,
  ru,
  ar,
  ko,
  de,
  'pt-br': ptBr,
};

export const getTranslation = (lang: Language): TranslationKeys => {
  return translations[lang] || translations['en'];
};

export type { Language, TranslationKeys };
