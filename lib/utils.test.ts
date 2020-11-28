import { formatNumber } from './utils';

describe('lib/utils', () => {
  it('.formatNumber', () => {
    const tests = [
      { currency: 'USD', number: 10000, expected: '$10,000' },
      { currency: 'USD', number: 10000.5, expected: '$10,000.5' },
      { currency: 'EUR', number: 10000, expected: '€10,000' },
      { currency: 'EUR', number: 900.999, expected: '€901' },
      { currency: 'EUR', number: 900.991, expected: '€900.99' },
      { currency: 'USD', number: 50.11, expected: '$50.11' },
    ];

    for (const test of tests) {
      const result = formatNumber(test.currency, test.number);
      expect(result).toEqual(test.expected);
    }
  });
});
