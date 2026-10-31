import { DefaultRefugeImageService } from '../../../services/DefaultRefugeImageService';

const img = (type?: string | null) => DefaultRefugeImageService.getDefaultImage(type);

describe('DefaultRefugeImageService', () => {
  it('retorna "non gardé" per defecte (sense tipus, buit o desconegut)', () => {
    const nonGardee = img('non gardé');
    expect(img()).toBe(nonGardee);
    expect(img(null)).toBe(nonGardee);
    expect(img('')).toBe(nonGardee);
    expect(img('tipus-inventat')).toBe(nonGardee);
  });

  it('retorna una imatge diferent per a cada tipus suportat', () => {
    const types = [
      'non gardé',
      'cabane ouverte mais ocupee par le berger l ete',
      'fermée',
      'orri',
      'emergence',
    ];
    const images = types.map(img);
    expect(new Set(images).size).toBe(types.length);
  });

  it('ignora accents, majúscules i espais sobrants', () => {
    expect(img('  FERMÉE ')).toBe(img('fermée'));
    expect(img('Non Gardé')).toBe(img('non gardé'));
  });

  it('el servei ja resol els tipus "clé nécessaire" i "gardé" amb la seva pròpia imatge', () => {
    const known = ['non gardé', 'cabane ouverte mais ocupee par le berger l ete', 'fermée', 'orri', 'emergence'].map(img);
    expect(known).not.toContain(img('clé nécessaire'));
    expect(known).not.toContain(img('gardé'));
    expect(img('clé nécessaire')).not.toBe(img('gardé'));
  });
});
