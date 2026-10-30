/** Formats halalas (integer, SAR × 100) as SAR without floating-point drift. */
export function halalasToSar(halalas: number): string {
  const sign = halalas < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(halalas));
  const sar = Math.trunc(abs / 100);
  const rest = abs % 100;
  return `${sign}${sar.toLocaleString('en-US')}${rest ? `.${String(rest).padStart(2, '0')}` : ''}`;
}

export function prizePoolHalalas(table: readonly number[]): number {
  return table.reduce((s, x) => s + x, 0);
}
