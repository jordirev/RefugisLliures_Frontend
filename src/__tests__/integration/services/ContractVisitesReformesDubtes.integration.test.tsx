/**
 * Test d'integració (MSW) del contracte nou de visites, reformes i dubtes.
 *
 * Es fan servir l'apiClient real (Bearer + fetchWithLog), els serveis i els hooks de
 * React Query contra handlers MSW que reprodueixen les respostes del backend nou:
 * - 403 {error, code, message} amb user_blocked / age_not_confirmed a les escriptures
 * - 403 not_owner en esborrar contingut d'altri
 * - group_link omès, 404 de refugi inexistent, ?active_only=true
 * - esborrar una resposta esborra el subarbre i es refà la consulta del dubte
 */

jest.mock('../../../services/AuthService', () => ({
  AuthService: {
    getAuthToken: jest.fn(() => Promise.resolve('mock-token-123')),
  },
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server, setupMSW } from '../setup/mswServer';
import { RefugeVisitService } from '../../../services/RefugeVisitService';
import { RenovationService } from '../../../services/RenovationService';
import { DoubtsService } from '../../../services/DoubtsService';
import { useDoubts, useDeleteAnswer, useCreateDoubt } from '../../../hooks/useDoubtsQuery';
import { useRenovation, useJoinRenovation } from '../../../hooks/useRenovationsQuery';

setupMSW();

const API = 'https://refugislliures-backend.onrender.com/api';

const err403 = (code: string) =>
  HttpResponse.json({ error: code, code, message: `missatge ${code}` }, { status: 403 });

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('Integració: contracte de visites, reformes i dubtes', () => {
  describe('403 user_blocked / age_not_confirmed a les escriptures', () => {
    it('visites: crear i editar', async () => {
      server.use(
        http.post(`${API}/refuges/r1/visits/2030-01-10/`, () => err403('user_blocked')),
        http.patch(`${API}/refuges/r1/visits/2030-01-10/`, () => err403('age_not_confirmed'))
      );
      await expect(
        RefugeVisitService.createRefugeVisit('r1', '2030-01-10', { num_visitors: 3 })
      ).rejects.toMatchObject({ code: 'user_blocked', status: 403 });
      await expect(
        RefugeVisitService.updateRefugeVisit('r1', '2030-01-10', { num_visitors: 3 })
      ).rejects.toMatchObject({ code: 'age_not_confirmed', status: 403 });
    });

    it('reformes: crear i unir-se (hook)', async () => {
      server.use(
        http.post(`${API}/renovations/`, () => err403('age_not_confirmed')),
        http.post(`${API}/renovations/ren-1/participants/`, () => err403('user_blocked'))
      );
      await expect(
        RenovationService.createRenovation({
          refuge_id: 'r1',
          ini_date: '2030-01-10',
          fin_date: '2030-01-10',
          description: 'Un sol dia',
          group_link: 'https://t.me/grup',
        })
      ).rejects.toMatchObject({ code: 'age_not_confirmed' });

      const { wrapper } = makeWrapper();
      const { result } = await renderHook(() => useJoinRenovation(), { wrapper });
      await act(async () => {
        await expect(result.current.mutateAsync('ren-1')).rejects.toMatchObject({ code: 'user_blocked' });
      });
    });

    it('dubtes: crear dubte (hook), respondre dubte i resposta', async () => {
      server.use(
        http.post(`${API}/doubts/`, () => err403('user_blocked')),
        http.post(`${API}/doubts/d1/answers/`, () => err403('age_not_confirmed')),
        http.post(`${API}/doubts/d1/answers/a1/`, () => err403('age_not_confirmed'))
      );
      const { wrapper } = makeWrapper();
      const { result } = await renderHook(() => useCreateDoubt(), { wrapper });
      await act(async () => {
        await expect(result.current.mutateAsync({ refuge_id: 'r1', message: 'hola' })).rejects.toMatchObject({
          code: 'user_blocked',
        });
      });
      await expect(DoubtsService.createAnswer('d1', { message: 'x' })).rejects.toMatchObject({
        code: 'age_not_confirmed',
      });
      await expect(DoubtsService.createAnswerReply('d1', 'a1', { message: 'x' })).rejects.toMatchObject({
        code: 'age_not_confirmed',
      });
    });
  });

  describe('Reformes', () => {
    it('expulsat: 403 en unir-se, sense cap llista', async () => {
      server.use(
        http.post(`${API}/renovations/ren-1/participants/`, () =>
          HttpResponse.json({ error: 'Expulsat', message: 'Has estat expulsat' }, { status: 403 })
        )
      );
      await expect(RenovationService.joinRenovation('ren-1')).rejects.toMatchObject({
        code: 'expelled',
        status: 403,
      });
    });

    it('group_link omès: el model el deixa undefined', async () => {
      server.use(
        http.get(`${API}/renovations/ren-1/`, () =>
          HttpResponse.json({
            id: 'ren-1',
            creator_uid: 'unknown',
            refuge_id: 'r1',
            ini_date: '2020-01-01',
            fin_date: '2020-01-01',
            description: 'Reforma passada',
            participants_uids: [],
          })
        )
      );
      const { wrapper } = makeWrapper();
      const { result } = await renderHook(() => useRenovation('ren-1'), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.group_link).toBeUndefined();
      expect(result.current.data).not.toHaveProperty('expelled_uids');
    });

    it('refugi inexistent: 404 en crear i en llistar', async () => {
      server.use(
        http.post(`${API}/renovations/`, () => HttpResponse.json({ error: 'Refugi no trobat' }, { status: 404 })),
        http.get(`${API}/refuges/nope/renovations/`, () =>
          HttpResponse.json({ error: 'Refugi no trobat' }, { status: 404 })
        )
      );
      await expect(
        RenovationService.createRenovation({
          refuge_id: 'nope',
          ini_date: '2030-01-10',
          fin_date: '2030-01-11',
          description: 'x',
          group_link: 'https://t.me/grup',
        })
      ).rejects.toMatchObject({ code: 'not_found', status: 404 });
      await expect(RenovationService.getRenovationsByRefugeId('nope')).rejects.toMatchObject({
        code: 'not_found',
      });
    });

    it('active_only: només s\'envia quan es demana', async () => {
      const seen: Array<string | null> = [];
      server.use(
        http.get(`${API}/refuges/r1/renovations/`, ({ request }) => {
          seen.push(new URL(request.url).searchParams.get('active_only'));
          return HttpResponse.json([]);
        })
      );
      await RenovationService.getRenovationsByRefugeId('r1');
      await RenovationService.getRenovationsByRefugeId('r1', { activeOnly: true });
      expect(seen).toEqual([null, 'true']);
    });
  });

  describe('Dubtes', () => {
    it('esborrar un dubte o resposta d\'altri: 403 not_owner', async () => {
      server.use(
        http.delete(`${API}/doubts/d1/`, () =>
          HttpResponse.json({ error: 'not_owner', code: 'not_owner', message: 'No ets el creador' }, { status: 403 })
        ),
        http.delete(`${API}/doubts/d1/answers/a1/`, () =>
          HttpResponse.json({ error: 'not_owner', code: 'not_owner', message: 'No ets el creador' }, { status: 403 })
        )
      );
      await expect(DoubtsService.deleteDoubt('d1')).rejects.toMatchObject({ code: 'not_owner', status: 403 });
      await expect(DoubtsService.deleteAnswer('d1', 'a1')).rejects.toMatchObject({
        code: 'not_owner',
        status: 403,
      });
    });

    it('esborrar una resposta treu el subarbre i refà la consulta', async () => {
      let deleted = false;
      const full = {
        id: 'd1',
        refuge_id: 'r1',
        creator_uid: 'u1',
        message: 'Dubte',
        created_at: '2026-01-01T10:00:00Z',
        answers_count: 4,
        answers: [
          { id: 'a1', creator_uid: 'u2', message: 'arrel', created_at: '2026-01-01T11:00:00Z', parent_answer_id: null },
          { id: 'a2', creator_uid: 'u3', message: 'filla', created_at: '2026-01-01T12:00:00Z', parent_answer_id: 'a1' },
          { id: 'a3', creator_uid: 'u2', message: 'neta', created_at: '2026-01-01T13:00:00Z', parent_answer_id: 'a2' },
          { id: 'a4', creator_uid: 'u4', message: 'altra', created_at: '2026-01-01T14:00:00Z', parent_answer_id: null },
        ],
      };
      let gets = 0;
      server.use(
        http.get(`${API}/doubts/`, () => {
          gets += 1;
          return HttpResponse.json([
            deleted ? { ...full, answers_count: 1, answers: [full.answers[3]] } : full,
          ]);
        }),
        http.delete(`${API}/doubts/d1/answers/a1/`, () => {
          deleted = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { wrapper } = makeWrapper();
      const { result } = await renderHook(
        () => ({ doubts: useDoubts('r1'), del: useDeleteAnswer() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current.doubts.isSuccess).toBe(true));
      expect(result.current.doubts.data?.[0].answers).toHaveLength(4);

      await act(async () => {
        await result.current.del.mutateAsync({ doubtId: 'd1', answerId: 'a1', refugeId: 'r1' });
      });

      await waitFor(() => expect(gets).toBeGreaterThanOrEqual(2));
      await waitFor(() => {
        expect(result.current.doubts.data?.[0].answers.map((a) => a.id)).toEqual(['a4']);
      });
      expect(result.current.doubts.data?.[0].answers_count).toBe(1);
    });

    it('answers ve sempre com a array', async () => {
      server.use(
        http.get(`${API}/doubts/`, () =>
          HttpResponse.json([
            {
              id: 'd9',
              refuge_id: 'r1',
              creator_uid: 'u1',
              message: 'Sense respostes',
              created_at: '2026-01-01T10:00:00Z',
              answers_count: 0,
              answers: [],
            },
          ])
        )
      );
      const { wrapper } = makeWrapper();
      const { result } = await renderHook(() => useDoubts('r1'), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].answers).toEqual([]);
    });
  });
});
