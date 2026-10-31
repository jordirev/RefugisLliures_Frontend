/**
 * Guarda: els tests d'integració no poden sortir mai a la xarxa real.
 * Amb `setupMSW()` una petició sense handler es bloqueja (error de xarxa simulat) i es registra perquè el
 * test que l'ha provocat falli (`afterEach` de jest.setup.js).
 */
import { setupMSW } from '../setup/mswServer';

setupMSW();

describe('Tests sense xarxa real', () => {
  it('bloqueja i registra una petició a la API sense handler MSW (no arriba al backend)', async () => {
    const blocked: string[] = (global as any).__blockedRequests;
    const url = 'https://refugislliures-backend.onrender.com/api/ruta-sense-handler/';

    await expect(fetch(url)).rejects.toThrow();

    expect(blocked).toContain(`GET ${url}`);
    // Aquest test provoca la petició a propòsit: es neteja el registre perquè no el faci fallar
    blocked.length = 0;
  });

  it('serveix les peticions que sí tenen handler i no les registra com a bloquejades', async () => {
    const response = await fetch('https://refugislliures-backend.onrender.com/api/users/u1/moderation-notices/');

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual({ notices: [] });
    expect((global as any).__blockedRequests).toHaveLength(0);
  });
});
