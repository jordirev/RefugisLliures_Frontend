/**
 * MSW Handlers per a mockejar les crides HTTP als serveis
 */
import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

// Mock data per als refugis (format DTO del backend)
export const mockRefugis = [
  {
    id: '1',
    name: 'Refugi de Colomers',
    coord: { long: 0.9858, lat: 42.6531 },
    altitude: 2135,
    places: 16,
    type: 'cabane ouverte mais ocupee par le berger l ete',
    description: 'Un refugi guardado a l\'estiu',
    links: [],
    modified_at: '2024-01-01T00:00:00Z',
    region: 'Val d\'Aran',
    departement: 'Lleida',
  },
  {
    id: '2',
    name: 'Refugi de Ventosa i Calvell',
    coord: { long: 0.8456, lat: 42.5678 },
    altitude: 2220,
    places: 20,
    type: 'cabane ouverte',
    description: 'Un refugi no guardat',
    links: [],
    modified_at: '2024-01-01T00:00:00Z',
    region: 'Pallars Sobirà',
    departement: 'Lleida',
  },
  {
    id: '3',
    name: 'Refugi d\'Amitges',
    coord: { long: 0.9234, lat: 42.5890 },
    altitude: 2380,
    places: 12,
    type: 'orri toue abri en pierre',
    description: 'Un refugi tipus orri',
    links: [],
    modified_at: '2024-01-01T00:00:00Z',
    region: 'Pallars Sobirà',
    departement: 'Lleida',
  },
];

// Mock data per als usuaris
export const mockUser = {
  id: 1,
  uid: 'test-uid-123',
  username: 'Test User',
  email: 'test@example.com',
  language: 'ca',
  visited_refuges: [1, 2],
  num_renovated_refuges: 2,
  renovations: [1, 2],
  num_shared_experiences: 5,
  num_uploaded_photos: 10,
  created_at: '2024-01-01T00:00:00Z',
};

export const handlers = [
  // GET /refuges/ - Obtenir tots els refugis amb filtres opcionals
  http.get(`${API_BASE_URL}/refuges/`, ({ request }) => {
    const url = new URL(request.url);
    const altitudeMin = url.searchParams.get('altitude_min');
    const altitudeMax = url.searchParams.get('altitude_max');
    const placesMin = url.searchParams.get('places_min');
    const placesMax = url.searchParams.get('places_max');
    const type = url.searchParams.get('type');
    const condition = url.searchParams.get('condition');
    const name = url.searchParams.get('name');

    let filtered = [...mockRefugis];

    if (name) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (altitudeMin) {
      filtered = filtered.filter(r => r.altitude >= parseInt(altitudeMin));
    }

    if (altitudeMax) {
      filtered = filtered.filter(r => r.altitude <= parseInt(altitudeMax));
    }

    if (placesMin) {
      filtered = filtered.filter(r => r.places >= parseInt(placesMin));
    }

    if (placesMax) {
      filtered = filtered.filter(r => r.places <= parseInt(placesMax));
    }

    // Type and condition filtering would require mapping logic
    // For now, ignore these filters in tests

    return HttpResponse.json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    });
  }),

  // GET /refuges/:id/ - Obtenir un refugi específic
  http.get(`${API_BASE_URL}/refuges/:id/`, ({ params }) => {
    const { id } = params;
    const refugi = mockRefugis.find(r => r.id === id);

    if (!refugi) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(refugi);
  }),

  // GET /users/me/ - Obtenir l'usuari actual
  http.get(`${API_BASE_URL}/users/me/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(mockUser);
  }),

  // GET /users/uid/:uid/ - Obtenir usuari per UID de Firebase
  http.get(`${API_BASE_URL}/users/uid/:uid/`, ({ params, request }) => {
    const { uid } = params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    if (uid === mockUser.uid) {
      return HttpResponse.json(mockUser);
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // POST /users/ - Crear nou usuari
  http.post(`${API_BASE_URL}/users/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as any;
    
    return HttpResponse.json({
      ...mockUser,
      username: body.username,
      email: body.email,
      language: body.language,
    }, { status: 201 });
  }),

  // PATCH /users/me/ - Actualitzar usuari actual
  http.patch(`${API_BASE_URL}/users/me/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as any;
    
    return HttpResponse.json({
      ...mockUser,
      ...body,
    });
  }),

  // DELETE /users/me/ - Eliminar usuari actual
  http.delete(`${API_BASE_URL}/users/me/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // GET /users/me/favorites/ - Obtenir favorits de l'usuari
  http.get(`${API_BASE_URL}/users/me/favorites/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    // Retornar els refugis que estan als favorits
    const favorites = mockRefugis.filter(r => ['1', '2'].includes(r.id));
    
    return HttpResponse.json({
      count: favorites.length,
      results: favorites,
    });
  }),

  // POST /users/me/favorites/:id/ - Afegir a favorits
  http.post(`${API_BASE_URL}/users/me/favorites/:id/`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // DELETE /users/me/favorites/:id/ - Eliminar de favorits
  http.delete(`${API_BASE_URL}/users/me/favorites/:id/`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
