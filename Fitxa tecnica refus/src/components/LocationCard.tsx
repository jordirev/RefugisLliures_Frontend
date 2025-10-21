import React from 'react';
import { Mountain, Trees, Waves, MapPin, Heart, Navigation } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Location {
  id: string;
  name: string;
  type: 'mountain' | 'forest' | 'lake' | 'trail';
  lat: number;
  lng: number;
  elevation: number;
  difficulty?: string;
  description?: string;
  distance?: string;
  isFavorite?: boolean;
}

interface LocationCardProps {
  location: Location;
  onToggleFavorite: (locationId: string) => void;
  onNavigate: (location: Location) => void;
}

export function LocationCard({ location, onToggleFavorite, onNavigate }: LocationCardProps) {
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'mountain':
        return <Mountain className="w-4 h-4" />;
      case 'forest':
        return <Trees className="w-4 h-4" />;
      case 'lake':
        return <Waves className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mountain':
        return 'Muntanya';
      case 'forest':
        return 'Bosc';
      case 'lake':
        return 'Llac';
      case 'trail':
        return 'Sender';
      case 'refuge':
        return 'Refugi';
      default:
        return type;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-orange-100 text-orange-800';
      case 'extreme':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'moderate':
        return 'Moderado';
      case 'hard':
        return 'Difícil';
      case 'extreme':
        return 'Extremo';
      default:
        return difficulty;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getLocationIcon(location.type)}
            <div>
              <h3 className="text-lg font-medium">{location.name}</h3>
              <p className="text-sm text-muted-foreground">{getTypeLabel(location.type)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(location.id)}
            className="shrink-0"
          >
            <Heart 
              className={`w-4 h-4 ${
                location.isFavorite 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-muted-foreground'
              }`} 
            />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">
            {location.elevation}m
          </Badge>
          {location.difficulty && (
            <Badge className={getDifficultyColor(location.difficulty)}>
              {getDifficultyLabel(location.difficulty)}
            </Badge>
          )}
          {location.distance && (
            <Badge variant="outline">
              {location.distance}
            </Badge>
          )}
        </div>

        {location.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {location.description}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onNavigate(location)}
            className="flex-1 flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Navegar
          </Button>
          {/* Share removed */}
        </div>
      </CardContent>
    </Card>
  );
}