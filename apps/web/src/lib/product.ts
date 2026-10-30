import { PRODUCT } from '@quizate/shared';
import type { Locale } from './types';

export const productName = (locale: Locale) => (locale === 'en' ? PRODUCT.name : PRODUCT.nameAr);
