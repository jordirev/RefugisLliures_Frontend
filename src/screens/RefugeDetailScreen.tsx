import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Linking,
  Platform,
  Modal,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Use the legacy API to avoid deprecation warnings for writeAsStringAsync
import * as FileSystem from 'expo-file-system/legacy';
// Use a runtime require for expo-sharing so the code still typechecks if the
// package hasn't been installed yet. At runtime, if it's missing, we'll
// gracefully fall back to notifying the user.
let Sharing: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sharing = require('expo-sharing');
} catch (e) {
  Sharing = null;
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Location, ImageMetadata } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import useFavourite from '../hooks/useFavourite';
import { useRefuge } from '../hooks/useRefugesQuery';
import { useExperiences, useDeleteExperience, useUpdateExperience } from '../hooks/useExperiencesQuery';
import { useUser } from '../hooks/useUsersQuery';
import { BadgeType } from '../components/BadgeType';
import { BadgeCondition } from '../components/BadgeCondition';
import { QuickActionsMenu } from '../components/QuickActionsMenu';
import { PhotoViewerModal, VideoThumbnail } from '../components/PhotoViewerModal';
import { UserExperience } from '../components/UserExperience';
import { GalleryScreen } from './GalleryScreen';
import { RefugeMediaService } from '../services/RefugeMediaService';
import { useAuth } from '../contexts/AuthContext';
import { RefugeOccupationModal } from '../components/RefugeOccupationModal';

// Icons
import HeartIcon from '../assets/icons/fav.svg';
import HeartFilledIcon from '../assets/icons/favourite2.svg';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import AltitudeIcon from '../assets/icons/altitude2.svg';
import UsersIcon from '../assets/icons/users.svg';
import MapPinIcon from '../assets/icons/map-pin.svg';
import ArrowIcon from '../assets/icons/right-arrow.png';
import DownloadIcon from '../assets/icons/download.svg';
import MenuIcon from '../assets/icons/menu.svg';
import RoutesIcon from '../assets/icons/routes.png';
import WeatherIcon from '../assets/icons/weather2.png';
import NavigationIcon from '../assets/icons/navigation.svg';
import CalendarIcon from '../assets/icons/calendar.svg';
import GalleryIcon from '../assets/icons/gallery.png';
import AddPhotoIcon from '../assets/icons/addPhoto.png';
import DoubtIcon from '../assets/icons/doubt-orange.png';
import ExperienceIcon from '../assets/icons/message-circle.svg';

// Helper function to check if a media is a video based on URL extension
const isVideo = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Component for experience preview in the list
const ExperiencePreviewItem: React.FC<{ 
  experience: any;
  onPhotoPress: (photos: any[], index: number) => void;
  onEdit?: (experienceId: string, newComment: string, newFiles: File[]) => void;
  onDelete?: () => void;
}> = ({ experience, onPhotoPress, onEdit, onDelete }) => {
  const { data: user } = useUser(experience.creator_uid);

  return (
    <View style={styles.experiencePreviewItem}>
      <UserExperience
        user={user || null}
        experience={experience}
        onPhotoPress={onPhotoPress}
        onEdit={onEdit}
        onDelete={onDelete}
        refugeCreatorUid={experience.creator_uid}
      />
    </View>
  );
};


interface RefugeDetailScreenProps {
  refugeId: string;
  onBack: () => void;
  onToggleFavorite: (id: string | undefined) => void;
  onNavigate: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  onViewMap?: (location: Location) => void;
  onNavigateToDoubts?: (refugeId: string, refugeName: string) => void;
  onNavigateToExperiences?: (refugeId: string, refugeName: string) => void;
}

// Badges use centralized components: Badge, BadgeType, BadgeCondition

export function RefugeDetailScreen({ 
  refugeId, 
  onBack, 
  onToggleFavorite, 
  onNavigate, 
  onEdit,
  onDelete,
  onViewMap,
  onNavigateToDoubts,
  onNavigateToExperiences,
}: RefugeDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { firebaseUser } = useAuth();
  
  // Load full refuge data - pass refugeId even if empty (hooks must always be called)
  const { data: refuge, isLoading: loadingRefuge, refetch: refetchRefuge } = useRefuge(refugeId || '');
  const { isFavourite, toggleFavourite, isProcessing } = useFavourite(refugeId || '');
  
  // Load experiences for this refuge
  const { data: experiences, isLoading: loadingExperiences } = useExperiences(refugeId || '');
  const deleteExperienceMutation = useDeleteExperience();
  const updateExperienceMutation = useUpdateExperience();
  
  // Get the 3 most recent experiences
  const recentExperiences = React.useMemo(() => {
    if (!experiences) return [];
    return experiences.slice(0, 3);
  }, [experiences]);
  
  // Local navigation handlers
  const handleNavigateToDoubts = () => {
    if (onNavigateToDoubts) {
      onNavigateToDoubts(refugeId, refuge?.name || '');
    } else {
      navigation.navigate('DoubtsScreen', { refugeId, refugeName: refuge?.name || '' });
    }
  };
  
  const handleNavigateToExperiences = () => {
    if (onNavigateToExperiences) {
      onNavigateToExperiences(refugeId, refuge?.name || '');
    } else {
      navigation.navigate('ExperiencesScreen', { refugeId, refugeName: refuge?.name || '' });
    }
  };
  
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = React.useState('');
  const [confirmModalUrl, setConfirmModalUrl] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [occupationModalVisible, setOccupationModalVisible] = React.useState(false);
  
  // Sort images by uploaded_at in descending order (most recent first)
  const sortedImages = React.useMemo(() => {
    if (!refuge?.images_metadata) return [];
    return [...refuge.images_metadata].sort((a, b) => {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    });
  }, [refuge?.images_metadata]);
  
  // Gallery states
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [photoViewerVisible, setPhotoViewerVisible] = React.useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = React.useState(0);
  const [galleryScreenVisible, setGalleryScreenVisible] = React.useState(false);
  const [uploadingPhotos, setUploadingPhotos] = React.useState(false);
  const imageScrollRef = React.useRef<ScrollView>(null);

  // Experience photo viewer states
  const [selectedPhotos, setSelectedPhotos] = React.useState<ImageMetadata[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);
  const [photoModalVisible, setPhotoModalVisible] = React.useState(false);

  // Edge drag zone for opening menu - must be before early returns
  const screenWidth = Dimensions.get('window').width;
  const edgeDragZone = 400;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { pageX } = evt.nativeEvent;
        const isInEdge = screenWidth - pageX <= edgeDragZone;
        return isInEdge && !menuOpen;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { pageX } = evt.nativeEvent;
        const isInEdge = screenWidth - pageX <= edgeDragZone;
        return isInEdge && !menuOpen && gestureState.dx < -5;
      },
      onPanResponderMove: () => {
        // Handle drag movement if needed
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!menuOpen && gestureState.dx < -30) {
          setMenuOpen(true);
        }
      },
    })
  ).current;

  // Show loading or error if no valid refugeId or data (after all hooks)
  if (!refugeId || loadingRefuge || !refuge) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {!loadingRefuge && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ArrowLeftIcon width={24} height={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loadingRefuge ? (
            <ActivityIndicator size="large" color="#F97316" />
          ) : (
            <Text>{t('common.error')}</Text>
          )}
        </View>
      </View>
    );
  }

  // Helper to format coordinates: lat 4 decimals, long 5 decimals -> (lat, long)
  const formatCoord = (lat: number, long: number) => {
    const latStr = lat.toFixed(4);
    const longStr = long.toFixed(5);
    return `(${latStr}, ${longStr})`;
  };

  const renderAmenities = () => {
    if (!refuge.info_comp) return null;

    // Icon mapping for each amenity
    const amenityIcons: { [key: string]: string } = {
      manque_un_mur: '🏚️',
      cheminee: '🔥',
      poele: '🍳',
      couvertures: '🛏️',
      latrines: '🚽',
      bois: '🪵',
      eau: '💧',
      matelas: '🛌',
      couchage: '😴',
      bas_flancs: '🪜',
      lits: '🛏️',
      mezzanine_etage: '⬆️',
    };

    const amenities = [];
    for (const [key, value] of Object.entries(refuge.info_comp)) {
      if (value) {
        amenities.push({
          key,
          label: t(`refuge.amenities.${key}`),
          icon: amenityIcons[key] || '✨',
        });
      }
    }
    return amenities;
  };

  // Static header image - will scroll together with the content

  const handleToggleFavorite = async () => {
    try {
      await toggleFavourite();
      if (onToggleFavorite) onToggleFavorite(refuge.id);
    } catch (err) {
      // Error already logged in hook
      showAlert(t('common.error'), t('alerts.favoriteError'));
    }
  };

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(refuge);
      return;
    }
    showAlert(t('common.edit'), t('alerts.editRefuge', { name: refuge.name }));
  };

  const handleDownloadGPX = () => {
    // Directe: només Descarregar (el SO mostrarà el selector quan calgui)
    showAlert(
      t('alerts.downloadGPX.title'),
      t('alerts.downloadGPX.message', { name: refuge.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.download'), onPress: () => {
          (async () => {
            const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="RefugisLliures" xmlns="http://www.topografix.com/GPX/1/1">\n  <wpt lat="${refuge.coord.lat}" lon="${refuge.coord.long}">\n    <name><![CDATA[${refuge.name || refuge.surname || t('refuge.title')}]]></name>\n    <desc><![CDATA[${refuge.description || ''}]]></desc>\n    <ele>${refuge.altitude ?? t('common.unknown')}</ele>\n  </wpt>\n</gpx>`;
            const fileName = sanitizeFileName(`${refuge.name || refuge.surname || t('refuge.title')}.gpx`);
            await saveFile(gpxContent, fileName, 'application/gpx+xml');
          })();
        } }
      ]
    );
  };

  const handleDownloadKML = () => {
    showAlert(
      t('alerts.downloadKML.title'),
      t('alerts.downloadKML.message', { name: refuge.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.download'), onPress: () => {
          (async () => {
            const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <Placemark>\n      <name><![CDATA[${refuge.name}]]></name>\n      <description><![CDATA[${refuge.description || ''}]]></description>\n      <Point>\n        <coordinates>${refuge.coord.long},${refuge.coord.lat},${refuge.altitude || 0}</coordinates>\n      </Point>\n    </Placemark>\n  </Document>\n</kml>`;
            const fileName = sanitizeFileName(`${refuge.name}.kml`);
            await saveFile(kmlContent, fileName, 'application/vnd.google-earth.kml+xml');
          })();
        } }
      ]
    );
  };

  // Intenta desar el fitxer al dispositiu (Android: StorageAccessFramework si està disponible)
  const saveFile = async (content: string, fileName: string, mimeType = 'text/plain') => {
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const fsAny: any = FileSystem as any;

      // Android: intentar StorageAccessFramework per desar directament a Downloads o carpeta triada
      if (Platform.OS === 'android' && fsAny.StorageAccessFramework) {
        try {
          const SAF = fsAny.StorageAccessFramework;
          // Obre el selector de directori
          // requestDirectoryPermissionsAsync retorna { granted: boolean, directoryUri }
          // Si l'usuari selecciona una carpeta, guardem allà el fitxer
          // @ts-ignore
          const permission = await SAF.requestDirectoryPermissionsAsync();
          if (!permission || !permission.granted) {
            showAlert(t('alerts.permissionRequired'), t('alerts.permissionDenied'));
            return;
          }
          const directoryUri = permission.directoryUri;
          // @ts-ignore
          const newFileUri = await SAF.createFileAsync(directoryUri, fileName, mimeType);
          // Escriure el contingut al nou URI
          if (SAF.writeAsStringAsync) {
            // @ts-ignore
            await SAF.writeAsStringAsync(newFileUri, content);
          } else {
            // fallback: intentar escriure amb FileSystem
            await fsAny.writeAsStringAsync(newFileUri, content);
          }
          showAlert(t('alerts.fileSaved'), t('alerts.fileSavedLocation'));
          return;
        } catch (e) {
          console.warn('SAF save failed, falling back to sharing', e);
          // si falla, fem fallback a compartir
        }
      }

      // Fallback general: guardar a documentDirectory
      const baseDir = fsAny.documentDirectory || fsAny.cacheDirectory || '';
      const fileUri = baseDir + fileName;
      await fsAny.writeAsStringAsync(fileUri, content);

      // iOS: presentar directament el diàleg de "Save to Files" mitjançant Sharing
      if (Platform.OS === 'ios' && Sharing && (await Sharing.isAvailableAsync())) {
        try {
          await Sharing.shareAsync(fileUri);
          return;
        } catch (e) {
          console.warn('iOS share-as-save failed, falling back to alert', e);
        }
      }

      // Altrament, notifiquem la ubicació on s'ha desat
      showAlert(t('alerts.fileSaved'), t('alerts.fileSavedAt', { path: fileUri }));

    } catch (e) {
      console.warn('saveFile error', e);
      showAlert(t('common.error'), t('alerts.fileError'));
      // si tot falla, oferir compartir
      try {
        const tempName = fileName;
        await writeAndShareFile(content, tempName, mimeType);
      } catch (_e) {
        console.warn('share fallback failed', _e);
      }
    }
  };

  // Sanititza un nom de fitxer per evitar caràcters problemàtics
  const sanitizeFileName = (name: string) => {
    return name.replaceAll(/[\\/:*?"<>|]+/g, '_').replaceAll(/\s+/g, '_').slice(0, 120);
  };

  // Escriu el fitxer al sistema i obre el dialeg de compartir/guardar (nadiu) o dispara la descàrrega (web)
  const writeAndShareFile = async (content: string, fileName: string, mimeType = 'text/plain') => {
    try {
      if (Platform.OS === 'web') {
        // Web fallback: crear blob i forçar descàrrega
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const fsAny: any = FileSystem as any;
      const baseDir = fsAny.documentDirectory || fsAny.cacheDirectory || '';
      const fileUri = baseDir + fileName;
      await fsAny.writeAsStringAsync(fileUri, content);

      // Preferir l'API d'sharing nativa si està disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // En Android cal a vegades convertir a contentUri
        if (Platform.OS === 'android') {
          try {
            const fsAny2: any = FileSystem as any;
            // @ts-ignore
            const contentUriObj: any = await fsAny2.getContentUriAsync(fileUri);
            const shareUri = typeof contentUriObj === 'string' ? contentUriObj : (contentUriObj?.uri ?? fileUri);
            await Sharing.shareAsync(shareUri);
            return;
          } catch (_e) {
            // Fallback a compartir el fileUri directe
            await Sharing.shareAsync(fileUri);
            return;
          }
        }

        await Sharing.shareAsync(fileUri);
        return;
      }

      // Si Sharing no està disponible, informar l'usuari de la ubicació del fitxer
      showAlert(t('alerts.fileSaved'), t('alerts.fileSavedAt', { path: fileUri }));
    } catch (e) {
      console.warn('Error writing/sharing file', e);
      showAlert(t('common.error'), t('alerts.fileError'));
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      let finalUrl = url;
      // If the url doesn't include a scheme, assume https
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      console.log('Attempting to open URL:', finalUrl);
      
      // Per URLs de windy.com, intentem obrir-les directament sense validació prèvia
      // ja que canOpenURL pot fallar amb URLs complexes però openURL encara pot funcionar
      if (finalUrl.includes('windy.com')) {
        console.log('Opening Windy URL directly without validation');
        await Linking.openURL(finalUrl);
        console.log('Windy URL opened successfully');
        return;
      }
      
      const supported = await Linking.canOpenURL(finalUrl);
      console.log('URL supported:', supported);
      if (supported) {
        await Linking.openURL(finalUrl);
        console.log('URL opened successfully');
      } else {
        // Intentem obrir-la igualment, ja que canOpenURL pot donar falsos negatius
        console.log('Attempting to open URL despite canOpenURL returning false');
        try {
          await Linking.openURL(finalUrl);
          console.log('URL opened successfully despite validation failure');
        } catch (openError) {
          console.warn('URL not supported and failed to open:', finalUrl);
          showAlert(t('alerts.cannotOpenLink'), `${t('alerts.linkError')}\n\nURL: ${finalUrl}\n\nMotiu: El sistema no pot obrir aquest tipus d'enllaç.`);
        }
      }
    } catch (e) {
      console.error('Error opening link:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      showAlert(t('common.error'), `${t('alerts.linkError')}\n\nURL: ${url}\n\nError: ${errorMessage}`);
    }
  };

  // Open Windy with the refuge coordinates
  const handleOpenWindy = () => {
    const lat = refuge.coord.lat;
    const lon = refuge.coord.long;
    // Build URL: https://www.windy.com/lat/lon/mblue?lat,lon,zoom,p:cities
    const url = `https://www.windy.com/${lat}/${lon}/mblue?${lat},${lon},13,p:cities`;
    const message = t('alerts.windyMessage');
    confirmAndOpen(url, message);
  };

  // Open Wikiloc search for routes near the refuge name
  const handleOpenWikiloc = () => {
    const name = refuge.name || '';
    const encoded = encodeURIComponent(name);
    // Example: https://ca.wikiloc.com/wikiloc/map.do?q=Refuge%20de%20la%20Gola&fitMapToTrails=1&page=1
    const url = `https://ca.wikiloc.com/wikiloc/map.do?q=${encoded}&fitMapToTrails=1&page=1`;
    const message = t('alerts.wikilocMessage');
    confirmAndOpen(url, message);
  };

  // Show a confirmation dialog before opening an external link.
  // On native platforms use Alert.alert with buttons; on web use window.confirm as a fallback.
  const confirmAndOpen = (url: string, message: string) => {
    setConfirmModalMessage(message);
    setConfirmModalUrl(url);
    setConfirmModalVisible(true);
  };

  // Handle photo upload
  const handleUploadPhotos = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necessaris',
          'Necessitem permisos per accedir a les teves fotos i vídeos.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos', 'images'],
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
        ...(Platform.OS === 'ios' && {
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        }),
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setUploadingPhotos(true);

      // Prepare files for upload using URIs directly (React Native compatible)
      const files: any[] = [];
      for (const asset of result.assets) {
        const fileName = asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        
        // Create file object compatible with React Native FormData
        files.push({
          uri: asset.uri,
          type: mimeType,
          name: fileName,
        });
      }

      // Upload photos
      await RefugeMediaService.uploadRefugeMedia(refugeId, files as any);
      
      // Refetch refuge data to get updated photos
      await refetchRefuge();
      
      showAlert('Èxit', `S'han pujat ${files.length} foto(s) correctament.`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      showAlert('Error', 'No s\'han pogut pujar les fotos. Intenta-ho de nou.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleImageScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get('window').width;
    const index = Math.round(offsetX / screenWidth);
    setCurrentImageIndex(index);
  };

  const handleImagePress = (index: number) => {
    setPhotoViewerIndex(index);
    setPhotoViewerVisible(true);
  };

  const handleViewAllPhotos = () => {
    setGalleryScreenVisible(true);
  };

  const handlePhotoDeleted = async () => {
    await refetchRefuge();
  };

  const handleExperiencePhotoPress = (photos: ImageMetadata[], index: number) => {
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(index);
    setPhotoModalVisible(true);
  };

  const handleExperiencePhotoDeleted = () => {
    setPhotoModalVisible(false);
    // React Query will handle cache invalidation
  };

  const handleExperienceEdit = (experienceId: string, newComment: string, newFiles: File[]) => {
    updateExperienceMutation.mutate(
      { 
        experienceId, 
        refugeId: refugeId || '', 
        request: { comment: newComment, files: newFiles } 
      },
      {
        onSuccess: () => {
          showAlert(t('common.success'), t('experiences.updateSuccess') || 'Experiència actualitzada correctament');
        },
        onError: (error: any) => {
          showAlert(
            t('common.error'), 
            error.message || t('experiences.errors.updateExperienceError') || 'Error al actualitzar l\'experiència'
          );
        },
      }
    );
  };

  const handleExperienceDelete = (experienceId: string) => {
    showAlert(
      t('experiences.deleteExperience.title'),
      t('experiences.deleteExperience.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: hideAlert,
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            hideAlert();
            deleteExperienceMutation.mutate(
              { experienceId, refugeId: refugeId || '' },
              {
                onSuccess: () => {
                  showAlert(t('common.success'), t('experiences.deleteExperience.success'));
                },
                onError: (error: any) => {
                  showAlert(
                    t('common.error'), 
                    error.message || t('experiences.errors.deleteExperienceError')
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      {/* Gallery Screen */}
      {galleryScreenVisible && refuge && (
        <View style={StyleSheet.absoluteFill}>
          <GalleryScreen
            photos={sortedImages}
            refugeId={refugeId}
            refugeName={refuge.name}
            onBack={() => setGalleryScreenVisible(false)}
            onPhotoDeleted={handlePhotoDeleted}
            onAddPhotos={handleUploadPhotos}
          />
        </View>
      )}

      {!galleryScreenVisible && (
        <>
          {/* Edge drag zone for opening menu from right edge */}
          {!menuOpen && (
            <View
              style={styles.edgeDragZone}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragIndicator}>
                <Image source={ArrowIcon} style={styles.dragIndicatorImage} />
              </View>
            </View>
          )}
          
          {/* Contingut principal amb ScrollView */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Image gallery carousel - full width without padding */}
            <View style={styles.imageGalleryContainer}>
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
              >
                {/* Display first 3 photos */}
                {sortedImages.slice(0, 3).map((image, index) => (
                  <TouchableOpacity
                    key={image.key}
                    activeOpacity={0.9}
                    onPress={() => handleImagePress(index)}
                  >
                    {isVideo(image.url) ? (
                      <>
                        <VideoThumbnail uri={image.url} style={styles.headerImage} />
                        <View style={styles.videoOverlay}>
                          <View style={styles.playIconContainer}>
                            <Text style={styles.playIcon}>▶</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <Image
                        source={{ uri: image.url }}
                        style={styles.headerImage}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                ))}
                
                {/* 4th screen with buttons */}
                <View style={styles.buttonScreen}>
                  <Image
                    source={{ 
                      uri: sortedImages[0]?.url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
                    }}
                    style={styles.headerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.buttonScreenOverlay}>
                    <TouchableOpacity
                      style={styles.galleryButton}
                      onPress={handleViewAllPhotos}
                      activeOpacity={0.8}
                    >
                      <Image source={GalleryIcon} style={styles.galleryButtonIcon} />
                      <Text style={styles.galleryButtonText} numberOfLines={1}>{t('refuge.gallery.viewAll')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.galleryButton, { paddingVertical: 12 }]}
                      onPress={handleUploadPhotos}
                      activeOpacity={0.8}
                      disabled={uploadingPhotos}
                    >
                      <Image source={AddPhotoIcon} style={styles.addPhotoButtonIcon} />
                      {uploadingPhotos ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (                        
                        <Text style={styles.galleryButtonText} numberOfLines={1}>{t('refuge.gallery.addPhoto')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* Page indicators (dots) */}
              <View style={styles.pageIndicators}>
                {Array.from({ 
                  length: Math.min(sortedImages.length + 1, 4) 
                }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pageIndicator,
                      currentImageIndex === index && styles.pageIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Content with padding */}
            <View style={styles.contentWithPadding}>
              {/* Títol i informació bàsica */}
              <View style={styles.section}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{refuge.name}</Text>
                  {refuge.departement ? (
                    <Text style={styles.departmentText}>{refuge.departement}, {refuge.region}</Text>
                  ) : null}
                  <View style={styles.badgesContainer}>
                    {refuge.type !== undefined && (
                      <BadgeType type={refuge.type} style={{ marginRight: 8 }} />
                    )}
                    {(refuge.condition !== undefined && refuge.condition !== null) && (
                      <BadgeCondition condition={refuge.condition} />
                    )}
                  </View>
                </View>
          
          {/* Stats en grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <AltitudeIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.altitude')}</Text>
              <Text style={styles.statValue}>{refuge.altitude ? `${refuge.altitude}m` : 'N/A'}</Text>
            </View>
            
            <View style={styles.statCard}>
              <UsersIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.capacity')}</Text>
              <Text style={styles.statValue}>{refuge.places !== null ? String(refuge.places) : 'N/A'}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => setOccupationModalVisible(true)}
              activeOpacity={0.7}
            >
              <CalendarIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.occupation')}</Text>
              <Text style={[styles.statValue, {fontSize: 12}]}>{t('refuge.details.seeOccupation')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Descripció */}
        { refuge.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('refuge.details.description')}</Text>
            {refuge.description && (
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
                      {descriptionExpanded ? t('common.showLess') : t('common.readMore')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* Amenities (Equipament) */}
        {(() => {
          const amenities = renderAmenities();
          if (!amenities || amenities.length === 0) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('refuge.details.amenities')}</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityChip}>
                    <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                    <Text style={styles.amenityLabel}>{amenity.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}
        
        {/* Informació de localització */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('refuge.details.localisation')}</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MapPinIcon width={16} height={16} color="#FF6900" />
              <Text style={styles.locationText}>
                {formatCoord(refuge.coord.lat, refuge.coord.long)}
              </Text>
            </View>
            <View style={styles.downloadButtons}>
              <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={handleDownloadGPX}
                testID="download-gpx-button"
              >
                <DownloadIcon width={14} height={14} color="#4A5565" />
                <Text style={styles.downloadButtonText}>GPX</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={handleDownloadKML}
                testID="download-kml-button"
              >
                <DownloadIcon width={14} height={14} color="#4A5565" />
                <Text style={styles.downloadButtonText}>KML</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Informació extra */}
        {/* Informació de localització */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('refuge.details.prepareRoute')}</Text>
          {/* Stats en grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard} 
              onPress={handleOpenWindy} 
              activeOpacity={0.7}
              testID="weather-button"
            >
              <Image
                source={WeatherIcon}
                style={{ width: 48, height: 48, transform: [{ scaleX: -1 }] }}
              />
              <Text style={styles.statLabel2}>{t('refuge.details.weather')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard} 
              onPress={handleOpenWikiloc} 
              activeOpacity={0.7}
              testID="routes-button"
            >
              <Image source={RoutesIcon} style={{ width: 48, height: 48 }} />
              <Text style={styles.statLabel2}>{t('refuge.details.nearbyRoutes')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enllaços si existeixen */}
        {refuge.links && refuge.links.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('refuge.details.moreInformation')}</Text>
            {refuge.links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.infoCard}
                activeOpacity={0.7}
                onPress={() => handleOpenLink(link)}
              >
                <Text style={styles.linkText} numberOfLines={1}>
                  {link}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Doubts section button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.doubtsSectionButton} 
            onPress={handleNavigateToDoubts}
            activeOpacity={0.7}
          >
            <Image source={DoubtIcon} style={styles.doubtsIcon} />
            <Text style={styles.doubtsSectionText}>{t('doubts.title')}</Text>
          </TouchableOpacity>
        </View>

        {/* Experiences section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('experiences.title')}</Text>
          
          {loadingExperiences ? (
            <View style={styles.experiencesLoadingContainer}>
              <ActivityIndicator size="small" color="#FF6900" />
            </View>
          ) : recentExperiences.length > 0 ? (
            <>
              {recentExperiences.map((experience) => (
                <ExperiencePreviewItem
                  key={experience.id}
                  experience={experience}
                  onPhotoPress={handleExperiencePhotoPress}
                  onEdit={handleExperienceEdit}
                  onDelete={() => handleExperienceDelete(experience.id)}
                />
              ))}
              
              {/* View more button */}
              <TouchableOpacity 
                style={styles.doubtsSectionButton} 
                onPress={handleNavigateToExperiences}
                activeOpacity={0.7}
              >
                <ExperienceIcon width={24} height={24} color="#FF6000" />
                <Text style={styles.doubtsSectionText}>
                  {t('experiences.viewMore')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.doubtsSectionButton} 
              onPress={handleNavigateToExperiences}
              activeOpacity={0.7}
            >
              <ExperienceIcon width={24} height={24} color="#FF6000" />
              <Text style={styles.doubtsSectionText}>
                {t('experiences.addFirst')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.informationNotPreciseContainer}>
          <Text style={styles.informationNotPreciseText}>{t('refuge.details.information_not_precise')}</Text>
        </View>

        {/* Espai addicional per permetre scroll complet */}
        <View style={{ height: 10 }} />
            </View>
          </ScrollView>

          {/* Action buttons overlay (fixed) */}
          {!menuOpen && (
            <View style={[styles.fixedActions, { top: 18 + insets.top }]}> 
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleToggleFavorite}
            testID="favorite-button"
            disabled={isProcessing}
          >
            {isFavourite ? (
              <HeartFilledIcon width={20} height={20} color="#FF6900" />
            ) : (
              <HeartIcon width={20} height={20} color={'#4A5565'} fill={'none'} />
            )}
          </TouchableOpacity>
      
          <TouchableOpacity
            style={[styles.actionButton, { marginLeft: 8}]}
            onPress={() => setMenuOpen(true)}
            testID="menu-button"
          >
            <MenuIcon width={20} height={20} color="#4A5565" />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpen={() => setMenuOpen(true)}
        refuge={refuge}
        isFavourite={isFavourite}
        onToggleFavorite={handleToggleFavorite}
        onShowAlert={showAlert}
        onDelete={onDelete ? () => onDelete(refuge) : undefined}
        onEdit={onEdit ? () => onEdit(refuge) : undefined}
        onPhotoUploaded={handlePhotoDeleted}
        onViewMap={onViewMap ? () => {
          setMenuOpen(false);
          onViewMap(refuge);
        } : () => {
          setMenuOpen(false);
          navigation.navigate('MainTabs', { screen: 'Map', params: { selectedRefuge: refuge } });
        }}
        onNavigateToDoubts={handleNavigateToDoubts}
        onNavigateToExperiences={handleNavigateToExperiences}
      />

      {/* Back button rendered last so it's visually on top - hide when menu is open */}
      {!menuOpen && (
        <TouchableOpacity 
          style={[styles.backButton, { top: 18 + insets.top, zIndex: 3000 }]} 
          onPress={onBack}
          testID="back-button"
        >
          <ArrowLeftIcon width={20} height={20} color="#4A5565" />
        </TouchableOpacity>
      )}
      
      {/* Safe area */}
      <View style={{ paddingBottom: insets.bottom }}>
      </View>

      {/* Confirmation modal with justified text */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.modalTitle}>{t('alerts.redirectTo')}</Text>
              <Text style={styles.modalMessage}>{confirmModalMessage}</Text>
            </ScrollView>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalButtonRow, styles.modalCancel, { marginRight: 8 }]} onPress={() => setConfirmModalVisible(false)}>
                <View style={styles.modalButtonContent}>
                  <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButtonRow, styles.modalPrimary]} onPress={() => { setConfirmModalVisible(false); handleOpenLink(confirmModalUrl); }}>
                <View style={styles.modalButtonContent}>
                  <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>{t('refuge.actions.navigate')}</Text>
                  <NavigationIcon width={16} height={16} color="#ffffff" style={styles.modalIcon} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        visible={photoViewerVisible}
        photos={sortedImages}
        initialIndex={photoViewerIndex}
        refugeId={refugeId}
        onClose={() => setPhotoViewerVisible(false)}
        onPhotoDeleted={handlePhotoDeleted}
      />

      {/* Experience Photo Viewer Modal */}
      <PhotoViewerModal
        visible={photoModalVisible}
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
        refugeId={refugeId}
        onClose={() => setPhotoModalVisible(false)}
        onPhotoDeleted={handleExperiencePhotoDeleted}
        hideMetadata={true}
        experienceCreatorUid={
          recentExperiences?.find(exp => 
            exp.images_metadata?.some(img => 
              selectedPhotos.some(photo => photo.key === img.key)
            )
          )?.creator_uid
        }
      />
      
      {/* Refuge Occupation Modal */}
      {refuge && (
        <RefugeOccupationModal
          visible={occupationModalVisible}
          onClose={() => setOccupationModalVisible(false)}
          refuge={refuge}
        />
      )}
      
      {/* CustomAlert */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageGalleryContainer: {
    height: 320,
    position: 'relative',
    width: '100%',
  },
  header: {
    height: 320,
    position: 'relative',
    marginBottom: 16,
  },
  headerImage: {
    width: Dimensions.get('window').width,
    height: 320,
    alignSelf: 'stretch',
  },
  buttonScreen: {
    width: Dimensions.get('window').width,
    height: 320,
    position: 'relative',
  },
  buttonScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  galleryButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.7)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(200, 200, 200, 0.5)',
  },
  pageIndicatorActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 16,
    height: 6,
    borderRadius: 3,
  },
  contentWithPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
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
    top: 18,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
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
    top: 18,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2000,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 24,
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
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  statLabel2: {
    fontSize: 12,
    color: '#000000ff',
    marginTop: 8,
    fontWeight: '400',
    fontFamily: 'Arimo',
  },     
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#51555eff',
    lineHeight: 22,
    textAlign: 'justify',
  },
  departmentText: {
    fontSize: 14,
    color: '#717883',
    marginBottom: 12,
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
    padding: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  linkText: {
    fontSize: 12,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  readMoreButton: {
    marginTop: 2,
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
  copyToast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 80,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 3000,
  },
  copyToastText: {
    color: 'white',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalMessage: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    textAlign: 'justify',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    gap: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalPrimary: {
    backgroundColor: '#FF6900',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  modalPrimaryText: {
    color: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  modalButtonsColumn: {
    flexDirection: 'column',
    padding: 12,
    gap: 8,
  },
  modalButtonFull: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'center',
  },
  modalButtonRow: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: {
    marginLeft: 8,
    // nudge the icon down a couple pixels so it visually aligns with the text baseline
    transform: [{ translateY: 2 }],
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: '#FFF5ED',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ffd8bcff',
  },
  amenityIcon: {
    fontSize: 14,
  },
  amenityLabel: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  informationNotPreciseContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  informationNotPreciseText: {
    fontSize: 10,
    color: '#f04b2eff',
    fontWeight: '500',
    textAlign: 'center',
    justifyContent: 'center',
  },
  doubtsSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  doubtsIcon: {
    width: 24,
    height: 24,
  },
  doubtsSectionText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
    flex: 1,
  },
  experiencesLoadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  experiencePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  experiencePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  experienceAvatarPlaceholder: {
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  experiencePreviewInfo: {
    flex: 1,
    marginLeft: 8,
  },
  experienceUsername: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  experienceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  experienceComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  experienceImageIndicator: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  experienceThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  edgeDragZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 50,
    zIndex: 1500,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dragIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginRight: -15,
  },
  dragIndicatorImage: {
    width: 10, 
    height: 10, 
    tintColor: '#A0AEC0',
    marginRight: 10, 
    transform: [{ rotate: '180deg' }],
  },
  galleryButtonIcon: {
    width: 20,
    height: 20,
  },
  addPhotoButtonIcon: {
    width: 30, 
    height: 30,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 50,
    color: '#e0e0e0ff',
    marginLeft: 4,
  },
  experiencePreviewItem: {
    borderWidth: 1, 
    borderColor: '#F9FAFB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    shadowColor: '#818181ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  }
});

