
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
 * Tipus de mitjà (contracte `MediaItem` del backend)
 */
export type MediaType = 'image' | 'video';

/**
 * Metadades d'un mitjà (foto o vídeo) associat al refugi.
 * Forma `MediaItem` del contracte d'API. Els camps nous són opcionals per mantenir
 * compatibilitat amb items antics sense miniatura ni blurhash.
 */
export interface ImageMetadata {
  key: string;
  url: string;
  uploaded_at: string; // ISO date string
  creator_uid: string;
  experience_id?: string | null; // id de l'experiencia a la que pertany la foto
  thumb_url?: string | null; // miniatura WebP (o pòster del vídeo)
  media_type?: MediaType; // si falta, es dedueix per l'extensió de la URL
  width?: number | null;
  height?: number | null;
  blurhash?: string | null;
  taken_at?: string | null; // data de presa (EXIF), desada només a Firestore
}

/** Àlies amb el nom del contracte d'API */
export type MediaItem = ImageMetadata;

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
  /** false si l'usuari encara no ha confirmat l'edat mínima (16 anys); undefined amb backends antics */
  age_confirmed?: boolean;
}

/*******************************  Media moderation Models  ***********************************/

export type MediaReportReason =
  | 'child_sexual_abuse'
  | 'child_endangerment'
  | 'sexual_nonconsensual'
  | 'violence_gore'
  | 'terrorism_extremism'
  | 'hate_speech'
  | 'harassment_bullying'
  | 'animal_cruelty'
  | 'self_harm'
  | 'illegal_goods'
  | 'my_image'
  | 'privacy_personal_data'
  | 'intellectual_property'
  | 'fraud_scam_spam'
  | 'misleading_irrelevant'
  | 'other';

export type MediaReportStatus = 'pending' | 'resolved';
export type MediaReportAction = 'dismiss' | 'remove' | 'remove_and_strike';

/**
 * Denúncia d'un mitjà (vista d'administració)
 */
export interface MediaReport {
  id: string;
  refuge_id: string;
  media_key: string;
  reason: MediaReportReason | string;
  details?: string | null;
  status: MediaReportStatus | string;
  reporter_uid?: string | null;
  media_creator_uid?: string | null;
  priority?: string | null;
  reports_count?: number | null;
  created_at?: string | null;
  resolved_at?: string | null;
  resolution_action?: MediaReportAction | string | null;
  statement?: string | null;
  media?: ImageMetadata | null;
}

/**
 * Avís de moderació a l'usuari (declaració de motius, art. 17 DSA)
 */
export interface ModerationNotice {
  id: string;
  type?: string | null;
  automated?: boolean | null;
  redress?: string | null;
  media_key?: string | null;
  refuge_id?: string | null;
  action?: string | null;
  reason?: string | null;
  statement?: string | null;
  strikes?: number | null;
  created_at?: string | null;
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
  /** Absent si l'usuari no és creador, participant ni admin (o creador esborrat) */
  group_link?: string
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
  condition?: number; // Estat del refugi segons l'usuari (0-3)
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