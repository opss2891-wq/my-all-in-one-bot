import CryptoJS from 'crypto-js';

// Use the Firebase project ID as a part of the key derivation for some consistency,
// but for true security, this should be a user-provided passphrase.
// For now, we use a constant derived from the environment to provide baseline encryption.
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_SECRET || 'databot-secure-fallback-key';

export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};
