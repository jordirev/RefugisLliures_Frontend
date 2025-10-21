import React from 'react';
import { TrendingUp, Star, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { LocationCard } from './LocationCard';

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
  rating?: number;
  visitors?: number;
}

interface ExploreViewProps {
  trendingLocations: Location[];
  nearbyLocations: Location[];
  recommendedLocations: Location[];
  onToggleFavorite: (locationId: string) => void;
  onNavigate: (location: Location) => void;
}

export function ExploreView({ 
  trendingLocations, 
  nearbyLocations, 
  recommendedLocations,
  onToggleFavorite,
  onNavigate,
}: ExploreViewProps) {
  const StatCard = ({ icon: Icon, title, value, subtitle }: {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h2>Explorar</h2>
          <p className="text-muted-foreground">
            Descubre nuevos lugares y aventuras
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={MapPin}
            title="Ubicaciones"
            value="1,247"
            subtitle="Total disponibles"
          />
          <StatCard
            icon={Users}
            title="Aventureros"
            value="15.2k"
            subtitle="Comunidad activa"
          />
        </div>

        {/* Trending Locations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3>Trending esta semana</h3>
          </div>
          <div className="space-y-3">
            {trendingLocations.slice(0, 3).map((location) => (
                <LocationCard
                key={location.id}
                location={location}
                onToggleFavorite={onToggleFavorite}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        {/* Nearby Locations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3>Cerca de ti</h3>
          </div>
          <div className="space-y-3">
            {nearbyLocations.slice(0, 3).map((location) => (
                <LocationCard
                key={location.id}
                location={location}
                onToggleFavorite={onToggleFavorite}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        {/* Recommended */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3>Recomendado para ti</h3>
          </div>
          <div className="space-y-3">
            {recommendedLocations.slice(0, 3).map((location) => (
                <LocationCard
                key={location.id}
                location={location}
                onToggleFavorite={onToggleFavorite}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}