import { PRODUCT } from '@quizate/shared';
import type { Locale } from './types';

export const productName = (locale: Locale) => (locale === 'ar' ? PRODUCT.nameAr : PRODUCT.name);
