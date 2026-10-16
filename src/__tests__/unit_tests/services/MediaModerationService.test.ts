/**
 * Tests unitaris de MediaModerationService i UsersService.confirmAge
 */

import { MediaModerationService } from '../../../services/MediaModerationService';
import { UsersService } from '../../../services/UsersService';
import { apiGet, apiPatch, apiPost } from '../../../services/apiClient';
import { mapMediaReportFromDTO } from '../../../services/mappers/MediaModerationMapper';

jest.mock('../../../services/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
  apiClient: jest.fn(),
}));

const BASE = 'https://refugislliures-backend.onrender.com/api';
const res = (status: number, body: any = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe('MediaModerationService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('reportMedia', () => {
    it('POST /api/media/reports/ amb el cos del contracte', async () => {
      (apiPost as jest.Mock).mockResolvedValue(res(201));
      await MediaModerationService.reportMedia({
        refuge_id: 'r1',
        media_key: 'k1',
        reason: 'other',
        details: '  motiu  ',
      });
      expect(apiPost).toHaveBeenCalledWith(`${BASE}/media/reports/`, {
        refuge_id: 'r1',
        media_key: 'k1',
        reason: 'other',
        details: 'motiu',
      });
    });

    it('no envia details buits', async () => {
      (apiPost as jest.Mock).mockResolvedValue(res(201));
      await MediaModerationService.reportMedia({ refuge_id: 'r1', media_key: 'k1', reason: 'my_image', details: '  ' });
      expect((apiPost as jest.Mock).mock.calls[0][1]).toEqual({ refuge_id: 'r1', media_key: 'k1', reason: 'my_image' });
    });

    it.each([
      [403, {}, 'own_media'],
      [403, { error: 'own_media', code: 'own_media', message: 'No pots' }, 'own_media'],
      [409, { error: 'already_reported', code: 'already_reported', message: 'Ja' }, 'already_reported'],
      [403, { error: 'user_blocked' }, 'user_blocked'],
      [409, {}, 'already_reported'],
      [404, {}, 'not_found'],
      [400, {}, 'validation'],
      [500, {}, 'unknown'],
    ])('status %s %o → %s', async (status, body, code) => {
      (apiPost as jest.Mock).mockResolvedValue(res(status, body));
      await expect(
        MediaModerationService.reportMedia({ refuge_id: 'r1', media_key: 'k1', reason: 'hate_speech' })
      ).rejects.toMatchObject({ code, status });
    });
  });

  describe('admin', () => {
    it('GET /api/admin/media-reports/?status=pending (array o paginat)', async () => {
      (apiGet as jest.Mock).mockResolvedValueOnce(res(200, [{ id: '1' }]));
      expect(await MediaModerationService.getMediaReports('pending')).toEqual([{ id: '1' }]);
      expect(apiGet).toHaveBeenCalledWith(`${BASE}/admin/media-reports/?status=pending`);

      (apiGet as jest.Mock).mockResolvedValueOnce(res(200, { count: 1, reports: [{ id: '2' }] }));
      expect(await MediaModerationService.getMediaReports('resolved')).toEqual([{ id: '2' }]);
    });

    it('PATCH /api/admin/media-reports/{id}/ amb action i statement', async () => {
      (apiPatch as jest.Mock).mockResolvedValue(res(200, { id: 'rep-1' }));
      await MediaModerationService.resolveMediaReport('rep-1', { action: 'remove', statement: ' Motiu ' });
      expect(apiPatch).toHaveBeenCalledWith(`${BASE}/admin/media-reports/rep-1/`, {
        action: 'remove',
        statement: 'Motiu',
      });
    });

    it('retorna el report de la resposta {report, resolved_report_ids, ...}', async () => {
      (apiPatch as jest.Mock).mockResolvedValue(
        res(200, { report: { id: 'rep-1', status: 'resolved' }, resolved_report_ids: ['rep-1', 'rep-2'], strikes: 1, user_blocked: false })
      );
      const report = await MediaModerationService.resolveMediaReport('rep-1', { action: 'remove_and_strike', statement: 'x' });
      expect(report).toEqual({ id: 'rep-1', status: 'resolved' });
    });

    it('409 already_resolved conserva el codi', async () => {
      (apiPatch as jest.Mock).mockResolvedValue(res(409, { error: 'already_resolved', code: 'already_resolved', message: 'x' }));
      await expect(
        MediaModerationService.resolveMediaReport('rep-1', { action: 'dismiss', statement: 'x' })
      ).rejects.toMatchObject({ code: 'already_resolved', status: 409 });
    });

    it('rebutja resoldre sense motivació', async () => {
      await expect(
        MediaModerationService.resolveMediaReport('rep-1', { action: 'dismiss', statement: '' })
      ).rejects.toMatchObject({ code: 'validation' });
      expect(apiPatch).not.toHaveBeenCalled();
    });

    it('mapeja la denúncia amb el mitjà (MediaItem)', () => {
      const report = mapMediaReportFromDTO({
        id: '1',
        refuge_id: 'r1',
        media_key: 'k',
        reason: 'my_image',
        status: 'pending',
        creator_uid: 'author',
        action: 'remove',
        media: { key: 'k', url: 'u', thumb_url: 't', uploaded_at: 'd', creator_uid: 'author' },
      });
      expect(report.media_creator_uid).toBe('author');
      expect(report.resolution_action).toBe('remove');
      expect(report.media?.thumb_url).toBe('t');
    });
  });

  describe('moderation notices', () => {
    it('GET /api/users/{uid}/moderation-notices/', async () => {
      (apiGet as jest.Mock).mockResolvedValue(res(200, { notices: [{ id: 'n1', statement: 'x' }] }));
      expect(await MediaModerationService.getModerationNotices('me')).toEqual([{ id: 'n1', statement: 'x' }]);
      expect(apiGet).toHaveBeenCalledWith(`${BASE}/users/me/moderation-notices/`);
    });
  });
});

describe('UsersService (edat)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('confirmAge: PATCH /api/users/{uid}/age-confirmation/ {birth_date}', async () => {
    (apiPatch as jest.Mock).mockResolvedValue(res(200, {}));
    await UsersService.confirmAge('me', '1990-01-02');
    expect(apiPatch).toHaveBeenCalledWith(`${BASE}/users/me/age-confirmation/`, { birth_date: '1990-01-02' });
  });

  it('confirmAge retorna l\'usuari serialitzat (age_confirmed: true)', async () => {
    (apiPatch as jest.Mock).mockResolvedValue(
      res(200, { uid: 'me', username: 'u', language: 'ca', created_at: 'd', age_confirmed: true })
    );
    const user = await UsersService.confirmAge('me', '1990-01-02');
    expect(user?.age_confirmed).toBe(true);
  });

  it('confirmAge: 403 → underage', async () => {
    (apiPatch as jest.Mock).mockResolvedValue(res(403, { error: 'underage' }));
    await expect(UsersService.confirmAge('me', '2015-01-02')).rejects.toMatchObject({ code: 'underage' });
  });

  it('createUser envia birth_date i 403 → underage (llança)', async () => {
    (apiPost as jest.Mock).mockResolvedValue(res(403, { error: 'underage' }));
    await expect(
      UsersService.createUser({ username: 'u', email: 'e@x.com', language: 'ca', birth_date: '2015-01-02' })
    ).rejects.toMatchObject({ code: 'underage' });
    expect((apiPost as jest.Mock).mock.calls[0][1]).toEqual(
      expect.objectContaining({ birth_date: '2015-01-02' })
    );
  });

  it('createUser: altres errors continuen retornant null', async () => {
    (apiPost as jest.Mock).mockResolvedValue(res(500, {}));
    await expect(UsersService.createUser({ username: 'u', email: 'e@x.com', language: 'ca' })).resolves.toBeNull();
  });

  it('el GET d\'usuari exposa age_confirmed', async () => {
    (apiGet as jest.Mock).mockResolvedValue(
      res(200, { uid: 'me', username: 'u', language: 'ca', created_at: 'd', age_confirmed: false })
    );
    const user = await UsersService.getUserByUid('me');
    expect(user?.age_confirmed).toBe(false);
  });
});
