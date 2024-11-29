import { assertEquals } from 'std/assert/equals';
import { assertNotEquals } from 'std/assert/not-equals';
import { KeyPair } from '/lib/types.ts';
import Encryption from './encryption.ts';

const unencryptedKeyPair =
  '{"publicKeyJwk":{"kty":"EC","alg":"ECDH","crv":"P-256","x":"A_N3HhdTKDX36dTZhOzOCIBN9_PQFJwiu1GbL4QxLVM","y":"C9BrYy6SESiIjjdGVHCKtEmWGpJalvuZPwOb8zf9kYE","key_ops":[],"ext":true},"privateKeyJwk":{"kty":"EC","alg":"ECDH","crv":"P-256","x":"A_N3HhdTKDX36dTZhOzOCIBN9_PQFJwiu1GbL4QxLVM","y":"C9BrYy6SESiIjjdGVHCKtEmWGpJalvuZPwOb8zf9kYE","d":"6RkJyiDALyuciPENlWbS-hYo508M8hZ4g1NZNPJzZaw","key_ops":["deriveKey","deriveBits"],"ext":true}}';

Deno.test('that encryption key derivation and export + import works', async () => {
  const authPassword = 'good';

  const encryptedKeyPair =
    '3IPqt17PuhHHYlUMHzYvBr8LjLsQfkL49hSdMSpQ4hcSxs3s292l8jSzMlqlvVTygla2rfLHtM9fh6SQb2cTZ7+4YgtKGvQ5ackaMcNVVdzBNqDQ6n2WW4klV40OrDyFGEDQ0gBPv3EYd7abfTRouIf8FrM628rHoi44RYxcPEeCfmjwLkW/Na1TC4ivrAneW3D2ZIBjH/YwwigUAI/ZOLi5cFARhrerG7E9cPXm1jYVcebhf6jGmI61l+5BgjzRgnA5oVdVQO2wGksjir9iWhYLtfqq5xhFpbH4KaSzMwSBTMx9sXSJEGOHZ1V9dGQmZD136qmoKqHn3XDIj3NjTOUnT7qV18/W5WZDlfcg3h6UBZUIDVQUIOqntjyT5iUz4eudhfXGNIY2YA8wqIx1akrcmIk4cWELuY1or17vtAEW9Tc0sfJYrOMc+TSR8Kqdbpm/4pxDTqlCyJcrtpCF31Y43NJvI4NQV+udHmDqaR5h9weel8HGz2+/b5MhCtSNr//SeVXVI35ED04BrnUfNecWgs8/lmSqz6CNp/8o1ZaeDyx3xv5lFfqK0AHDZ7lKPmdvBgoZq0vO4AMDPnhEP+7cW6Eg272rpelVW0/h';

  // Used for auth (keypair is stored encrypted by a password-derived key in the user, and the keypair is used to encrypting/decrypting data)
  const goodKey1 = await Encryption.getAuthKey(authPassword);
  const encryptedKeyPair1 = await Encryption.encrypt(unencryptedKeyPair, goodKey1);
  const decryptedKeyPair1 = await Encryption.decrypt(encryptedKeyPair, goodKey1);

  assertEquals(decryptedKeyPair1, unencryptedKeyPair);
  assertNotEquals(encryptedKeyPair1, encryptedKeyPair);

  const goodKey2 = await Encryption.getAuthKey(authPassword);
  const encryptedKeyPair2 = await Encryption.encrypt(unencryptedKeyPair, goodKey2);
  const decryptedKeyPair2 = await Encryption.decrypt(encryptedKeyPair, goodKey2);
  const decryptedKeyPair2WithKey1 = await Encryption.decrypt(encryptedKeyPair, goodKey1);

  assertEquals(decryptedKeyPair2, unencryptedKeyPair);
  assertEquals(decryptedKeyPair2WithKey1, unencryptedKeyPair);
  assertNotEquals(encryptedKeyPair2, encryptedKeyPair);
  assertNotEquals(encryptedKeyPair2, encryptedKeyPair1);
});

Deno.test('that encryption does not throw', async () => {
  const keyPair1 = JSON.parse(unencryptedKeyPair) as KeyPair;
  const keyPair2 = await Encryption.generateKeyPair();
  const derivedKey1 = await Encryption.deriveKey(keyPair1.publicKeyJwk, keyPair1.privateKeyJwk);
  const derivedKey2 = await Encryption.deriveKey(keyPair2.publicKeyJwk, keyPair2.privateKeyJwk);

  const tests = [
    {
      secretData: 'a really good secret',
      key: derivedKey1,
    },
    {
      secretData: 'another really good secret',
      key: derivedKey1,
    },
    {
      secretData: 'a really good secret',
      key: derivedKey2,
    },
    {
      secretData: 'another really good secret',
      key: derivedKey2,
    },
  ];

  for (const test of tests) {
    const output = await Encryption.encrypt(test.secretData, test.key);
    assertNotEquals(output, '');
  }
});

Deno.test('that decryption works', async () => {
  const goodKeyPair = JSON.parse(unencryptedKeyPair) as KeyPair;
  const badKeyPair = await Encryption.generateKeyPair();
  const derivedGoodKey1 = await Encryption.deriveKey(goodKeyPair.publicKeyJwk, goodKeyPair.privateKeyJwk);
  const derivedGoodKey2 = await Encryption.deriveKey(goodKeyPair.publicKeyJwk, goodKeyPair.privateKeyJwk);
  const derivedBadKey = await Encryption.deriveKey(badKeyPair.publicKeyJwk, badKeyPair.privateKeyJwk);

  const encryptedSecretWithGoodKey = 'I4xfvSwZo9Xqh2pzpXOHY83mpgGDt3SBLBaZpQOn0ZOxOnPURFTXGv46uahSmuBm';

  const tests = [
    {
      input: {
        secretData: encryptedSecretWithGoodKey,
        key: derivedGoodKey1,
      },
      expected: 'a really good secret',
    },
    {
      input: {
        secretData: encryptedSecretWithGoodKey,
        key: derivedGoodKey2,
      },
      expected: 'a really good secret',
    },
  ];

  for (const test of tests) {
    const output = await Encryption.decrypt(test.input.secretData, test.input.key);
    assertEquals(output, test.expected);
  }

  // Decrypt with a wrong/bad key
  try {
    await Encryption.decrypt(encryptedSecretWithGoodKey, derivedBadKey);
  } catch (error) {
    assertEquals((error as Error).message, 'Decryption failed');
  }
});
