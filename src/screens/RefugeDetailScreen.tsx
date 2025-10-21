import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Location } from '../types';

// Icons (assumint que tenim aquestes icones SVG)
import HeartIcon from '../assets/icons/fav.svg';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import AltitudeIcon from '../assets/icons/altitude2.svg';
import UsersIcon from '../assets/icons/users.svg';
import MapPinIcon from '../assets/icons/map-pin.svg';
import EditIcon from '../assets/icons/edit.svg';
import DownloadIcon from '../assets/icons/download.svg';
import { BadgeType } from '../components/BadgeType';
import { BadgeCondition } from '../components/BadgeCondition';

interface RefugeDetailScreenProps {
  refuge: Location;
  onBack: () => void;
  onToggleFavorite: (id: number | undefined) => void;
  onNavigate: (location: Location) => void;
  onEdit?: (location: Location) => void;
}

// Badges use centralized components: Badge, BadgeType, BadgeCondition

export function RefugeDetailScreen({ 
  refuge, 
  onBack, 
  onToggleFavorite, 
  onNavigate, 
  onEdit,
}: RefugeDetailScreenProps) {
  const insets = useSafeAreaInsets();

  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);

  // Static header image - will scroll together with the content

  const handleToggleFavorite = () => {
    onToggleFavorite(refuge.id);
  };

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(refuge);
      return;
    }
    Alert.alert('Editar', `Editar ${refuge.name}`);
  };

  const handleDownloadGPX = () => {
    // Crear contenido GPX con las coordenadas del refugio
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RefugisLliures" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="${refuge.coord.lat}" lon="${refuge.coord.long}">
    <name>${refuge.name}</name>
    <desc>${refuge.description || ''}</desc>
    <ele>${refuge.altitude || 0}</ele>
  </wpt>
</gpx>`;
    
    // Aquí se implementaría la descarga del archivo
    Alert.alert('Descargar GPX', 'Funcionalidad de descarga GPX se implementará próximamente');
  };

  const handleDownloadKML = () => {
    // Crear contenido KML con las coordenadas del refugio
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>${refuge.name}</name>
      <description>${refuge.description || ''}</description>
      <Point>
        <coordinates>${refuge.coord.long},${refuge.coord.lat},${refuge.altitude || 0}</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
    
    // Aquí se implementaría la descarga del archivo
    Alert.alert('Descargar KML', 'Funcionalidad de descarga KML se implementará próximamente');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      {/* Back button on top of everything */}
      
      {/* Contingut principal amb ScrollView */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header amb imatge (ara dins del ScrollView) */}
        <View style={styles.header}>
          <Image
            source={{ 
              uri: refuge.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
            }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.gradientOverlay} />
            {/* actionButtons removed from header; now rendered as overlay */}
        </View>
        {/* Títol i informació bàsica */}
        <View style={styles.section}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{refuge.name}</Text>
            <View style={styles.badgesContainer}>
              {refuge.type && (
                <BadgeType type={refuge.type} style={{ marginRight: 8 }} />
              )}
              {refuge.condition && (
                <BadgeCondition condition={'Estat: ' + refuge.condition} />
              )}
            </View>
          </View>
          
          {/* Stats en grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <AltitudeIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>Altitud</Text>
              <Text style={styles.statValue}>{refuge.altitude || refuge.elevation || 'N/A'}m</Text>
            </View>
            
            <View style={styles.statCard}>
              <UsersIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>Places</Text>
              <Text style={styles.statValue}>{refuge.places || refuge.capacity || 'N/A'}</Text>
            </View>
            
            <View style={styles.statCard}>
              <MapPinIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>Regió</Text>
              <Text style={styles.statValue}>{refuge.region || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        {/* Descripció */}
        {refuge.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripció</Text>
            <View>
              <Text
                style={styles.description}
                numberOfLines={descriptionExpanded ? undefined : 4}
              >
                {refuge.description}
              </Text>
              {refuge.description.length > 200 && (
                <TouchableOpacity 
                  onPress={() => {
                    setDescriptionExpanded(!descriptionExpanded);
                  }} 
                  style={styles.readMoreButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.readMoreText}>
                    {descriptionExpanded ? 'Show less' : 'Read more...'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        {/* Informació de localització */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localització</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MapPinIcon width={16} height={16} color="#FF6900" />
              <Text style={styles.locationText}>
                Lat: {refuge.coord.lat.toFixed(4)} • Lng: {refuge.coord.long.toFixed(4)}
              </Text>
            </View>
            <View style={styles.downloadButtons}>
              <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadGPX}>
                <DownloadIcon width={14} height={14} color="#4A5565" />
                <Text style={styles.downloadButtonText}>GPX</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadKML}>
                <DownloadIcon width={14} height={14} color="#4A5565" />
                <Text style={styles.downloadButtonText}>KML</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Departament si existeix */}
        {refuge.departement && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Departament</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{refuge.departement}</Text>
            </View>
          </View>
        )}

        {/* Enllaços si existeixen */}
        {refuge.links && refuge.links.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enllaços</Text>
            {refuge.links.map((link, index) => (
              <View key={index} style={styles.infoCard}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {link}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Espai addicional per permetre scroll complet */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action buttons overlay (fixed) */}
      <View style={[styles.fixedActions, { top: 16 + insets.top }]}> 
        <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
          <HeartIcon width={20} height={20} color={refuge.isFavorite ? '#ef4444' : '#4A5565'} fill={refuge.isFavorite ? '#ef4444' : 'none'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { marginLeft: 8 }]} onPress={handleEdit}>
          <EditIcon width={18} height={18} color="#4A5565" />
        </TouchableOpacity>
      </View>

      {/* Back button rendered last so it's visually on top */}
      <TouchableOpacity 
        style={[styles.backButton, { top: 16 + insets.top, zIndex: 1000 }]} 
        onPress={onBack}
      >
        <ArrowLeftIcon width={20} height={20} color="#4A5565" />
      </TouchableOpacity>
      
      {/* Safe area */}
      <View style={{ paddingBottom: insets.bottom }}>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: 320,
    position: 'relative',
    marginBottom: 16,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    // full-bleed image
    alignSelf: 'stretch',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2000,
  },
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fixedActions: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2000,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'justify',
  },
  locationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  linkText: {
    fontSize: 12,
    color: '#2563eb',
  },
  readMoreButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  readMoreText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationButtonContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
  navigationButton: {
    backgroundColor: '#FF6900',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navigationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  downloadButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  downloadButtonText: {
    fontSize: 12,
    color: '#4A5565',
    fontWeight: '500',
  },
});
