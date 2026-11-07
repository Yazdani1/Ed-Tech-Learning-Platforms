import { describe, expect, it } from 'vitest';

import { datedFileName, toCsv } from '../export-file';

const BOM = String.fromCharCode(0xfeff);

describe('toCsv', () => {
  it('neutralises cells a spreadsheet would run as a formula (= + - @)', () => {
    const csv = toCsv(['Name'], [['=HYPERLINK("x")'], ['+1'], ['-2'], ['@SUM(A1)'], ['Asha']]);
    expect(csv).toBe(`${BOM}Name\r\n"'=HYPERLINK(""x"")"\r\n'+1\r\n'-2\r\n'@SUM(A1)\r\nAsha\r\n`);
  });

  it('quotes commas, quotes and new lines, and leaves empty values empty', () => {
    const csv = toCsv(['A', 'B', 'C'], [['a,b', 'say "hi"', null]]);
    expect(csv).toBe(`${BOM}A,B,C\r\n"a,b","say ""hi""",\r\n`);
  });
});

describe('datedFileName', () => {
  it('adds the day to the name', () => {
    expect(datedFileName('sales', 'csv', new Date('2026-11-07T10:00:00Z'))).toBe(
      'sales-2026-11-07.csv',
    );
  });
});
