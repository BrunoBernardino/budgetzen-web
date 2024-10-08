import { assertEquals } from 'std/assert/equals';
import { dateDiffInDays, formatNumber, SupportedCurrencySymbol, validateEmail } from './utils.ts';

Deno.test('that dateDiffInDays works', () => {
  const tests = [
    {
      input: {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-01-01'),
      },
      expected: 0,
    },
    {
      input: {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-01-02'),
      },
      expected: 1,
    },
    {
      input: {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-02'),
      },
      expected: 335,
    },
  ];

  for (const test of tests) {
    const output = dateDiffInDays(
      test.input.startDate,
      test.input.endDate,
    );
    assertEquals(output, test.expected);
  }
});

Deno.test('that formatNumber works', () => {
  const tests: { currency: SupportedCurrencySymbol; number: number; expected: string }[] = [
    { currency: '$', number: 10000, expected: '$10,000' },
    { currency: '$', number: 10000.5, expected: '$10,000.5' },
    { currency: '€', number: 10000, expected: '€10,000' },
    { currency: '€', number: 900.999, expected: '€901' },
    { currency: '€', number: 900.991, expected: '€900.99' },
    { currency: '$', number: 50.11, expected: '$50.11' },
    { currency: '£', number: 900.999, expected: '£901' },
    { currency: '£', number: 900.991, expected: '£900.99' },
    { currency: '£', number: 50.11, expected: '£50.11' },
  ];

  for (const test of tests) {
    const result = formatNumber(test.currency, test.number);
    assertEquals(result, test.expected);
  }
});

Deno.test('that validateEmail works', () => {
  const tests: { email: string; expected: boolean }[] = [
    { email: 'user@example.com', expected: true },
    { email: 'u@e.c', expected: true },
    { email: 'user@example.', expected: false },
    { email: '@example.com', expected: false },
    { email: 'user@example.', expected: false },
    { email: 'ABC', expected: false },
  ];

  for (const test of tests) {
    const result = validateEmail(test.email);
    assertEquals(result, test.expected);
  }
});
