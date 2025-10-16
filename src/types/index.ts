export interface Location {
  id: string;
  name: string;
  type: 'refuge';
  lat: number;
  lng: number;
  elevation: number;
  difficulty?: 'fàcil' | 'moderat' | 'difícil' | 'extrem';
  description?: string;
  distance?: string;
  isFavorite?: boolean;
  rating?: number;
  visitors?: number;
  capacity?: number;
  region?: string;
  imageUrl?: string;
  condition?: 'pobre' | 'normal' | 'bé' | 'excel·lent';
}

export interface Filters {
  types: string[];
  elevation: [number, number];
  difficulty: string[];
}

export type NavigationTab = 'map' | 'favorites' | 'reforms' | 'profile';
