import { expect, test } from 'vitest';
import { ageOn } from './moderation';
import {
  ibanValid,
  makeIban,
  maskIban,
  maskNationalId,
  nationalIdValid,
  sampleNafath,
} from './identity';

test('FR-01: national ID (1…) or Iqama (2…), 10 digits', () => {
  expect(nationalIdValid('1012345678')).toBe(true);
  expect(nationalIdValid('2012345678')).toBe(true);
  expect(nationalIdValid('3012345678')).toBe(false);
  expect(nationalIdValid('101234567')).toBe(false);
  expect(maskNationalId('1012345678')).toBe('1•••••••78');
});

test('FR-01: the sample refuses under-18 IDs (ending in 9) and accepts adults', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  expect(ageOn(sampleNafath('1012345679', now).birthDate, now)).toBeLessThan(18);
  expect(ageOn(sampleNafath('1012345678', now).birthDate, now)).toBeGreaterThanOrEqual(18);
});

test('FR-04: Saudi IBAN format and mod-97 check digits', () => {
  const iban = makeIban('80', '608010167519');
  expect(iban).toMatch(/^SA\d{22}$/);
  expect(ibanValid(iban)).toBe(true);
  expect(ibanValid(iban.replace(/.$/, (d) => String((Number(d) + 1) % 10)))).toBe(false);
  expect(ibanValid('GB82WEST12345698765432')).toBe(false);
  expect(maskIban(iban)).toMatch(/^SA\d{2} •••• •••• •••• \d{4}$/);
});
