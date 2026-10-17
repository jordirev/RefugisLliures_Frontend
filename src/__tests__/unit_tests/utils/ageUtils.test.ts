import { buildBirthDate, computeAge, isUnderMinAge, MIN_AGE } from '../../../utils/ageUtils';

describe('ageUtils', () => {
  const today = new Date(2026, 9, 16); // 16/10/2026

  describe('buildBirthDate', () => {
    it('construeix una data ISO amb zeros a l\'esquerra', () => {
      expect(buildBirthDate('7', '3', '1985', today)).toBe('1985-03-07');
    });

    it.each([
      ['31', '02', '2000'],
      ['00', '01', '2000'],
      ['10', '13', '2000'],
      ['10', '10', '99'],
      ['aa', '10', '2000'],
      ['10', '10', '1899'],
      ['17', '10', '2026'], // futur
    ])('rebutja %s/%s/%s', (d, m, y) => {
      expect(buildBirthDate(d, m, y, today)).toBeNull();
    });

    it('accepta el 29 de febrer d\'un any de traspàs', () => {
      expect(buildBirthDate('29', '02', '2004', today)).toBe('2004-02-29');
    });
  });

  describe('computeAge / isUnderMinAge', () => {
    it('calcula els anys complerts', () => {
      expect(computeAge('2010-10-16', today)).toBe(16);
      expect(computeAge('2010-10-17', today)).toBe(15);
    });

    it('el llindar és 16 anys', () => {
      expect(MIN_AGE).toBe(16);
      expect(isUnderMinAge('2010-10-16', today)).toBe(false);
      expect(isUnderMinAge('2010-10-17', today)).toBe(true);
    });
  });
});
