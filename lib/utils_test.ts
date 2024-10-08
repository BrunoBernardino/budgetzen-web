import { assertEquals } from 'std/assert/equals';
import { escapeHtml, generateRandomCode, jsonToFormUrlEncoded, splitArrayInChunks } from './utils.ts';

Deno.test('that escapeHtml works', () => {
  const tests = [
    {
      input: '<a href="https://brunobernardino.com">URL</a>',
      expected: '&lt;a href=&quot;https://brunobernardino.com&quot;&gt;URL&lt;/a&gt;',
    },
    {
      input: "\"><img onerror='alert(1)' />",
      expected: '&quot;&gt;&lt;img onerror=&#039;alert(1)&#039; /&gt;',
    },
  ];

  for (const test of tests) {
    const output = escapeHtml(test.input);
    assertEquals(output, test.expected);
  }
});

Deno.test('that generateRandomCode works', () => {
  const tests = [
    {
      length: 6,
    },
    {
      length: 7,
    },
    {
      length: 8,
    },
  ];

  for (const test of tests) {
    const output = generateRandomCode(test.length);
    assertEquals(output.length, test.length);
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

Deno.test('that jsonToFormUrlEncoded works', () => {
  const tests = [
    {
      input: {
        user: {
          id: 'uuid-1',
          role: 'user',
          groups: [
            {
              id: 'uuid-1',
              permissions: ['view_banking', 'edit_banking'],
            },
            {
              id: 'uuid-2',
              permissions: ['view_employees'],
            },
          ],
        },
        permissions: ['view_banking'],
      },
      expected:
        'user[id]=uuid-1&user[role]=user&user[groups][0][id]=uuid-1&user[groups][0][permissions][0]=view_banking&user[groups][0][permissions][1]=edit_banking&user[groups][1][id]=uuid-2&user[groups][1][permissions][0]=view_employees&permissions[0]=view_banking',
    },
    {
      input: {
        user: {
          id: 'uuid-1',
          role: 'user',
          groups: ['all', 'there'],
        },
        permissions: ['view_employees'],
      },
      expected:
        'user[id]=uuid-1&user[role]=user&user[groups][0]=all&user[groups][1]=there&permissions[0]=view_employees',
    },
    {
      input: {
        user: {
          id: 'uuid-1',
          role: 'admin',
          groups: [],
        },
        permissions: ['edit_banking'],
      },
      expected: 'user[id]=uuid-1&user[role]=admin&permissions[0]=edit_banking',
    },
    {
      input: [{ something: 1 }],
      expected: '0[something]=1',
    },
    {
      input: { something: 1 },
      expected: 'something=1',
    },
    {
      input: { something: [1, 2] },
      expected: 'something[0]=1&something[1]=2',
    },
  ];

  for (const test of tests) {
    const output = jsonToFormUrlEncoded(test.input);
    assertEquals(output, test.expected);
  }
});
