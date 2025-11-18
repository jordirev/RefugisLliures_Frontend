/**
 * Configuració del Mock Service Worker (MSW) per als tests d'integració
 */
import { setupServer } from 'msw/node';
import { handlers } from './mswHandlers';

// Crear el servidor MSW amb els handlers
export const server = setupServer(...handlers);

// Configurar els hooks del servidor
export function setupMSW() {
  // Iniciar el servidor abans de tots els tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  // Reiniciar els handlers després de cada test
  afterEach(() => {
    server.resetHandlers();
  });

  // Tancar el servidor després de tots els tests
  afterAll(() => {
    server.close();
  });
}
