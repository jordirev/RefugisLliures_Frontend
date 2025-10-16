import React, { useState, useMemo } from 'react';
import { MapView } from './components/MapView';
import { SearchBar } from './components/SearchBar';
import { FilterPanel, Filters } from './components/FilterPanel';
import { BottomNavigation, NavigationTab } from './components/BottomNavigation';
import { FavoritesView } from './components/FavoritesView';
import { ReformsView } from './components/ReformsView';
import { RefugeDetailView } from './components/RefugeDetailView';
import { RefugeBottomSheet } from './components/RefugeBottomSheet';
import { ProfileView } from './components/ProfileView';
import { toast } from "sonner@2.0.3";

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



export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showRefugeDetail, setShowRefugeDetail] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    types: [],
    elevation: [0, 5000],
    difficulty: []
  });

  // Dades simulades - refugis dels Pirineus
  const mockLocations: Location[] = [
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
      visitors: 1200
    },
    {
      id: '2',
      name: 'Refugi de Bayssellance',
      type: 'refuge',
      lat: 42.8167,
      lng: 0.1667,
      elevation: 2651,
      difficulty: 'moderat',
      description: 'Refugi guardat situat al cor del circ de Gavarnie.',
      distance: '4,2 km',
      rating: 4.5,
      visitors: 800
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
      visitors: 950
    },
    {
      id: '4',
      name: 'Refugi de Respomuso',
      type: 'refuge',
      lat: 42.7500,
      lng: -0.2500,
      elevation: 2200,
      difficulty: 'moderat',
      description: 'Refugi guardat al costat de l\'ibó de Respomuso a la vall de Tena.',
      distance: '3,8 km',
      rating: 4.4,
      visitors: 750
    },
    {
      id: '5',
      name: 'Refugi de Pineta',
      type: 'refuge',
      lat: 42.6500,
      lng: 0.0500,
      elevation: 1240,
      difficulty: 'fàcil',
      description: 'Refugi no guardat a la vall de Pineta, punt de partida cap a Mont Perdut.',
      distance: '2,1 km',
      rating: 4.2,
      visitors: 1100
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
      visitors: 900
    },
    {
      id: '7',
      name: 'Refugi de Lizara',
      type: 'refuge',
      lat: 42.9000,
      lng: -0.7500,
      elevation: 1540,
      difficulty: 'fàcil',
      description: 'Refugi guardat a la vall de l\'Aragó Subordà, prop de la Mesa dels Tres Reis.',
      distance: '2,5 km',
      rating: 4.3,
      visitors: 650
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
      visitors: 1400
    },
    {
      id: '9',
      name: 'Refugi d\'Estós',
      type: 'refuge',
      lat: 42.7200,
      lng: 0.5800,
      elevation: 1890,
      difficulty: 'moderat',
      description: 'Refugi guardat a la vall d\'Estós, punt de partida cap al Perdiguero.',
      distance: '4,1 km',
      rating: 4.5,
      visitors: 720
    },
    {
      id: '10',
      name: 'Refugi d\'Àngel Orús',
      type: 'refuge',
      lat: 42.6900,
      lng: 0.4200,
      elevation: 2100,
      difficulty: 'moderat',
      description: 'Refugi guardat al massís de la Maladeta, prop de l\'Aneto.',
      distance: '3,9 km',
      rating: 4.4,
      visitors: 890
    },
    {
      id: '11',
      name: 'Refugi de Salardu',
      type: 'refuge',
      lat: 42.7800,
      lng: 0.8900,
      elevation: 2310,
      difficulty: 'moderat',
      description: 'Refugi guardat a la Val d\'Aran, accés als Encantats.',
      distance: '5,1 km',
      rating: 4.6,
      visitors: 1050
    },
    {
      id: '12',
      name: 'Refugi de Colomina',
      type: 'refuge',
      lat: 42.5800,
      lng: 0.9200,
      elevation: 2135,
      difficulty: 'moderat',
      description: 'Refugi guardat al costat de l\'embassament de Colomina al Parc Nacional.',
      distance: '3,7 km',
      rating: 4.3,
      visitors: 630
    },
    {
      id: '13',
      name: 'Refugi de Ventosa i Calvell',
      type: 'refuge',
      lat: 42.6200,
      lng: 1.1500,
      elevation: 2220,
      difficulty: 'moderat',
      description: 'Refugi guardat al Parc Nacional d\'Aigüestortes.',
      distance: '4,3 km',
      rating: 4.7,
      visitors: 980
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
      visitors: 1200
    },
    {
      id: '15',
      name: 'Refugi de Cap de Llauset',
      type: 'refuge',
      lat: 42.7100,
      lng: 0.7200,
      elevation: 2415,
      difficulty: 'difícil',
      description: 'Refugi lliure al circ de Colomèrs, zona d\'alta muntanya.',
      distance: '6,2 km',
      rating: 4.2,
      visitors: 450
    },
    {
      id: '16',
      name: 'Refugi de Restanca',
      type: 'refuge',
      lat: 42.7400,
      lng: 0.7800,
      elevation: 2010,
      difficulty: 'fàcil',
      description: 'Refugi guardat al costat de l\'ibó de Restanca a la vall d\'Aran.',
      distance: '3,2 km',
      rating: 4.4,
      visitors: 820
    },
    {
      id: '17',
      name: 'Refugi de Mallafré',
      type: 'refuge',
      lat: 42.6600,
      lng: 1.0200,
      elevation: 2045,
      difficulty: 'moderat',
      description: 'Refugi guardat a la vall de la Noguera Ribagorçana.',
      distance: '4,5 km',
      rating: 4.1,
      visitors: 590
    },
  ];



  // Filtrar ubicacions basant-se en cerca i filtres
  const filteredLocations = useMemo(() => {
    return mockLocations.filter(location => {
      // Filtre de cerca
      const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           location.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtre de tipus
      const matchesType = filters.types.length === 0 || filters.types.includes(location.type);
      
      // Filtre d'elevació
      const matchesElevation = location.elevation >= filters.elevation[0] && 
                              location.elevation <= filters.elevation[1];
      
      // Filtre de dificultat
      const matchesDifficulty = filters.difficulty.length === 0 || 
                               (location.difficulty && filters.difficulty.includes(location.difficulty));
      
      return matchesSearch && matchesType && matchesElevation && matchesDifficulty;
    });
  }, [searchQuery, filters]);

  // Afegir isFavorite a les ubicacions
  const locationsWithFavorites = useMemo(() => {
    return filteredLocations.map(location => ({
      ...location,
      isFavorite: favoriteIds.has(location.id)
    }));
  }, [filteredLocations, favoriteIds]);

  // Obtenir favorits
  const favoriteLocations = useMemo(() => {
    return mockLocations.filter(location => favoriteIds.has(location.id))
                       .map(location => ({ ...location, isFavorite: true }));
  }, [favoriteIds]);

  const handleToggleFavorite = (locationId: string) => {
    const newFavorites = new Set(favoriteIds);
    if (newFavorites.has(locationId)) {
      newFavorites.delete(locationId);
      toast("Eliminat dels favorits");
    } else {
      newFavorites.add(locationId);
      toast("Afegit als favorits");
    }
    setFavoriteIds(newFavorites);
  };

  const handleNavigate = (location: Location) => {
    toast(`Navegant a ${location.name}`);
  };

  const handleShare = (location: Location) => {
    if (navigator.share) {
      navigator.share({
        title: location.name,
        text: location.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${location.name} - ${window.location.href}`);
      toast("Enllaç copiat al portapapers");
    }
  };

  const handleShowRefugeBottomSheet = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
  };

  const handleShowRefugeDetail = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(false);
    setShowRefugeDetail(true);
  };

  const handleBackFromDetail = () => {
    setShowRefugeDetail(false);
    setSelectedLocation(undefined);
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedLocation(undefined);
  };


  const renderContent = () => {
    // Si estem mostrant detalls d'un refugi, mostrar la vista de detalls
    if (showRefugeDetail && selectedLocation) {
      return (
        <RefugeDetailView
          refuge={selectedLocation}
          onBack={handleBackFromDetail}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={handleNavigate}
          onShare={handleShare}
        />
      );
    }

    switch (activeTab) {
      case 'map':
        return (
          <div className="flex flex-col h-full relative">
            <div className="flex-1">
              <MapView
                locations={locationsWithFavorites}
                onLocationSelect={handleShowRefugeBottomSheet}
                selectedLocation={selectedLocation}
              />
            </div>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenFilters={() => setIsFilterOpen(true)}
            />
          </div>
        );
      
      case 'favorites':
        return (
          <FavoritesView
            favorites={favoriteLocations}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigate}
            onShare={handleShare}
            onViewDetail={handleShowRefugeDetail}
          />
        );
      
      case 'reforms':
        return (
          <ReformsView />
        );
      
      case 'profile':
        return (
          <ProfileView 
            onViewRefugeDetail={handleShowRefugeDetail}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Contenido principal */}
      <div className="flex-1 pb-16">
        {renderContent()}
      </div>

      {/* Panel de filtros */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Navegación inferior */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Bottom Sheet del refugi */}
      {selectedLocation && (
        <RefugeBottomSheet
          refuge={selectedLocation}
          isVisible={showBottomSheet}
          onClose={handleCloseBottomSheet}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={handleNavigate}
          onViewDetails={handleShowRefugeDetail}
        />
      )}
    </div>
  );
}