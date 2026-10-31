import { DefaultRefugeImageService } from '../../../services/DefaultRefugeImageService';

// En Jest tots els .png són el mateix stub: es prova la tria (clau) i no el fitxer concret.
const key = (type?: string | null) => DefaultRefugeImageService.getImageKey(type);

describe('DefaultRefugeImageService', () => {
  it('retorna "non gardé" per defecte (sense tipus, buit, no textual o desconegut)', () => {
    expect(key()).toBe('nonGardee');
    expect(key(null)).toBe('nonGardee');
    expect(key('')).toBe('nonGardee');
    expect(key(42 as unknown as string)).toBe('nonGardee');
    expect(key('tipus-inventat')).toBe('nonGardee');
  });

  it('tria la imatge corresponent a cada tipus suportat', () => {
    expect(key('non gardé')).toBe('nonGardee');
    expect(key('cabane ouverte mais ocupee par le berger l ete')).toBe('cabaneOuverteBerger');
    expect(key('fermée')).toBe('fermee');
    expect(key('orri')).toBe('orri');
    expect(key('emergence')).toBe('emergence');
  });

  it('ignora accents, majúscules i espais sobrants', () => {
    expect(key('  FERMÉE ')).toBe('fermee');
    expect(key('Non Gardé')).toBe('nonGardee');
  });

  it('el servei ja resol "clé nécessaire" i "gardé" (cap pantalla els passa encara)', () => {
    expect(key('clé nécessaire')).toBe('cleNecessaire');
    expect(key('gardé')).toBe('gardee');
  });

  it('getDefaultImage retorna un recurs d\'imatge', () => {
    expect(DefaultRefugeImageService.getDefaultImage('orri')).toBeTruthy();
  });
});
