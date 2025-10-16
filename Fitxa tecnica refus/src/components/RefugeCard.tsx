import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Map, User } from 'lucide-react';

interface RefugeCardProps {
  id: string;
  name: string;
  capacity: number;
  condition: 'pobre' | 'normal' | 'bé' | 'excel·lent';
  imageUrl: string;
  region: string;
  onViewMap?: () => void;
  onViewDetail?: () => void;
}

const conditionColors = {
  'pobre': 'bg-red-500',
  'normal': 'bg-blue-500', 
  'bé': 'bg-green-500',
  'excel·lent': 'bg-yellow-500'
};

export function RefugeCard({ name, capacity, condition, imageUrl, region, onViewMap, onViewDetail }: RefugeCardProps) {
  return (
    <Card 
      className="overflow-hidden bg-white shadow-lg rounded-2xl border-0 max-w-sm mx-auto relative cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onViewDetail}
    >
      {/* Imagen principal - más compacta */}
      <div className="aspect-[5/3] relative overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
        
        {/* Estado en esquina superior derecha */}
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full ${conditionColors[condition]} flex items-center justify-center shadow-lg`}>
          <span className="text-white text-sm capitalize">
            {condition}
          </span>
        </div>
      </div>
      
      {/* Información del refugio - sin separación */}
      <div className="px-3 pb-2 -mt-0.5">
        {/* Nombre del refugio */}
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          {name}
        </h3>
        
        {/* Región y capacidad */}
        <div className="text-gray-600 flex items-center gap-1">
          <span className="text-sm">{region}</span>
          <span className="text-gray-400 text-xs leading-none">•</span>
          <User className="w-3 h-3" />
          <span className="text-sm">{capacity}</span>
        </div>
        
        {/* Botón Veure en el mapa - posicionado absolutamente */}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewMap?.();
          }}
          className="absolute bottom-2 right-2 w-10 h-10 p-0 flex items-center justify-center"
        >
          <Map className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}