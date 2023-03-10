const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToBuffer = (base64String: string) => Uint8Array.from(atob(base64String), (char) => char.charCodeAt(0));

export default class Encryption {
  static async getAuthKey(password: string) {
    const keyUtf8 = new TextEncoder().encode(password);
    const keyHash = await crypto.subtle.digest('SHA-256', keyUtf8);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    // @ts-ignore this exists
    const encryptionKey = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM', iv }, false, [
      'encrypt',
      'decrypt',
    ]);

    return encryptionKey;
  }

  static async generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits'],
    );

    const publicKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      keyPair.publicKey,
    );

    const privateKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      keyPair.privateKey,
    );

    return { privateKeyJwk, publicKeyJwk };
  }

  static async encrypt(secretData: string, derivedKey: CryptoKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      new TextEncoder().encode(secretData),
    );

    const encryptedBuffer = new Uint8Array(iv.byteLength + encryptedData.byteLength);
    encryptedBuffer.set(iv, 0);
    encryptedBuffer.set(new Uint8Array(encryptedData), iv.byteLength);

    const base64String = bufferToBase64(encryptedBuffer);

    return base64String;
  }

  static async decrypt(encryptedData: string, derivedKey: CryptoKey) {
    const encryptedBuffer = base64ToBuffer(encryptedData);

    const iv = encryptedBuffer.slice(0, 12);
    const data = encryptedBuffer.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      data,
    );
    return new TextDecoder().decode(decryptedData);
  }

  static async deriveKey(publicKeyJwk: JsonWebKey, privateKeyJwk: JsonWebKey) {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      [],
    );

    const privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits'],
    );

    return crypto.subtle.deriveKey(
      { name: 'ECDH', public: publicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }
}
