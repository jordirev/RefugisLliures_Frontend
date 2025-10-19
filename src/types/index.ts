export interface Coord {
  long: number;
  lat: number;
}

export interface Location {
  id?: number;
  name: string;
  coord: Coord;
  altitude?: number;
  places?: number;
  description?: string;
  links?: string[];
  type?: string; // e.g. "Fermée"
  modified_at?: string; // ISO date string
  region?: string | null;
  departement?: string | null;
  condition?: "pobre" | "normal" | "bé" | "excel·lent";
}

export interface Filters {
  types: string[];
  altitude: [number, number];
  capacity: [number, number];
  condition: ("pobre" | "normal" | "bé" | "excel·lent")[];
}
