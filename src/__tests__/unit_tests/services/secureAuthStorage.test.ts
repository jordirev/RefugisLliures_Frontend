import * as SecureStore from 'expo-secure-store';
import { secureAuthStorage } from '../../../services/secureAuthStorage';

describe('secureAuthStorage', () => {
  const key = 'firebase:authUser:API_KEY:[DEFAULT]';

  afterEach(async () => {
    await secureAuthStorage.removeItem(key);
    await secureAuthStorage.removeItem('altra');
  });

  it('retorna null si no hi ha res desat', async () => {
    expect(await secureAuthStorage.getItem(key)).toBeNull();
  });

  it('desa i recupera un valor curt', async () => {
    await secureAuthStorage.setItem(key, '{"a":1}');
    expect(await secureAuthStorage.getItem(key)).toBe('{"a":1}');
  });

  it('usa només claus vàlides per a SecureStore', async () => {
    await secureAuthStorage.setItem(key, 'x');
    const keys = (SecureStore.setItemAsync as jest.Mock).mock.calls.map((c) => c[0]);
    keys.forEach((k: string) => expect(k).toMatch(/^[A-Za-z0-9._-]+$/));
  });

  it('divideix en blocs i recompon valors grans (> 2 KB)', async () => {
    const big = 'ab😀'.repeat(2000);
    await secureAuthStorage.setItem(key, big);
    expect(await secureAuthStorage.getItem(key)).toBe(big);
  });

  it('elimina els blocs sobrants en sobreescriure amb un valor més curt', async () => {
    await secureAuthStorage.setItem(key, 'x'.repeat(5000));
    (SecureStore.deleteItemAsync as jest.Mock).mockClear();
    await secureAuthStorage.setItem(key, 'curt');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    expect(await secureAuthStorage.getItem(key)).toBe('curt');
  });

  it('removeItem esborra el valor i tots els blocs', async () => {
    await secureAuthStorage.setItem(key, 'x'.repeat(5000));
    await secureAuthStorage.removeItem(key);
    expect(await secureAuthStorage.getItem(key)).toBeNull();
  });

  it('retorna null si falta un bloc (dades corruptes)', async () => {
    await secureAuthStorage.setItem(key, 'x'.repeat(5000));
    const firstChunkKey = (SecureStore.setItemAsync as jest.Mock).mock.calls.slice(-5)[0][0];
    await SecureStore.deleteItemAsync(firstChunkKey);
    expect(await secureAuthStorage.getItem(key)).toBeNull();
  });

  it('claus diferents no col·lisionen', async () => {
    await secureAuthStorage.setItem(key, 'A');
    await secureAuthStorage.setItem('altra', 'B');
    expect(await secureAuthStorage.getItem(key)).toBe('A');
    expect(await secureAuthStorage.getItem('altra')).toBe('B');
  });
});
