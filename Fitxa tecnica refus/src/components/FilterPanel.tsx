import React from 'react';
import { X, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

export interface Filters {
  types: string[];
  elevation: [number, number];
  difficulty: string[];
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FilterPanel({ isOpen, onClose, filters, onFiltersChange }: FilterPanelProps) {
  const locationTypes = [
    { id: 'refuge', label: 'Refugis', icon: Home },
  ];

  const difficulties = [
    { id: 'fàcil', label: 'Fàcil' },
    { id: 'moderat', label: 'Moderat' },
    { id: 'difícil', label: 'Difícil' },
    { id: 'extrem', label: 'Extrem' },
  ];

  const handleTypeChange = (typeId: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, typeId]
      : filters.types.filter(t => t !== typeId);
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleDifficultyChange = (difficultyId: string, checked: boolean) => {
    const newDifficulties = checked
      ? [...filters.difficulty, difficultyId]
      : filters.difficulty.filter(d => d !== difficultyId);
    
    onFiltersChange({ ...filters, difficulty: newDifficulties });
  };

  const handleElevationChange = (value: number[]) => {
    onFiltersChange({ ...filters, elevation: [value[0], value[1]] });
  };

  const clearFilters = () => {
    onFiltersChange({
      types: [],
      elevation: [0, 5000],
      difficulty: []
    });
  };

  const activeFiltersCount = filters.types.length + filters.difficulty.length + 
    (filters.elevation[0] > 0 || filters.elevation[1] < 5000 ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2>Filtres</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tipos de ubicación */}
        <div className="mb-6">
          <Label className="block mb-3">Tipus d'ubicació</Label>
          <div className="grid grid-cols-1 gap-3">
            {locationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={filters.types.includes(type.id)}
                    onCheckedChange={(checked) => handleTypeChange(type.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={type.id} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Elevación */}
        <div className="mb-6">
          <Label className="block mb-3">
            Elevació: {filters.elevation[0]}m - {filters.elevation[1]}m
          </Label>
          <Slider
            value={filters.elevation}
            onValueChange={handleElevationChange}
            max={5000}
            min={0}
            step={100}
            className="w-full"
          />
        </div>

        {/* Dificultad */}
        <div className="mb-6">
          <Label className="block mb-3">Dificultat</Label>
          <div className="grid grid-cols-2 gap-3">
            {difficulties.map((difficulty) => (
              <div key={difficulty.id} className="flex items-center space-x-2">
                <Checkbox
                  id={difficulty.id}
                  checked={filters.difficulty.includes(difficulty.id)}
                  onCheckedChange={(checked) => handleDifficultyChange(difficulty.id, checked as boolean)}
                />
                <Label htmlFor={difficulty.id} className="cursor-pointer">
                  {difficulty.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex-1"
          >
            Netejar tot
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Aplicar filtres
          </Button>
        </div>
      </div>
    </div>
  );
}