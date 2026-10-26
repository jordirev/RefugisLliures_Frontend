/**
 * Tests unitaris del contracte nou de visites, reformes i dubtes:
 * - 403 `user_blocked` / `age_not_confirmed` a les escriptures (ApiError.code)
 * - 403 `not_owner` en esborrar dubtes i respostes
 * - Renovations: 404 de refugi, `active_only`, `group_link` opcional, expulsat
 * - Visites: data YYYY-MM-DD i màxim de visitants
 * - Helpers: buildApiError i getContentErrorMessage
 */

import { RefugeVisitService, MAX_NUM_VISITORS } from '../../../services/RefugeVisitService';
import { RenovationService } from '../../../services/RenovationService';
import { DoubtsService } from '../../../services/DoubtsService';
import { buildApiError } from '../../../services/apiErrors';
import { getContentErrorMessage } from '../../../utils/apiErrorMessage';
import { mapRenovationFromDTO } from '../../../services/mappers/RenovationMapper';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

const respond = (status: number, body: any) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: String(status),
  json: jest.fn().mockResolvedValue(body),
});

const forbidden = (code: string) => respond(403, { error: code, code, message: `msg ${code}` });

describe('Contracte visites / reformes / dubtes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('buildApiError', () => {
    it('llegeix el code i el message del cos', async () => {
      const err = await buildApiError(forbidden('user_blocked') as any, 'fallback', {
        knownCodes: ['user_blocked', 'age_not_confirmed'],
      });
      expect(err.code).toBe('user_blocked');
      expect(err.status).toBe(403);
      expect(err.message).toBe('msg user_blocked');
    });

    it('usa el codi per defecte si el cos no en porta cap de conegut', async () => {
      const err = await buildApiError(respond(403, { error: 'x' }) as any, 'fallback', {
        knownCodes: ['user_blocked'],
        defaultCode: 'expelled',
      });
      expect(err.code).toBe('expelled');
      expect(err.message).toBe('x');
    });

    it('no falla si el cos no és JSON', async () => {
      const response = { ok: false, status: 403, json: jest.fn().mockRejectedValue(new Error('no json')) };
      const err = await buildApiError(response as any, 'fallback', { defaultCode: 'forbidden' });
      expect(err.code).toBe('forbidden');
      expect(err.message).toBe('fallback');
    });
  });

  describe('getContentErrorMessage', () => {
    const t = (key: string) => key;

    it.each([
      ['user_blocked', 'contentErrors.userBlocked'],
      ['age_not_confirmed', 'contentErrors.ageNotConfirmed'],
      ['not_owner', 'contentErrors.notOwner'],
      ['expelled', 'contentErrors.expelled'],
    ])('tradueix el codi %s', (code, key) => {
      const result = getContentErrorMessage({ code, message: 'text del backend' }, t, 'fallback.key');
      expect(result.message).toBe(key);
      expect(result.title).toBe('contentErrors.notAllowedTitle');
    });

    it('decideix pel codi i no pel text del missatge', () => {
      const result = getContentErrorMessage({ code: 'unknown', message: 'user_blocked' }, t, 'fallback.key');
      expect(result.message).toBe('user_blocked'); // missatge del servei, no la traducció
      expect(result.title).toBe('common.error');
    });

    it('usa claus addicionals i el fallback', () => {
      expect(getContentErrorMessage({ code: 'not_found' }, t, 'f', { not_found: 'x.notFound' }).message).toBe(
        'x.notFound'
      );
      expect(getContentErrorMessage({}, t, 'fallback.key').message).toBe('fallback.key');
    });
  });

  describe('Visites', () => {
    it('createRefugeVisit llança ApiError amb code user_blocked', async () => {
      (apiPost as jest.Mock).mockResolvedValue(forbidden('user_blocked'));
      await expect(
        RefugeVisitService.createRefugeVisit('r1', '2030-01-10', { num_visitors: 2 })
      ).rejects.toMatchObject({ code: 'user_blocked', status: 403 });
    });

    it('updateRefugeVisit llança ApiError amb code age_not_confirmed', async () => {
      (apiPatch as jest.Mock).mockResolvedValue(forbidden('age_not_confirmed'));
      await expect(
        RefugeVisitService.updateRefugeVisit('r1', '2030-01-10', { num_visitors: 2 })
      ).rejects.toMatchObject({ code: 'age_not_confirmed', status: 403 });
    });

    it('deleteRefugeVisit no tracta cap codi de contingut', async () => {
      (apiDelete as jest.Mock).mockResolvedValue(respond(200, { message: 'ok' }));
      await expect(RefugeVisitService.deleteRefugeVisit('r1', '2030-01-10')).resolves.toBe(true);
    });

    it('rebutja dates que no són YYYY-MM-DD sense fer cap petició', async () => {
      await expect(RefugeVisitService.createRefugeVisit('r1', '2030-1-10', { num_visitors: 2 })).rejects.toThrow(
        'YYYY-MM-DD'
      );
      await expect(RefugeVisitService.updateRefugeVisit('r1', '10/01/2030', { num_visitors: 2 })).rejects.toThrow(
        'YYYY-MM-DD'
      );
      expect(apiPost).not.toHaveBeenCalled();
      expect(apiPatch).not.toHaveBeenCalled();
    });

    it('el màxim de visitants és 100', () => {
      expect(MAX_NUM_VISITORS).toBe(100);
    });
  });

  describe('Renovations', () => {
    const request = {
      refuge_id: 'r1',
      ini_date: '2030-01-10',
      fin_date: '2030-01-10',
      description: "Reforma d'un sol dia",
      group_link: 'https://chat.whatsapp.com/abc',
    };

    it('createRenovation llança ApiError amb code user_blocked / age_not_confirmed', async () => {
      (apiPost as jest.Mock).mockResolvedValueOnce(forbidden('user_blocked'));
      await expect(RenovationService.createRenovation(request)).rejects.toMatchObject({ code: 'user_blocked' });
      (apiPost as jest.Mock).mockResolvedValueOnce(forbidden('age_not_confirmed'));
      await expect(RenovationService.createRenovation(request)).rejects.toMatchObject({
        code: 'age_not_confirmed',
      });
    });

    it('createRenovation amb refugi inexistent llança not_found', async () => {
      (apiPost as jest.Mock).mockResolvedValue(respond(404, { error: 'Refugi no trobat' }));
      await expect(RenovationService.createRenovation(request)).rejects.toMatchObject({
        code: 'not_found',
        status: 404,
      });
    });

    it('updateRenovation distingeix user_blocked de not_owner', async () => {
      (apiPatch as jest.Mock).mockResolvedValueOnce(forbidden('user_blocked'));
      await expect(RenovationService.updateRenovation('x', { description: 'a' })).rejects.toMatchObject({
        code: 'user_blocked',
      });
      (apiPatch as jest.Mock).mockResolvedValueOnce(respond(403, { error: 'no' }));
      await expect(RenovationService.updateRenovation('x', { description: 'a' })).rejects.toMatchObject({
        code: 'not_owner',
      });
    });

    it('joinRenovation: 403 sense codi conegut vol dir expulsat', async () => {
      (apiPost as jest.Mock).mockResolvedValueOnce(respond(403, { error: 'Expulsat', message: 'Expulsat' }));
      await expect(RenovationService.joinRenovation('x')).rejects.toMatchObject({ code: 'expelled', status: 403 });
      (apiPost as jest.Mock).mockResolvedValueOnce(forbidden('user_blocked'));
      await expect(RenovationService.joinRenovation('x')).rejects.toMatchObject({ code: 'user_blocked' });
      (apiPost as jest.Mock).mockResolvedValueOnce(forbidden('age_not_confirmed'));
      await expect(RenovationService.joinRenovation('x')).rejects.toMatchObject({ code: 'age_not_confirmed' });
    });

    it('getRenovationsByRefugeId: per defecte sense filtre i 404 llança not_found', async () => {
      (apiGet as jest.Mock).mockResolvedValueOnce(respond(200, []));
      await RenovationService.getRenovationsByRefugeId('r1');
      expect((apiGet as jest.Mock).mock.calls[0][0]).toMatch(/\/refuges\/r1\/renovations\/$/);

      (apiGet as jest.Mock).mockResolvedValueOnce(respond(404, { error: 'Refugi no trobat' }));
      await expect(RenovationService.getRenovationsByRefugeId('nope')).rejects.toMatchObject({ code: 'not_found' });
    });

    it('getRenovationsByRefugeId amb activeOnly envia active_only=true', async () => {
      (apiGet as jest.Mock).mockResolvedValue(respond(200, []));
      await RenovationService.getRenovationsByRefugeId('r1', { activeOnly: true });
      expect((apiGet as jest.Mock).mock.calls[0][0]).toMatch(/\/refuges\/r1\/renovations\/\?active_only=true$/);
    });

    it('el mapper accepta group_link absent i no retorna expelled_uids', () => {
      const model = mapRenovationFromDTO({
        id: '1',
        creator_uid: 'unknown',
        refuge_id: 'r1',
        ini_date: '2020-01-01',
        fin_date: '2020-01-01',
        description: 'd',
        expelled_uids: ['u'],
      } as any);
      expect(model.group_link).toBeUndefined();
      expect(model).not.toHaveProperty('expelled_uids');
    });
  });

  describe('Dubtes', () => {
    it('createDoubt / createAnswer / createAnswerReply llancen ApiError amb el codi', async () => {
      (apiPost as jest.Mock).mockResolvedValue(forbidden('age_not_confirmed'));
      await expect(DoubtsService.createDoubt({ refuge_id: 'r', message: 'm' })).rejects.toMatchObject({
        code: 'age_not_confirmed',
      });
      await expect(DoubtsService.createAnswer('d', { message: 'm' })).rejects.toMatchObject({
        code: 'age_not_confirmed',
      });
      (apiPost as jest.Mock).mockResolvedValue(forbidden('user_blocked'));
      await expect(DoubtsService.createAnswerReply('d', 'a', { message: 'm' })).rejects.toMatchObject({
        code: 'user_blocked',
      });
    });

    it("deleteDoubt / deleteAnswer d'un altre usuari llancen not_owner", async () => {
      (apiDelete as jest.Mock).mockResolvedValue(
        respond(403, { error: 'not_owner', code: 'not_owner', message: 'No ets el creador' })
      );
      await expect(DoubtsService.deleteDoubt('d')).rejects.toMatchObject({ code: 'not_owner', status: 403 });
      await expect(DoubtsService.deleteAnswer('d', 'a')).rejects.toMatchObject({ code: 'not_owner', status: 403 });
    });

    it('codifica refuge_id a la query', async () => {
      (apiGet as jest.Mock).mockResolvedValue(respond(200, []));
      await DoubtsService.getDoubtsByRefuge('a b&c');
      expect((apiGet as jest.Mock).mock.calls[0][0]).toMatch(/refuge_id=a%20b%26c$/);
    });
  });
});
