/**
 * MSW Handlers per a mockejar les crides HTTP als serveis
 */
import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/** Host fictici per a les URL PUT prefirmades de R2 als tests */
export const MOCK_R2_PUT_BASE = 'https://mock-r2.example.com';

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

  // GET /users/:uid/moderation-notices/ - Avisos de moderació de l'usuari (cap per defecte)
  http.get(`${API_BASE_URL}/users/:uid/moderation-notices/`, () => {
    return HttpResponse.json({ notices: [] });
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

  // ---------------------------------------------------------------------------
  // Mitjans (contracte d'API de la feature `images`; vegeu docs/integrations/backend-api.md)
  // ---------------------------------------------------------------------------

  // POST /media/upload-intents/ → una URL PUT prefirmada per fitxer
  http.post(`${API_BASE_URL}/media/upload-intents/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'No autenticat' }, { status: 401 });
    }
    const body = (await request.json()) as any;
    if (!body || body.rights_confirmed !== true || !Array.isArray(body.files) || body.files.length === 0) {
      return HttpResponse.json({ error: 'Dades invàlides', details: { files: ['required'] } }, { status: 400 });
    }
    if (body.files.length > 10) {
      return HttpResponse.json({ error: 'Dades invàlides', details: { files: ['max 10'] } }, { status: 400 });
    }
    if (body.target === 'avatar' && (body.files.length !== 1 || !String(body.files[0].content_type).startsWith('image/'))) {
      return HttpResponse.json({ error: 'Dades invàlides', details: { files: ['avatar: exactament una imatge'] } }, { status: 400 });
    }
    return HttpResponse.json(
      {
        uploads: body.files.map((f: any, i: number) => ({
          upload_id: `upload-${i + 1}`,
          put_url: `${MOCK_R2_PUT_BASE}/quarantine/upload-${i + 1}?X-Amz-Signature=mock`,
          headers: { 'Content-Type': f.content_type },
          expires_in: 600,
        })),
      },
      { status: 201 }
    );
  }),

  // PUT directe a R2 (URL prefirmada): no porta Bearer
  http.put(`${MOCK_R2_PUT_BASE}/quarantine/:uploadId`, ({ request }) => {
    if (request.headers.get('Authorization')) {
      return new HttpResponse(null, { status: 400 });
    }
    return new HttpResponse(null, { status: 200 });
  }),

  // POST /media/upload-intents/confirm/ → MediaItem[] + failed
  http.post(`${API_BASE_URL}/media/upload-intents/confirm/`, async ({ request }) => {
    const body = (await request.json()) as any;
    const ids: string[] = body?.upload_ids || [];
    return HttpResponse.json({
      uploaded: ids.map((id) => ({
        key: `refugis-lliures/1/${id}.webp`,
        url: `https://r2.example.com/refugis-lliures/1/${id}.webp?sig=get`,
        thumb_url: `https://r2.example.com/refugis-lliures/1/${id}_thumb.webp?sig=get`,
        media_type: 'image',
        width: 2048,
        height: 1536,
        blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
        creator_uid: 'test-uid-123',
        uploaded_at: '2026-10-16T10:00:00Z',
        taken_at: null,
        experience_id: null,
      })),
      failed: [],
    });
  }),

  // POST /media/reports/
  http.post(`${API_BASE_URL}/media/reports/`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        id: 'report-1',
        refuge_id: body.refuge_id,
        media_key: body.media_key,
        reason: body.reason,
        details: body.details ?? null,
        status: 'pending',
        priority: 'normal',
        created_at: '2026-10-16T10:00:00Z',
        media_hidden: false,
      },
      { status: 201 }
    );
  }),

  // GET /admin/media-reports/
  http.get(`${API_BASE_URL}/admin/media-reports/`, () => HttpResponse.json({ count: 0, reports: [] })),

  // GET /users/:uid/moderation-notices/
  http.get(`${API_BASE_URL}/users/:uid/moderation-notices/`, () => HttpResponse.json({ notices: [] })),

  // PATCH /users/:uid/age-confirmation/
  http.patch(`${API_BASE_URL}/users/:uid/age-confirmation/`, async ({ params, request }) => {
    const body = (await request.json()) as any;
    if (!body?.birth_date) return HttpResponse.json({ error: 'Dades invàlides', details: { birth_date: ['required'] } }, { status: 400 });
    return HttpResponse.json({ ...mockUser, uid: params.uid, age_confirmed: true });
  }),
];

