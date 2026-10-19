import * as SecureStore from 'expo-secure-store';

/**
 * Emmagatzematge segur per a la persistència de la sessió de Firebase Auth.
 *
 * Implementa la interfície `ReactNativeAsyncStorage` que espera
 * `getReactNativePersistence`, però desa les dades a Android Keystore (EncryptedSharedPreferences)
 * / iOS Keychain mitjançant `expo-secure-store`, en lloc de text pla (AsyncStorage).
 *
 * Firebase només hi desa tokens (ID token, refresh token) i metadades de l'usuari:
 * mai la contrasenya.
 *
 * Notes:
 * - SecureStore només accepta claus `[A-Za-z0-9._-]`; les claus de Firebase (p.ex.
 *   `firebase:authUser:<apiKey>:[DEFAULT]`) es normalitzen.
 * - L'objecte d'usuari serialitzat pot superar el límit recomanat per valor (~2 KB),
 *   així que es divideix en blocs (`<clau>.0`, `<clau>.1`, ... + `<clau>.n` amb el recompte).
 * - `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`: no es migra a altres dispositius via còpia de seguretat.
 */

const CHUNK_SIZE = 1800;
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const safeKey = (key: string): string =>
  'fbauth.' + encodeURIComponent(key).replace(/[^A-Za-z0-9._-]/g, (c) => '_' + c.charCodeAt(0).toString(16));

const chunkKey = (base: string, index: number): string => `${base}.${index}`;
const countKey = (base: string): string => `${base}.n`;

async function readCount(base: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(countKey(base), OPTIONS);
  const n = raw === null ? 0 : parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key);
    const count = await readCount(base);
    if (count === 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(base, i), OPTIONS);
      // Valor corrupte o incomplet: es tracta com a inexistent (l'usuari haurà de tornar a entrar)
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key);
    const previousCount = await readCount(base);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    if (chunks.length === 0) chunks.push('');

    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(chunkKey(base, i), chunks[i], OPTIONS);
    }
    // El recompte s'escriu al final: una lectura mai veu un valor a mitges
    await SecureStore.setItemAsync(countKey(base), String(chunks.length), OPTIONS);

    // Eliminar blocs sobrants d'un valor anterior més llarg
    for (let i = chunks.length; i < previousCount; i++) {
      await SecureStore.deleteItemAsync(chunkKey(base, i), OPTIONS);
    }
  },

  async removeItem(key: string): Promise<void> {
    const base = safeKey(key);
    const count = await readCount(base);
    await SecureStore.deleteItemAsync(countKey(base), OPTIONS);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(chunkKey(base, i), OPTIONS);
    }
  },
};
