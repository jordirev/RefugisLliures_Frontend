import {
  MAX_VISIT_MONTHS_AHEAD,
  getTodayMadridDateString,
  getMaxVisitDateString,
  isVisitDateAllowed,
} from '../../../utils/visitLimits';

describe('visitLimits', () => {
  it('el límit és de 12 mesos', () => {
    expect(MAX_VISIT_MONTHS_AHEAD).toBe(12);
  });

  describe('getTodayMadridDateString', () => {
    it('usa la data de Madrid i no la UTC', () => {
      // 23:30 UTC del 10/01 = 00:30 del 11/01 a Madrid (UTC+1)
      expect(getTodayMadridDateString(new Date('2026-01-10T23:30:00Z'))).toBe('2026-01-11');
      expect(getTodayMadridDateString(new Date('2026-01-10T12:00:00Z'))).toBe('2026-01-10');
    });
  });

  describe('getMaxVisitDateString', () => {
    it('dia normal: mateix dia 12 mesos després', () => {
      expect(getMaxVisitDateString(new Date('2026-03-15T12:00:00Z'))).toBe('2027-03-15');
    });

    it('final de mes: ajusta a l\'últim dia del mes destí', () => {
      expect(getMaxVisitDateString(new Date('2026-01-31T12:00:00Z'))).toBe('2027-01-31');
      expect(getMaxVisitDateString(new Date('2027-02-28T12:00:00Z'))).toBe('2028-02-28');
    });

    it('any de traspàs: 29/02 -> 28/02 de l\'any següent', () => {
      expect(getMaxVisitDateString(new Date('2028-02-29T12:00:00Z'))).toBe('2029-02-28');
    });

    it('a partir de 28/02 en un any previ a un traspàs no es passa de dia', () => {
      expect(getMaxVisitDateString(new Date('2027-02-28T12:00:00Z'))).toBe('2028-02-28');
    });

    it('canvi d\'any (desembre)', () => {
      expect(getMaxVisitDateString(new Date('2026-12-31T12:00:00Z'))).toBe('2027-12-31');
    });

    it('usa el dia de Madrid quan difereix d\'UTC', () => {
      // 31/12 23:30 UTC = 01/01 00:30 Madrid
      expect(getMaxVisitDateString(new Date('2026-12-31T23:30:00Z'))).toBe('2028-01-01');
    });
  });

  describe('isVisitDateAllowed', () => {
    const now = new Date('2026-03-15T12:00:00Z');

    it('avui és vàlid', () => {
      expect(isVisitDateAllowed('2026-03-15', now)).toBe(true);
    });

    it('ahir no és vàlid', () => {
      expect(isVisitDateAllowed('2026-03-14', now)).toBe(false);
    });

    it('la data límit és vàlida i el dia següent no', () => {
      expect(isVisitDateAllowed('2027-03-15', now)).toBe(true);
      expect(isVisitDateAllowed('2027-03-16', now)).toBe(false);
    });

    it('límit en traspàs: 28/02 vàlid i 29/02 no (si existeix)', () => {
      const leap = new Date('2028-02-29T12:00:00Z');
      expect(isVisitDateAllowed('2029-02-28', leap)).toBe(true);
      expect(isVisitDateAllowed('2029-03-01', leap)).toBe(false);
    });
  });
});
