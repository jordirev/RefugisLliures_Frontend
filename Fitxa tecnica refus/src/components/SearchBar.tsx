import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
}

export function SearchBar({ searchQuery, onSearchChange, onOpenFilters }: SearchBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className="relative">
        <div className="relative pr-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Cercar refugis..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-2 py-3 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-xl shadow-lg w-full"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenFilters}
          className="absolute right-0 top-0 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl shadow-lg w-10 h-10"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Botó afegeix */}
      <div className="mt-2">
        <Button
          variant="ghost"
          onClick={() => {/* TODO: Implementar afegir nova ubicació */}}
          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl shadow-lg py-2 px-3 flex items-center gap-2 w-fit"
        >
          <div className="w-5 h-5 border-2 border-gray-400 rounded flex items-center justify-center">
            <span className="text-gray-600 text-xs leading-none">+</span>
          </div>
          <span className="text-sm text-gray-500">afegeix</span>
        </Button>
      </div>
    </div>
  );
}