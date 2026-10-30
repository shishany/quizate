/** Arabic is the default. Keys must match `en.ts` exactly (checked by dictionaries.test.ts). */
export const ar = {
  meta: { title: 'لوحة الإدارة' },
  home: {
    heading: 'لوحة الإدارة',
    intro: 'هذه نقطة البداية للوحة الإدارة وبوابة الرعاة. تُضاف الأقسام تباعاً.',
    apiStatus: 'حالة الخدمة',
    ok: 'تعمل',
    degraded: 'متعثرة',
    unreachable: 'تعذّر الوصول',
    db: 'قاعدة البيانات',
    redis: 'الذاكرة المؤقتة',
    storage: 'التخزين',
    up: 'تعمل',
    down: 'متوقفة',
    ms: 'ملي ثانية',
  },
  lang: { switchTo: 'English' },
} as const;
