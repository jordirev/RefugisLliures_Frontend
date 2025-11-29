export interface Coord {
  long: number;
  lat: number;
}

export interface Location {
  id: string;
  name: string;
  surname?: string | null;
  coord: Coord;
  altitude?: number | null;
  places?: number | null;
  description?: string;
  links?: string[];
  type?: string; // "non gardé", "cabane ouverte mais ocupee par le berger l ete", "fermée", "orri", "emergence"
  modified_at?: string; // ISO date string
  region?: string | null;
  departement?: string | null;
  condition?: number; // 0: pobre, 1: normal, 2: bé, 3: excel·lent
  imageUrl?: string;
  visitors?: string[] | null;
}

export interface Filters {
  types: string[]; // "non gardé", "cabane ouverte mais ocupee par le berger l ete", "fermée", "orri", "emergence"
  altitude: [number, number];
  places: [number, number];
  condition: number[]; // Array of condition numbers: 0-3 (0: pobre, 1: normal, 2: bé, 3: excel·lent)
}

export interface User {
  uid: string;
  username: string;
  email: string;
  avatar?: string;
  language: string;
  favourite_refuges?: string[];
  visited_refuges?: string[];
  num_uploaded_photos: number | null;
  num_shared_experiences: number | null;
  num_renovated_refuges: number | null;
  created_at: string; // ISO date string
}

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
