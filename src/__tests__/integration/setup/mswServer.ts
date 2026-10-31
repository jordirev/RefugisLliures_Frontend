/**
 * Configuració del Mock Service Worker (MSW) per als tests d'integració
 */
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from './mswHandlers';

// Crear el servidor MSW amb els handlers
// El darrer handler (comodí) atrapa tot el que cap handler anterior gestiona: es bloqueja (error de xarxa
// simulat, mai surt a la xarxa real) i es registra perquè el test falli (vegeu l'`afterEach` de jest.setup.js).
// Nota: `onUnhandledRequest: 'error'` de msw 3 no atura la petició en aquest entorn, per això cal aquest handler.
const blockUnhandled = http.all('*', ({ request }) => {
  const list: string[] = ((global as any).__blockedRequests ??= []);
  list.push(`${request.method} ${request.url}`);
  return HttpResponse.error();
});

export const server = setupServer(...handlers, blockUnhandled);

// Configurar els hooks del servidor
export function setupMSW() {
  // Iniciar el servidor abans de tots els tests
  beforeAll(() => {
    // Les peticions sense handler fallen (mai surten a la xarxa real); el bloqueig global de jest.setup.js
    // sap així que MSW ja s'ocupa de les peticions
    (global as any).__mswActive = true;
    server.listen({ onUnhandledRequest: 'error' });
  });

  // Reiniciar els handlers després de cada test
  afterEach(() => {
    server.resetHandlers();
  });

  // Tancar el servidor després de tots els tests
  afterAll(() => {
    server.close();
    (global as any).__mswActive = false;
  });
}
