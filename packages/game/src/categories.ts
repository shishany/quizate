/**
 * Match categories (Sabbaq change request v3, section 4). The player picks one before starting; Mixed draws from
 * every question category. `bank` lists the question categories each one draws from.
 */
export interface MatchCategory {
  id: 'mixed' | 'history' | 'geography' | 'literature' | 'science' | 'sport';
  name: { ar: string; en: string; ur: string };
  /** Question categories it draws from; null = all (Mixed). */
  bank: readonly string[] | null;
}

export const MATCH_CATEGORIES: readonly MatchCategory[] = [
  { id: 'mixed', name: { ar: 'منوّع', en: 'Mixed', ur: 'متفرق' }, bank: null },
  { id: 'history', name: { ar: 'تاريخ', en: 'History', ur: 'تاریخ' }, bank: ['history'] },
  { id: 'geography', name: { ar: 'جغرافيا', en: 'Geography', ur: 'جغرافیہ' }, bank: ['geography'] },
  { id: 'literature', name: { ar: 'أدب', en: 'Literature', ur: 'ادب' }, bank: ['literature'] },
  { id: 'science', name: { ar: 'علوم', en: 'Science', ur: 'سائنس' }, bank: ['science'] },
  { id: 'sport', name: { ar: 'رياضة', en: 'Sport', ur: 'کھیل' }, bank: ['sports'] },
];

export type MatchCategoryId = MatchCategory['id'];

export function inCategory(questionCategory: string, chosen: MatchCategoryId): boolean {
  const c = MATCH_CATEGORIES.find((x) => x.id === chosen);
  return !c || c.bank === null || c.bank.includes(questionCategory);
}

export function questionsInCategory<Q extends { category: string }>(
  bank: readonly Q[],
  chosen: MatchCategoryId,
): Q[] {
  return bank.filter((q) => inCategory(q.category, chosen));
}
