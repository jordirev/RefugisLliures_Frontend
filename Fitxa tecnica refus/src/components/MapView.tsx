import React from 'react';
import { Home, User, Layers } from 'lucide-react';

import { TargetIcon } from './TargetIcon';
import { CompassIcon } from './CompassIcon';
import mapBackground from 'figma:asset/4e0e88ea1cf8036e16b8370eb242ab29b3c89f36.png';

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

interface MapViewProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

export function MapView({ locations, onLocationSelect, selectedLocation }: MapViewProps) {
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'refuge':
        return <Home className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'refuge':
        return 'bg-orange-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Fondo de mapa topográfico */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${mapBackground})`,
        }}
      />
      
      {/* Overlay ligero para mejorar contraste */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Marcadores de ubicaciones */}
      <div className="absolute inset-0">
        {locations.map((location) => (
          <button
            key={location.id}
            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 ${
              selectedLocation?.id === location.id 
                ? 'scale-125 z-20' 
                : 'hover:scale-110 z-10'
            }`}
            style={{
              // Ajuste para coordenadas de los Pirineos centradas en pantalla móvil
              // Rango lat: 42.4°N a 42.9°N, lng: -0.8°E a 2.2°E
              left: `${15 + ((location.lng + 0.8) / 3) * 70}%`,
              top: `${15 + ((42.9 - location.lat) / 0.5) * 70}%`,
            }}
            onClick={() => onLocationSelect(location)}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg ${getTypeColor(location.type)}`}>
              {getLocationIcon(location.type)}
            </div>
            {selectedLocation?.id === location.id && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg p-2 min-w-max z-30">
                <p className="text-sm whitespace-nowrap">{location.name}</p>
                <p className="text-xs text-muted-foreground">{location.elevation}m</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Avatar de usuario y brújula */}


      {/* Controles del mapa - esquina inferior derecha */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-3">
        {/* Brújula */}
        <button 
          className="hover:scale-105 transition-transform"
          onClick={() => {/* TODO: Implementar orientación de brújula */}}
        >
          <CompassIcon />
        </button>
        
        {/* Mi ubicación */}
        <button 
          className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => {/* TODO: Implementar geolocalización */}}
        >
          <TargetIcon className="w-5 h-5" />
        </button>
        
        {/* Cambiar capas del mapa */}
        <button 
          className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => {/* TODO: Implementar cambio de capas */}}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}