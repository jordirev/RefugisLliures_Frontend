export interface Coord {
  long: number;
  lat: number;
}

export interface Location {
  id?: number;
  name: string;
  surname?: string | null;
  coord: Coord;
  altitude?: number | null;
  places?: number | null;
  description?: string;
  links?: string[];
  type?: number; // 0: noGuarded, 1: occupiedInSummer, 2: closed, 3: shelter, 4: emergency, 5: unknown
  modified_at?: string; // ISO date string
  region?: string | null;
  departement?: string | null;
  condition?: "pobre" | "normal" | "bé" | "excel·lent";
  imageUrl?: string;
}

export interface Filters {
  types: number[]; // Array of type numbers: 0-5
  altitude: [number, number];
  places: [number, number];
  condition: ("pobre" | "normal" | "bé")[];
}

export interface User {
  uid: string;
  username: string;
  email: string;
  avatar?: string;
  language: string;
  favourite_refuges: number[];
  visited_refuges: number[];
  renovations: string[];
  num_uploaded_photos: number | null;
  num_shared_experiences: number | null;
  num_renovated_refuges: number | null;
  created_at: string; // ISO date string
}
