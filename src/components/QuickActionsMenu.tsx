import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Share,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { Location } from '../models';
import useVisited from '../hooks/useVisited';
import { RefugeMediaService } from '../services/RefugeMediaService';

// Icons
import HeartIcon from '../assets/icons/fav-white.svg';
import HeartFilledIcon from '../assets/icons/favourite2.svg';
const NonVisitedIcon = require('../assets/icons/non-visited.png');
const VisitedIcon = require('../assets/icons/visited.png');
import MapIcon from '../assets/icons/location-map-white.png';
import MessageCircleIcon from '../assets/icons/message-circle.svg';
import DoubtIcon from '../assets/icons/doubt.png';
import AddPhotoIcon from '../assets/icons/addPhoto.png';
import EditIcon from '../assets/icons/edit-white.png';
import TrashIcon from '../assets/icons/trash.svg';

interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
  refuge: Location;
  isFavourite: boolean;
  onToggleFavorite: () => void;
  onShowAlert: (title: string, message: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPhotoUploaded?: () => void;
  onViewMap?: () => void;
}

export function QuickActionsMenu({
  visible,
  onClose,
  onOpen,
  refuge,
  isFavourite,
  onToggleFavorite,
  onShowAlert,
  onDelete,
  onEdit,
  onPhotoUploaded,
  onViewMap,
}: QuickActionsMenuProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isVisited, toggleVisited, isProcessing } = useVisited(refuge.id);
  const [uploadingPhotos, setUploadingPhotos] = React.useState(false);

  const screenWidth = Dimensions.get('window').width;
  const sideMenuWidth = Math.min(120, screenWidth * 0.40);
  const translateX = React.useRef(new Animated.Value(sideMenuWidth)).current;
  const edgeDragZone = 30;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: sideMenuWidth,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible, sideMenuWidth, translateX]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationX } = evt.nativeEvent;
        return screenWidth - locationX <= edgeDragZone;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { locationX } = evt.nativeEvent;
        const isInEdge = screenWidth - locationX <= edgeDragZone;
        return isInEdge && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && !visible) {
          const newValue = Math.max(0, sideMenuWidth + gestureState.dx);
          translateX.setValue(newValue);
        } else if (gestureState.dx > 0 && visible) {
          const newValue = Math.min(sideMenuWidth, gestureState.dx);
          translateX.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!visible && gestureState.dx < -50) {
          onOpen();
        } else if (visible && gestureState.dx > 50) {
          onClose();
        } else {
          Animated.spring(translateX, {
            toValue: visible ? 0 : sideMenuWidth,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const formatCoord = (lat: number, long: number) => {
    const latStr = lat.toFixed(4);
    const longStr = long.toFixed(5);
    return `(${latStr}, ${longStr})`;
  };

  const handleToggleVisited = async () => {
    try {
      await toggleVisited();
    } catch (err) {
      console.error('Error toggling visited:', err);
    }
  };

  const handleShareExperience = () => {
    onShowAlert(
      t('alerts.shareExperience.title'),
      t('alerts.shareExperience.message')
    );
    onClose();
  };

  const handleAskQuestion = () => {
    onShowAlert(
      t('alerts.askQuestion.title'),
      t('alerts.askQuestion.message')
    );
    onClose();
  };

  const handleAddPhoto = async () => {
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
        mediaTypes: ['images', 'videos'],
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
      await RefugeMediaService.uploadRefugeMedia(refuge.id, files as any);
      
      // Notify parent to refetch refuge data
      if (onPhotoUploaded) {
        onPhotoUploaded();
      }
      
      onShowAlert('Èxit', `S'han pujat ${files.length} foto(s) correctament.`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      onShowAlert('Error', 'No s\'han pogut pujar les fotos. Intenta-ho de nou.');
    } finally {
      setUploadingPhotos(false);
    }
    onClose();
  };

  const handleEditRefuge = () => {
    if (onEdit) {
      onEdit();
    }
    onClose();
  };

  const handleDeleteRefuge = () => {
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  const handleViewOnMap = () => {
    if (onViewMap) {
      onViewMap();
    }
    onClose();
  };

  return (
    <>
      {/* Edge drag detector - always present */}
      <View
        style={styles.edgeDragZone}
        {...panResponder.panHandlers}
      />

      {visible && (
        <>
          {/* Overlay */}
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* Side menu panel */}
          <Animated.View
            style={[
              styles.sideMenu,
              {
                top: insets.top,
                bottom: insets.bottom,
                width: sideMenuWidth,
                transform: [{ translateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(88, 88, 88, 0.92)',
                'rgba(88, 88, 88, 0.70)',
                'rgba(88, 88, 88, 0.40)',
                'transparent',
              ]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.menuGradientBackground}
            >

              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={styles.menuContent}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={onToggleFavorite}
                  testID="menu-favorite"
                >
                  <View style={styles.menuItemIconContainer}>
                    {isFavourite ? (
                      <HeartFilledIcon width={24} height={24} color="#FF6900" />
                    ) : (
                      <HeartIcon width={24} height={24} color="#ffffff" />
                    )}
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('refuge.actions.favorite')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleToggleVisited}
                  testID="menu-visited"
                  disabled={isProcessing}
                >
                  <View style={styles.menuItemIconContainer}>
                    <Image
                      source={isVisited ? VisitedIcon : NonVisitedIcon}
                      style={{ width: 24, height: 24 }}
                    />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('refuge.actions.visited')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleViewOnMap}
                  testID="menu-view-map"
                >
                  <View style={styles.menuItemIconContainer}>
                    <Image source={MapIcon} style={{ width: 38, height: 30, marginLeft: 2 }} resizeMode="stretch" />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('refuge.actions.viewOnMap')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleShareExperience}
                  testID="menu-share-experience"
                >
                  <View style={styles.menuItemIconContainer}>
                    <MessageCircleIcon width={24} height={24} color="#ffffff" />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('refuge.actions.shareExperience')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleAskQuestion}
                  testID="menu-ask"
                >
                  <View style={styles.menuItemIconContainer}>
                    <Image source={DoubtIcon} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('refuge.actions.ask')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleAddPhoto}
                  testID="menu-photo"
                  disabled={uploadingPhotos}
                >
                  <View style={styles.menuItemIconContainer}>
                    {uploadingPhotos ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Image source={AddPhotoIcon} style={{ width: 38, height: 38 }} />
                    )}
                  </View>
                  <Text style={styles.menuItemText}>
                    {uploadingPhotos ? t('common.loading') : t('refuge.actions.addPhoto')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleEditRefuge}
                  testID="menu-edit"
                >
                  <View style={styles.menuItemIconContainer}>
                    <Image source={EditIcon} style={{ width: 22, height: 22 }} />
                  </View>
                  <Text style={styles.menuItemText}>
                    {t('refuge.actions.editRefuge')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDeleteRefuge}
                  testID="menu-delete"
                >
                  <View style={styles.menuItemIconContainer}>
                    <TrashIcon width={24} height={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.menuItemText, styles.deleteText]}>
                    {t('refuge.actions.deleteRefuge')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  edgeDragZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 30,
    zIndex: 1000,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1500,
  },
  sideMenu: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 2000,
  },
  menuGradientBackground: {
    flex: 1,
    paddingTop: 40,
    paddingRight: 2,
    paddingLeft: 2,
  },
  menuScrollView: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 40,
  },
  deleteText: {
    color: '#EF4444',
  },
  menuItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 18,
  },
  menuItemIconContainer: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
