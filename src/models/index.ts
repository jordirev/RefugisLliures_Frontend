
/*******************************  Refuge Model  ***********************************/

export interface Coord {
  long: number;
  lat: number;
}

/**
 * Informació complementària del refugi (comoditats)
 */
export interface InfoComp {
  manque_un_mur: boolean;
  cheminee: boolean;
  poele: boolean;
  couvertures: boolean;
  latrines: boolean;
  bois: boolean;
  eau: boolean;
  matelas: boolean;
  couchage: boolean;
  bas_flancs: boolean;
  lits: boolean;
  mezzanine_etage: boolean;
}

/**
 * Metadades d'una imatge associada al refugi
 */
export interface ImageMetadata {
  key: string;
  url: string;
  uploaded_at: string; // ISO date string
  creator_uid: string;
  experience_id?: string | null; // id de l'experiencia a la que pertany la foto
}

export interface Location {
  id: string;
  name: string;
  surname?: string | null;
  coord: Coord;
  altitude?: number | null;
  places?: number | null;
  info_comp?: InfoComp;
  description?: string;
  links?: string[];
  type?: string; // "non gardé", "cabane ouverte mais ocupee par le berger l ete", "fermée", "orri", "emergence"
  modified_at?: string; // ISO date string
  region?: string | null;
  departement?: string | null;
  condition?: number; // 0: pobre, 1: normal, 2: bé, 3: excel·lent
  visitors?: string[] | null;
  images_metadata?: ImageMetadata[];
}

export interface Filters {
  types: string[]; // "non gardé", "cabane ouverte mais ocupee par le berger l ete", "fermée", "orri", "emergence"
  altitude: [number, number];
  places: [number, number];
  condition: number[]; // Array of condition numbers: 0-3 (0: pobre, 1: normal, 2: bé, 3: excel·lent)
}


/*******************************  User Model  ***********************************/


/**
 * Metadades d'un avatar d'usuari
 */
export interface AvatarMetadata {
  key: string;
  url: string;
  uploaded_at: string; // ISO date string
}

export interface User {
  uid: string;
  username: string;
  avatar_metadata?: AvatarMetadata | null;
  language: string;
  favourite_refuges?: string[];
  visited_refuges?: string[];
  uploaded_photos_keys?: string[];
  num_shared_experiences: number | null;
  num_renovated_refuges: number | null;
  created_at: string; // ISO date string
}


/*******************************  Renovation Model  ***********************************/

export interface Renovation {
  id: string
  creator_uid: string
  refuge_id: string
  ini_date: string // ISO date string
  fin_date: string // ISO date string
  description: string
  materials_needed?: string | null
  group_link: string
  participants_uids?: string[] | null
}


/*******************************  Refuge Proposal Model  ***********************************/

export type RefugeProposalAction = 'create' | 'update' | 'delete';
export type RefugeProposalStatus = 'pending' | 'approved' | 'rejected';

export interface RefugeProposal {
  id: string;
  refuge_id: string | null;
  refuge_snapshot: Location | null;
  action: RefugeProposalAction;
  payload: any; // Raw payload map to distinguish between deleted and missing fields
  comment: string | null;
  status: RefugeProposalStatus;
  creator_uid: string;
  created_at: string; // ISO date string
  reviewer_uid: string | null;
  reviewed_at: string | null;
  rejection_reason?: string | null;
}

/*******************************  Refuge Visit Model  ***********************************/

export interface RefugeVisit {
  date: string; // ISO date string
  refuge_id: string;
  total_visitors: number; // total number of visitors that day
  is_visitor: boolean;
  num_visitors: number; // number of visitors in the user's group
}

/*******************************  Refuge Experience Model  ***********************************/

export interface Experience {
  id: string;
  refuge_id: string;
  creator_uid: string;
  modified_at: string; // ISO date string
  comment: string;
  images_metadata?: ImageMetadata[]; // 
}


/*******************************  Refuge Doubt Model  ***********************************/

export interface Doubt {
  id: string;
  refuge_id: string;
  creator_uid: string;
  message: string;
  created_at: string; // ISO date string
  answers_count: number;
  answers?: Answer[];
}

/*******************************  Refuge Answer Model  ***********************************/

export interface Answer {
  id: string;
  creator_uid: string;
  message: string;
  created_at: string; // ISO date string
  parent_answer_id?: string | null;
}