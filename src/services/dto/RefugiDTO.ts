/**
 * DTOs per a les respostes del backend de Refugis Lliures
 */

/**
 * Informació complementària del refugi
 */
export interface InfoCompDTO {
  manque_un_mur: number;
  cheminee: number;
  poele: number;
  couvertures: number;
  latrines: number;
  bois: number;
  eau: number;
  matelas: number;
  couchage: number;
  bas_flancs: number;
  lits: number;
  mezzanine_etage: number;
}

/**
 * Coordenades del refugi
 */
export interface CoordDTO {
  long: number;
  lat: number;
}

/**
 * DTO per a un refugi individual (resposta completa)
 */
export interface RefugiDTO {
  id: string;
  name: string;
  surname?: string | null;
  coord: CoordDTO;
  altitude?: number | null;
  places?: number | null;
  info_comp?: InfoCompDTO;
  description?: string;
  links?: string[];
  type?: string;
  modified_at?: string | null;
  region?: string | null;
  departement?: string | null;
  condition?: string | null;
  images_urls?: string[];
}

/**
 * DTO per a la resposta paginada del backend
 */
export interface RefugisResponseDTO {
  count: number;
  results: RefugiDTO[];
}

/**
 * DTO per a un refugi simplificat (llista bàsica)
 */
export interface RefugiSimpleDTO {
  id: string;
  name: string;
  surname?: string | null;
  coord: CoordDTO;
  geohash: string;
}

/**
 * DTO per a la resposta paginada amb refugis simplificats
 */
export interface RefugisSimpleResponseDTO {
  count: number;
  results: RefugiSimpleDTO[];
}
