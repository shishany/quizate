/**
 * Identity helpers for the sample version (FR-01, FR-04). Production calls Nafath and an IBAN-ownership service
 * behind provider interfaces (architecture rule 12); here both are simulated.
 */

/** National ID (starts with 1) or Iqama (starts with 2): 10 digits. */
export function nationalIdValid(id: string): boolean {
  return /^[12]\d{9}$/.test(id);
}

export const maskNationalId = (id: string) => `${id.slice(0, 1)}•••••••${id.slice(-2)}`;

/** Saudi IBAN: SA + 2 check digits + 20 characters (2-digit bank code + 18 account digits), ISO 13616 mod-97. */
export function ibanValid(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^SA\d{2}\d{2}[0-9A-Z]{18}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

export const normalizeIban = (raw: string) => raw.replace(/\s+/g, '').toUpperCase();
export const maskIban = (raw: string) => {
  const iban = normalizeIban(raw);
  return `${iban.slice(0, 4)} •••• •••• •••• ${iban.slice(-4)}`;
};

/** Builds a valid Saudi IBAN from a bank code and account number (sample filling). */
export function makeIban(bank: string, account: string): string {
  const bban = bank.padStart(2, '0') + account.padStart(18, '0');
  const digits = (bban + 'SA00').replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return `SA${String(98 - rem).padStart(2, '0')}${bban}`;
}

/**
 * The sample Nafath answer: a verified date of birth derived from the ID, and the number the person picks in the
 * Nafath app. IDs ending in 9 simulate a person under 18, so the refusal can be shown.
 */
export function sampleNafath(id: string, now: Date): { birthDate: string; matchNumber: number } {
  const sum = [...id].reduce((s, c) => s + Number(c), 0);
  const age = id.endsWith('9') ? 16 : 20 + (sum % 30);
  const year = now.getUTCFullYear() - age - 1;
  const month = String((sum % 12) + 1).padStart(2, '0');
  const day = String((sum % 27) + 1).padStart(2, '0');
  return { birthDate: `${year}-${month}-${day}`, matchNumber: 10 + ((sum * 7) % 90) };
}
