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
} from 'react-native';
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
import { Location } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import useFavourite from '../hooks/useFavourite';

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
import { BadgeType } from '../components/BadgeType';
import { BadgeCondition } from '../components/BadgeCondition';
import { QuickActionsMenu } from '../components/QuickActionsMenu';
import RoutesIcon from '../assets/icons/routes.png';
import WeatherIcon from '../assets/icons/weather2.png';
import NavigationIcon from '../assets/icons/navigation.svg';
import CalendarIcon from '../assets/icons/calendar.svg';

interface RefugeDetailScreenProps {
  refuge: Location;
  onBack: () => void;
  onToggleFavorite: (id: string | undefined) => void;
  onNavigate: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
}

// Badges use centralized components: Badge, BadgeType, BadgeCondition

export function RefugeDetailScreen({ 
  refuge, 
  onBack, 
  onToggleFavorite, 
  onNavigate, 
  onEdit,
  onDelete,
}: RefugeDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { isFavourite, toggleFavourite, isProcessing } = useFavourite(refuge.id);
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = React.useState('');
  const [confirmModalUrl, setConfirmModalUrl] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Edge drag zone for opening menu
  const screenWidth = Dimensions.get('window').width;
  const edgeDragZone = 500;
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
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
        {/* Header amb imatge (ara dins del ScrollView) */}
        <View style={styles.header}>
          <Image
            source={{ 
              uri: refuge.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
            }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>

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
            
            <View style={styles.statCard}>
              <CalendarIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.occupation')}</Text>
              <Text style={[styles.statValue, {fontSize: 12}]}>{t('refuge.details.seeOccupation')}</Text>
            </View>
          </View>
        </View>
        
        {/* Descripció */}
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

        <View style={styles.informationNotPreciseContainer}>
          <Text style={styles.informationNotPreciseText}>{t('refuge.details.information_not_precise')}</Text>
        </View>

        {/* Espai addicional per permetre scroll complet */}
        <View style={{ height: 10 }} />
      </ScrollView>

      {/* Action buttons overlay (fixed) */}
      {!menuOpen && (
        <View style={[styles.fixedActions, { top: 16 + insets.top }]}> 
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
      />

      {/* Back button rendered last so it's visually on top - hide when menu is open */}
      {!menuOpen && (
        <TouchableOpacity 
          style={[styles.backButton, { top: 16 + insets.top, zIndex: 3000 }]} 
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
    borderRadius: 12,
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
    top: 16,
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
});

