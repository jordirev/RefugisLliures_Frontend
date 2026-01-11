/**
 * DTOs per a les respostes del backend de Refugis Lliures
 */

/**
 * Coordenades del refugi
 */
export interface CoordDTO {
  long: number;
  lat: number;
}

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
 * Metadades d'una imatge associada al refugi
 */
export interface ImageMetadataDTO {
  key: string;
  url: string;
  uploaded_at: string; // ISO date string
  creator_uid: string;
  experience_id?: string | null;
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
  condition?: number | null;
  visitors?: string[];
  images_metadata?: ImageMetadataDTO[];
}

/**
 * DTO per a la creació o actualització d'un refugi
 */
export interface RefugiBodyDTO {
  name: string;
  surname?: string | null;
  coord: CoordDTO;
  altitude?: number | null;
  places?: number | null;
  info_comp?: InfoCompDTO;
  description?: string;
  links?: string[];
  type?: string;
  region?: string | null;
  departement?: string | null;
  condition?: number | null;
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


/**
 * DTO per a la informació bàsica d'un refugi per a usuaris.
 * S'utilitza en la representació de refugis visitats i favorits.
 */
export interface UserRefugiInfoDTO {
  id: string;
  name: string;
  coord?: CoordDTO;
  places?: number | null;
  region?: string | null;
  images_metadata?: ImageMetadataDTO[];
}

/**
 * DTO per a la resposta paginada amb informació bàsica de refugis per a usuaris
 * S'utilitza en la representació de refugis visitats i favorits.
 */
export interface UserRefugiInfoResponseDTO {
  count: number;
  results: UserRefugiInfoDTO[];
}
