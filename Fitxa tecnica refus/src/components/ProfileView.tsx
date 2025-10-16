import React from 'react';
import { User, MapPin, Mountain, Calendar, Award, Camera, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
  capacity?: number;
}

interface VisitedRefuge extends Location {
  visitDate: string;
  stayDuration?: string;
  photos?: number;
  personalRating?: number;
  notes?: string;
}

interface ProfileViewProps {
  onViewRefugeDetail?: (refuge: Location) => void;
}

// Dades simulades de refugis visitats
const visitedRefuges: VisitedRefuge[] = [
  {
    id: '1',
    name: 'Refugi de la Renclusa',
    type: 'refuge',
    lat: 42.6314,
    lng: 0.6564,
    elevation: 2140,
    difficulty: 'moderat',
    description: 'Refugi base per a l\'ascensió a l\'Aneto, el pic més alt dels Pirineus.',
    distance: '3,5 km',
    rating: 4.6,
    visitors: 1200,
    visitDate: '2024-08-15',
    stayDuration: '2 nits',
    photos: 23,
    personalRating: 5,
    notes: 'Ascensió perfecta a l\'Aneto! Temps fantàstic.'
  },
  {
    id: '3',
    name: 'Refugi de Góriz',
    type: 'refuge',
    lat: 42.6739,
    lng: 0.0342,
    elevation: 2200,
    difficulty: 'moderat',
    description: 'Refugi guardat al Parc Nacional d\'Ordesa i Mont Perdut.',
    distance: '4,8 km',
    rating: 4.7,
    visitors: 950,
    visitDate: '2024-07-22',
    stayDuration: '1 nit',
    photos: 18,
    personalRating: 4,
    notes: 'Vistes increïbles al Mont Perdut. Sopar excel·lent.'
  },
  {
    id: '8',
    name: 'Refugi d\'Urriellu',
    type: 'refuge',
    lat: 42.7317,
    lng: -0.0083,
    elevation: 1960,
    difficulty: 'moderat',
    description: 'Refugi lliure a la base del Naranjo de Bulnes als Pics d\'Europa.',
    distance: '5,2 km',
    rating: 4.8,
    visitors: 1400,
    visitDate: '2024-06-10',
    stayDuration: '1 nit',
    photos: 31,
    personalRating: 5,
    notes: 'Impresionant el Naranjo de Bulnes. Escalada memorable.'
  },
  {
    id: '14',
    name: 'Refugi d\'Amitges',
    type: 'refuge',
    lat: 42.5600,
    lng: 0.9800,
    elevation: 2380,
    difficulty: 'difícil',
    description: 'Refugi guardat al costat del llac d\'Amitges, al cor dels Encantats.',
    distance: '5,8 km',
    rating: 4.8,
    visitors: 1200,
    visitDate: '2024-05-28',
    stayDuration: '1 nit',
    photos: 27,
    personalRating: 5,
    notes: 'Els Encantats al capvespre són màgics. Llac cristal·lí.'
  },
  {
    id: '6',
    name: 'Refugi de Wallon',
    type: 'refuge',
    lat: 42.8500,
    lng: -0.1000,
    elevation: 1865,
    difficulty: 'fàcil',
    description: 'Refugi guardat al Parc Nacional dels Pirineus francesos.',
    distance: '2,8 km',
    rating: 4.6,
    visitors: 900,
    visitDate: '2024-04-15',
    stayDuration: '1 nit',
    photos: 12,
    personalRating: 4,
    notes: 'Primera sortida de la temporada. Molt acollidor.'
  }
];

const difficultyColors = {
  'fàcil': 'bg-green-100 text-green-800 border-green-200',
  'moderat': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'difícil': 'bg-red-100 text-red-800 border-red-200'
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getPersonalRatingStars = (rating: number) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

const calculateStats = () => {
  const totalRefuges = visitedRefuges.length;
  const totalNights = visitedRefuges.reduce((acc, refuge) => {
    const nights = parseInt(refuge.stayDuration?.split(' ')[0] || '1');
    return acc + nights;
  }, 0);
  const totalPhotos = visitedRefuges.reduce((acc, refuge) => acc + (refuge.photos || 0), 0);
  const averageElevation = Math.round(visitedRefuges.reduce((acc, refuge) => acc + refuge.elevation, 0) / totalRefuges);
  const maxElevation = Math.max(...visitedRefuges.map(r => r.elevation));
  
  return { totalRefuges, totalNights, totalPhotos, averageElevation, maxElevation };
};

export function ProfileView({ onViewRefugeDetail }: ProfileViewProps) {
  const stats = calculateStats();
  
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 pb-8">
        {/* Header amb perfil d'usuari */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            {/* Background image */}
            <div className="relative h-32 bg-gradient-to-r from-orange-400 to-orange-600">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1602471615287-d733c59b79c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhpa2VyJTIwcHJvZmlsZXxlbnwxfHx8fDE3NTkzOTgwNDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Mountain background"
                className="w-full h-full object-cover opacity-20"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Profile info */}
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-8">
                <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-orange-500 text-white text-xl">JM</AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-2">
                  <h2 className="mb-1">Joan Martínez</h2>
                  <p className="text-sm text-gray-600">Membre des del març 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Estadístiques */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Estadístiques
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{stats.totalRefuges}</div>
                <div className="text-sm text-gray-600">Refugis visitats</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{stats.totalNights}</div>
                <div className="text-sm text-gray-600">Nits als refugis</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{stats.maxElevation}m</div>
                <div className="text-sm text-gray-600">Elevació màxima</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{stats.totalPhotos}</div>
                <div className="text-sm text-gray-600">Fotos fetes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Llista de refugis visitats */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-orange-500" />
            Refugis visitats ({visitedRefuges.length})
          </h3>
          
          {visitedRefuges.map((refuge) => (
            <Card 
              key={refuge.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onViewRefugeDetail?.(refuge)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="mb-1">{refuge.name}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600">{formatDate(refuge.visitDate)}</span>
                      {refuge.stayDuration && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{refuge.stayDuration}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {refuge.difficulty && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${difficultyColors[refuge.difficulty as keyof typeof difficultyColors]}`}
                        >
                          {refuge.difficulty}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {refuge.elevation}m
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {refuge.personalRating && (
                      <div className="text-sm text-orange-500 mb-1">
                        {getPersonalRatingStars(refuge.personalRating)}
                      </div>
                    )}
                    
                    {refuge.photos && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Camera className="w-3 h-3" />
                        <span>{refuge.photos}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {refuge.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <p className="italic">"{refuge.notes}"</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{refuge.distance}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                    Veure detalls →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Badge de primera visita */}
        <Card className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h4 className="text-orange-800 mb-1">Explorador Pirinenc</h4>
            <p className="text-sm text-orange-700">Has visitat refugis a més de 2000m d'altitud</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}