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
  type?: string; 
  modified_at?: string; // ISO date string
  region?: string | null;
  departement?: string | null;
  condition?: "pobre" | "normal" | "bé" | "excel·lent";
  imageUrl?: string;
}

export interface Filters {
  types: string[];
  altitude: [number, number];
  places: [number, number];
  condition: ("pobre" | "normal" | "bé")[];
}
