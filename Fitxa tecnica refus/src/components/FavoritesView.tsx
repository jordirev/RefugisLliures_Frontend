import React from 'react';
import { Heart } from 'lucide-react';
import { RefugeCard } from './RefugeCard';
import refugiCinquantenariImg from 'figma:asset/7bb5dcfc259b5c332d27d72447bcf89144cc3704.png';
import cortalOriolImg from 'figma:asset/f3afca70c9a23de06cec6bad26fd115b542b9911.png';
import refugiPerafitaImg from 'figma:asset/f3b639be036bc34c6ae34331625761d8932d9518.png';

interface Location {
  id: string;
  name: string;
  type: 'refuge';
  lat: number;
  lng: number;
  elevation: number;
  difficulty?: string;
  description?: string;
  distance?: string;
  isFavorite?: boolean;
  rating?: number;
  visitors?: number;
}

interface FavoritesViewProps {
  favorites: Location[];
  onToggleFavorite: (locationId: string) => void;
  onNavigate: (location: Location) => void;
  onViewDetail?: (location: Location) => void;
}

const refugeExamples = [
  {
    id: 'refugi-cinquantenari',
    name: 'Refugi del Cinquantenari',
    capacity: 9,
    condition: 'excel·lent' as const,
    imageUrl: refugiCinquantenariImg,
    region: 'Àreu'
  },
  {
    id: 'cortal-oriol',  
    name: 'Cortal de l\'Oriol',
    capacity: 5,
    condition: 'normal' as const,
    imageUrl: cortalOriolImg,
    region: 'Bellver de Cerdanya'
  },
  {
    id: 'refugi-perafita',
    name: 'Refugi de Perafita', 
    capacity: 6,
    condition: 'bé' as const,
    imageUrl: refugiPerafitaImg,
    region: 'Andorra'
  },
  {
    id: 'refugi-colomina',
    name: 'Refugi de Colomina',
    capacity: 12,
    condition: 'bé' as const,
    imageUrl: refugiCinquantenariImg,
    region: 'Àreu'
  },
  {
    id: 'refugi-amitges',
    name: 'Refugi d\'Amitges',
    capacity: 8,
    condition: 'pobre' as const,
    imageUrl: cortalOriolImg,
    region: 'Bellver de Cerdanya'
  },
  {
    id: 'refugi-renclusa',
    name: 'Refugi de la Renclusa',
    capacity: 15,
    condition: 'excel·lent' as const,
    imageUrl: refugiPerafitaImg,
    region: 'Andorra'
  }
];

export function FavoritesView({ favorites, onToggleFavorite, onNavigate, onViewDetail }: FavoritesViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 pb-8">
        <div className="flex items-center gap-2 mb-6 pt-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-gray-900">Els meus favorits</h2>
          <span className="text-sm text-gray-500">({refugeExamples.length})</span>
        </div>
        
        <div className="grid gap-4">
          {refugeExamples.map((refuge) => (
            <RefugeCard
              key={refuge.id}
              id={refuge.id}
              name={refuge.name}
              capacity={refuge.capacity}
              condition={refuge.condition}
              imageUrl={refuge.imageUrl}
              region={refuge.region}
              onViewMap={() => console.log(`Veure ${refuge.name} en el mapa`)}
              onViewDetail={() => onViewDetail && onViewDetail({
                id: refuge.id,
                name: refuge.name,
                type: 'refuge' as const,
                lat: 42.7000,
                lng: 0.5000,
                elevation: 2000,
                difficulty: 'moderat',
                description: `Refugi situat a la zona de ${refuge.region}`,
                distance: '3,5 km',
                rating: 4.5,
                visitors: refuge.capacity * 50
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}