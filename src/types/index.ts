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
  
  // Propietats calculades o addicionals
  isFavorite?: boolean;
  imageUrl?: string;
  distance?: string;
  
  // Compatibilitat amb camps antics (deprecated)
  elevation?: number; // usar altitude en lloc d'elevation
  capacity?: number;  // usar places en lloc de capacity
  difficulty?: string;
}

export interface Filters {
  types: string[];
  altitude: [number, number];
  capacity: [number, number];
  condition: ("pobre" | "normal" | "bé" | "excel·lent")[];
}
