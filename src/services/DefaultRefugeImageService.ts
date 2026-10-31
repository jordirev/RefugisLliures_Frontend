import type { ImageSourcePropType } from 'react-native';

/**
 * Imatge per defecte d'un refugi quan no té cap foto pròpia (RGPD: recursos locals, cap petició a tercers).
 * Tota la tria per tipus viu aquí: les pantalles només criden `getDefaultImage(type)`.
 */

const IMAGES = {
  nonGardee: require('../assets/images/refuges-default/non-gardee.png'),
  cabaneOuverteBerger: require('../assets/images/refuges-default/cabane-ouverte-berger.png'),
  fermee: require('../assets/images/refuges-default/fermee.png'),
  orri: require('../assets/images/refuges-default/orri.png'),
  emergence: require('../assets/images/refuges-default/emergence.png'),
  cleNecessaire: require('../assets/images/refuges-default/cle-necessaire.png'),
  gardee: require('../assets/images/refuges-default/gardee.png'),
} as const;

/** Clau normalitzada (minúscules, sense accents ni espais sobrants) del tipus → imatge. */
const IMAGE_BY_TYPE: Record<string, ImageSourcePropType> = {
  'non garde': IMAGES.nonGardee,
  'cabane ouverte mais ocupee par le berger l ete': IMAGES.cabaneOuverteBerger,
  'fermee': IMAGES.fermee,
  'orri': IMAGES.orri,
  'emergence': IMAGES.emergence,
  // Tipus encara no suportats a l'app: la imatge ja està llesta, però cap pantalla els passa de moment.
  'cle necessaire': IMAGES.cleNecessaire,
  'garde': IMAGES.gardee,
};

const DEFAULT_IMAGE = IMAGES.nonGardee;

const normalizeType = (type: string): string =>
  type
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export class DefaultRefugeImageService {
  /**
   * Imatge per defecte per al tipus de refugi donat. Si el tipus és absent o desconegut,
   * retorna la de "non gardé".
   */
  static getDefaultImage(type?: string | null): ImageSourcePropType {
    if (!type) return DEFAULT_IMAGE;
    return IMAGE_BY_TYPE[normalizeType(type)] ?? DEFAULT_IMAGE;
  }
}
