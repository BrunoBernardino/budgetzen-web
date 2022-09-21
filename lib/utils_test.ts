import { assertEquals } from 'https://deno.land/std@0.156.0/testing/asserts.ts';
import { escapeHtml, formatNumber, splitArrayInChunks } from './utils.ts';

Deno.test('that escapeHtml works', () => {
  const tests = [
    {
      input: '<a href="https://brunobernardino.com">URL</a>',
      expected: '&lt;a href=&quot;https://brunobernardino.com&quot;&gt;URL&lt;/a&gt;',
    },
    {
      input: '"><img onerror=\'alert(1)\' />',
      expected: '&quot;&gt;&lt;img onerror=&#039;alert(1)&#039; /&gt;',
    },
  ];

  for (const test of tests) {
    const output = escapeHtml(test.input);
    assertEquals(output, test.expected);
  }
});

Deno.test('that formatNumber works', () => {
  const tests = [
    { currency: 'USD', number: 10000, expected: '$10,000' },
    { currency: 'USD', number: 10000.5, expected: '$10,000.5' },
    { currency: 'EUR', number: 10000, expected: '€10,000' },
    { currency: 'EUR', number: 900.999, expected: '€901' },
    { currency: 'EUR', number: 900.991, expected: '€900.99' },
    { currency: 'USD', number: 50.11, expected: '$50.11' },
    { currency: 'GBP', number: 900.999, expected: '£901' },
    { currency: 'GBP', number: 900.991, expected: '£900.99' },
    { currency: 'GBP', number: 50.11, expected: '£50.11' },
  ];

  for (const test of tests) {
    const result = formatNumber(test.currency, test.number);
    assertEquals(result, test.expected);
  }
});

Deno.test('that splitArrayInChunks works', () => {
  const tests = [
    {
      input: {
        array: [
          { number: 1 },
          { number: 2 },
          { number: 3 },
          { number: 4 },
          { number: 5 },
          { number: 6 },
        ],
        chunkLength: 2,
      },
      expected: [
        [{ number: 1 }, { number: 2 }],
        [{ number: 3 }, { number: 4 }],
        [{ number: 5 }, { number: 6 }],
      ],
    },
    {
      input: {
        array: [
          { number: 1 },
          { number: 2 },
          { number: 3 },
          { number: 4 },
          { number: 5 },
        ],
        chunkLength: 2,
      },
      expected: [
        [{ number: 1 }, { number: 2 }],
        [{ number: 3 }, { number: 4 }],
        [{ number: 5 }],
      ],
    },
    {
      input: {
        array: [
          { number: 1 },
          { number: 2 },
          { number: 3 },
          { number: 4 },
          { number: 5 },
          { number: 6 },
        ],
        chunkLength: 3,
      },
      expected: [
        [{ number: 1 }, { number: 2 }, { number: 3 }],
        [{ number: 4 }, { number: 5 }, { number: 6 }],
      ],
    },
  ];

  for (const test of tests) {
    const output = splitArrayInChunks(
      test.input.array,
      test.input.chunkLength,
    );
    assertEquals(output, test.expected);
  }
});
