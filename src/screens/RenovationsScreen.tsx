import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { RenovationCard, Renovation } from '../components/RenovationCard';

// import icons
import RenovationsIcon from '../assets/icons/reform.svg';
import InformationIcon from '../assets/icons/information-circle.svg';
import PlusIcon from '../assets/icons/plus2.svg';

export function RenovationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const renovations: Renovation[] = [
    {
      id: '1',
      title: 'Refugi del Cinquantenari',
      description: 'Goteres a la sala principal que requereixen reparació urgent.',
      location: 'Àreu',
      date: '2026-02-15',
      status: 'pending',
      priority: 'high',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      whatsappGroupUrl: 'https://chat.whatsapp.com/exemple-grup-reforma'
    },
    {
      id: '2',
      title: 'Cortal de l\'Oriol',
      description: 'Instal·lació de panells solars per millorar l\'eficiència energètica.',
      location: 'Bellver de Cerdanya',
      date: '2026-03-10',
      status: 'in-progress',
      priority: 'medium',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    },
    {
      id: '3',
      title: 'Refugi de Perafita',
      description: 'Actualització completa dels equips de cuina i sistemes de ventilació.',
      location: 'Andorra',
      date: '2026-01-20',
      status: 'completed',
      priority: 'medium',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    },
    {
      id: '4',
      title: 'Refugi de Respomuso',
      description: 'Manteniment del sender d\'accés després de les últimes pluges.',
      location: 'Vall de Tena',
      date: '2026-02-28',
      status: 'pending',
      priority: 'low',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    }
  ];

  const handleViewOnMap = (renovation: Renovation) => {
    // TODO: Implementar navegació al mapa
    console.log('View on map:', renovation.title);
  };

  const handleMoreInfo = (renovation: Renovation) => {
    // TODO: Implementar veure participants
    console.log('More info:', renovation.title);
  };

  const handleJoin = (renovation: Renovation) => {
    // TODO: Implementar unir-se
    console.log('Join:', renovation.title);
  };

  const handleCreateNew = () => {
    // TODO: Implementar crear nova reforma
    console.log('Create new renovation');
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RenovationsIcon width={20} height={20} style={styles.icon} />
            <Text style={styles.title}>Reformes i Millores</Text>
            <Text style={styles.count}>({renovations.length})</Text>
          </View>
          <TouchableOpacity style={styles.infoButton}>
            <InformationIcon width={24} height={24} style={styles.icon} />
          </TouchableOpacity>
        </View>
        
        {/* Les meves reformes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Les meves reformes</Text>
          {renovations.slice(0, 1).map((renovation) => (
            <RenovationCard
              key={renovation.id}
              renovation={renovation}
              isUserRenovation={true}
              onViewOnMap={() => handleViewOnMap(renovation)}
              onMoreInfo={() => handleMoreInfo(renovation)}
            />
          ))}
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Altres reformes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Altres reformes</Text>
          {renovations.slice(1).map((renovation) => (
            <RenovationCard
              key={renovation.id}
              renovation={renovation}
              isUserRenovation={false}
              onViewOnMap={() => handleViewOnMap(renovation)}
              onJoin={() => handleJoin(renovation)}
            />
          ))}
        </View>

        {/* Spacing for FAB */}
        <View style={styles.fabSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateNew}
      >
        <PlusIcon width={24} height={24} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  count: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  fabSpacing: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 40,
  },
});
