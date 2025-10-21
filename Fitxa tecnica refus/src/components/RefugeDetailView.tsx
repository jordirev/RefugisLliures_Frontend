import React from 'react';
import { ArrowLeft, Heart, Navigation, Share2, MapPin, Users, Mountain } from 'lucide-react';
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
}

interface RefugeDetailViewProps {
  refuge: Location;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (location: Location) => void;
  onShare: (location: Location) => void;
}

const difficultyColors = {
  'fàcil': 'bg-green-100 text-green-800 border-green-200',
  'moderat': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'difícil': 'bg-red-100 text-red-800 border-red-200'
};

export function RefugeDetailView({ 
  refuge, 
  onBack, 
  onToggleFavorite, 
  onNavigate, 
}: RefugeDetailViewProps) {
  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* Header amb imatge */}
      <div className="relative h-80">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1717623686260-c4659b7ad508?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHJlZnVnZSUyMHB5cmVuZWVzfGVufDF8fHx8MTc1OTM5NzMyOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt={refuge.name}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
        
        {/* Botó tornar enrere */}
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Botons d'acció */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onToggleFavorite(refuge.id)}
            className="bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white shadow-lg"
          >
            <Heart className={`w-5 h-5 ${refuge.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          {/* Share removed */}
        </div>
      </div>
      
      {/* Contingut principal */}
      <div className="px-4 py-6 space-y-6">
        {/* Títol i informació bàsica */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{refuge.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {refuge.difficulty && (
                <Badge 
                  variant="outline" 
                  className={difficultyColors[refuge.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800 border-gray-200'}
                >
                  {refuge.difficulty}
                </Badge>
              )}
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                Refugi
              </Badge>
            </div>
          </div>
          
          {/* Stats en grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Mountain className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-sm text-gray-600">Elevació</div>
              <div className="font-semibold text-gray-900">{refuge.elevation}m</div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-sm text-gray-600">Capacitat</div>
              <div className="font-semibold text-gray-900">{refuge.visitors || 'N/A'}</div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-sm text-gray-600">Distància</div>
              <div className="font-semibold text-gray-900">{refuge.distance || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        {/* Descripció */}
        {refuge.description && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Descripció</h3>
            <p className="text-gray-700 leading-relaxed">{refuge.description}</p>
          </div>
        )}
        
        {/* Informació de localització */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Localització</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Latitud: {refuge.lat.toFixed(4)}</span>
              <span>•</span>
              <span>Longitud: {refuge.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
        
        {/* Avaluació i visitants */}
        {(refuge.rating || refuge.visitors) && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Estadístiques</h3>
            <div className="flex gap-4">
              {refuge.rating && (
                <div className="bg-gray-50 rounded-xl p-4 flex-1">
                  <div className="text-sm text-gray-600">Valoració</div>
                  <div className="font-semibold text-gray-900">{refuge.rating}/5</div>
                </div>
              )}
              {refuge.visitors && (
                <div className="bg-gray-50 rounded-xl p-4 flex-1">
                  <div className="text-sm text-gray-600">Visitants anuals</div>
                  <div className="font-semibold text-gray-900">{refuge.visitors}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Botó de navegació fix a la part inferior */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={() => onNavigate(refuge)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
        >
          <Navigation className="w-5 h-5 mr-2" />
          Navegar al refugi
        </Button>
      </div>
    </div>
  );
}