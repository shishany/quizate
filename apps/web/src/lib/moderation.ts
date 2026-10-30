/** A short banned-words list for display names (FR-01). Production moderation uses a maintained list per language. */
const BANNED = [
  'admin',
  'support',
  'moderator',
  'fuck',
  'shit',
  'bitch',
  'مشرف',
  'الدعم',
  'حمار',
  'غبي',
  'كلب',
  'حقير',
];

export function displayNameValid(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  const lower = trimmed.toLowerCase();
  return !BANNED.some((w) => lower.includes(w));
}

export function ageOn(birthDate: string, now: Date): number {
  const b = new Date(`${birthDate}T00:00:00Z`);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}
