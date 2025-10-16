import React from 'react';
import { X, Heart, Navigation, Map, User, Mountain, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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

interface RefugeBottomSheetProps {
  refuge: Location;
  isVisible: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (location: Location) => void;
  onViewDetails: (location: Location) => void;
}

const difficultyColors = {
  'fàcil': 'bg-green-100 text-green-800 border-green-200',
  'moderat': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'difícil': 'bg-red-100 text-red-800 border-red-200'
};

const conditionColors = {
  'pobre': 'bg-red-500',
  'normal': 'bg-blue-500', 
  'bé': 'bg-green-500',
  'excel·lent': 'bg-yellow-500'
};

// Simulem condició basada en rating
const getConditionFromRating = (rating?: number): 'pobre' | 'normal' | 'bé' | 'excel·lent' => {
  if (!rating) return 'normal';
  if (rating >= 4.7) return 'excel·lent';
  if (rating >= 4.3) return 'bé';
  if (rating >= 3.8) return 'normal';
  return 'pobre';
};

export function RefugeBottomSheet({ 
  refuge, 
  isVisible, 
  onClose, 
  onToggleFavorite, 
  onNavigate, 
  onViewDetails 
}: RefugeBottomSheetProps) {
  if (!isVisible) return null;

  const condition = getConditionFromRating(refuge.rating);
  const capacity = refuge.capacity || Math.floor((refuge.visitors || 500) / 50);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header amb botó tancar */}
        <div className="flex justify-end px-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Contingut principal */}
        <div className="px-4 pb-6">
          <div className="flex gap-4">
            {/* Imatge */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1717623686260-c4659b7ad508?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHJlZnVnZSUyMHB5cmVuZWVzfGVufDF8fHx8MTc1OTM5NzMyOXww&ixlib=rb-4.1.0&q=80&w=400"
                alt={refuge.name}
                className="w-full h-full object-cover"
              />
              
              {/* Indicador d'estat */}
              <div className={`absolute top-2 left-2 w-3 h-3 rounded-full shadow-md ${conditionColors[condition]}`} />
            </div>
            
            {/* Informació principal */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h3 className="truncate mb-1">{refuge.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {refuge.difficulty && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${difficultyColors[refuge.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                    >
                      {refuge.difficulty}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                    Refugi
                  </Badge>
                </div>
              </div>
              
              {/* Stats compactes */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Mountain className="w-3 h-3" />
                  <span>{refuge.elevation}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{capacity}</span>
                </div>
                {refuge.distance && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{refuge.distance}</span>
                  </div>
                )}
              </div>
              
              {/* Descripció truncada */}
              {refuge.description && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {refuge.description}
                </p>
              )}
            </div>
            
            {/* Botó favorit */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(refuge.id)}
                className="w-10 h-10"
              >
                <Heart className={`w-5 h-5 ${refuge.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </Button>
            </div>
          </div>
          
          {/* Botons d'acció */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onNavigate(refuge)}
              className="flex-1"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navegar
            </Button>
            
            <Button
              onClick={() => onViewDetails(refuge)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              Veure detalls
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}