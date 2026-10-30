/** Arabic is the default locale. Keys must match `en.ts` exactly (checked by i18n.spec.ts). */
export const ar = {
  errors: {
    VALIDATION_FAILED: 'البيانات المرسلة غير صحيحة.',
    UNAUTHENTICATED: 'يجب تسجيل الدخول أولاً.',
    FORBIDDEN: 'ليست لديك صلاحية لهذا الإجراء.',
    NOT_FOUND: 'لم يتم العثور على المطلوب.',
    CONFLICT: 'يتعارض الطلب مع الحالة الحالية.',
    RATE_LIMITED: 'طلبات كثيرة. حاول مرة أخرى بعد قليل.',
    SERVICE_UNAVAILABLE: 'الخدمة غير متاحة مؤقتاً.',
    INTERNAL: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
  },
} as const;
