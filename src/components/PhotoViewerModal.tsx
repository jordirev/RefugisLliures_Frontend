import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { ImageMetadata } from '../models';
import { useUser } from '../hooks/useUsersQuery';
import { useDeleteRefugeMedia } from '../hooks/useRefugeMediaQuery';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { MediaImage, isVideoMedia } from './MediaImage';
import { isUserAdmin } from '../utils/authUtils';

// Icons
// @ts-ignore
import CloseIcon from '../assets/icons/x.svg';

interface PhotoViewerModalProps {
  visible: boolean;
  photos: ImageMetadata[];
  initialIndex: number;
  refugeId: string;
  onClose: () => void;
  onPhotoDeleted?: () => void;
  experienceCreatorUid?: string; // UID del creador de l'experiència (si és des d'una experiència)
  hideMetadata?: boolean; // Ocultar created_by i created_at
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Permisos visuals del menú ⋮ (el backend és qui autoritza de veritat).
 * - «Denunciar»: qualsevol usuari autenticat que NO sigui l'autor.
 * - «Eliminar»: l'autor, el creador de l'experiència a què pertany la foto, o un admin.
 */
export function getPhotoMenuPermissions(params: {
  currentUid?: string | null;
  creatorUid?: string | null;
  experienceCreatorUid?: string | null;
  isAdmin: boolean;
}) {
  const { currentUid, creatorUid, experienceCreatorUid, isAdmin } = params;
  const isAuthor =
    !!currentUid &&
    (currentUid === creatorUid || (!!experienceCreatorUid && currentUid === experienceCreatorUid));
  return {
    isAuthor,
    canReport: !!currentUid && !isAuthor,
    canDelete: isAuthor || (!!currentUid && isAdmin),
  };
}

// Video thumbnail component - shows first frame of video with play icon
export function VideoThumbnail({ uri, style, onPress }: { uri: string; style: any; onPress?: () => void }) {
  const player = useVideoPlayer(uri, player => {
    player.pause();
    player.muted = true;
  });

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={1} style={{ position: 'relative' }}>
      <VideoView
        player={player}
        style={style}
        contentFit="cover"
        nativeControls={false}
      />
    </TouchableOpacity>
  );
}

// Video player component using expo-video
function VideoPlayer({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, player => {
    player.loop = false;
    player.pause();
  });

  return (
    <VideoView
      player={player}
      style={style}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
      contentFit="contain"
      nativeControls
    />
  );
}

export function PhotoViewerModal({
  visible,
  photos,
  initialIndex,
  refugeId,
  onClose,
  onPhotoDeleted,
  experienceCreatorUid,
  hideMetadata = false,
}: PhotoViewerModalProps) {
  const { firebaseUser } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const deleteMediaMutation = useDeleteRefugeMedia();
  const deleting = deleteMediaMutation.isPending;

  const currentPhoto = photos[currentIndex];

  // Informació del creador de la foto actual (clau del registre: ['users','detail',uid])
  const { data: creator, isLoading: loadingCreator } = useUser(
    !hideMetadata ? currentPhoto?.creator_uid : undefined
  );

  // Rol d'admin (claim del token de Firebase); només afecta la UI
  useEffect(() => {
    let cancelled = false;
    if (visible && firebaseUser) {
      isUserAdmin()
        .then((admin) => {
          if (!cancelled) setIsAdmin(admin);
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [visible, firebaseUser]);

  const { canReport, canDelete } = getPhotoMenuPermissions({
    currentUid: firebaseUser?.uid,
    creatorUid: currentPhoto?.creator_uid,
    experienceCreatorUid,
    isAdmin,
  });

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setMenuOpen(false);
      // Scroll to initial photo
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < photos.length) {
      setCurrentIndex(index);
      setMenuOpen(false);
    }
  };

  const handleReport = () => {
    setMenuOpen(false);
    if (!currentPhoto) return;
    const mediaKey = currentPhoto.key;
    // Es tanca el modal abans de navegar: un <Modal> sempre queda per sobre de la pila
    onClose();
    navigation.navigate('ReportMedia', { refugeId, mediaKey });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    showAlert(
      t('media.viewer.deleteTitle'),
      t('media.viewer.deleteMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteMediaMutation.mutate(
              {
                refugeId,
                mediaKey: currentPhoto.key,
                experienceId: currentPhoto.experience_id,
                creatorUid: currentPhoto.creator_uid,
              },
              {
                onSuccess: () => {
                  if (onPhotoDeleted) {
                    onPhotoDeleted();
                  }
                  onClose();
                },
                onError: (error) => {
                  console.error('Error deleting photo:', error);
                  showAlert(t('common.error'), t('media.viewer.deleteError'));
                },
              }
            );
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ca-ES', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (!currentPhoto) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button (a l'esquerra: la dreta és per al menú ⋮) */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="photo-viewer-close">
          <CloseIcon width={24} height={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Menú ⋮ (Denunciar / Eliminar) */}
        {(canReport || canDelete) && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen((open) => !open)}
            testID="photo-menu-button"
            accessibilityLabel={t('media.viewer.moreOptions')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.menuButtonText}>⋮</Text>
            )}
          </TouchableOpacity>
        )}
        {menuOpen && (
          <View style={styles.menuDropdown} testID="photo-menu-dropdown">
            {canReport && (
              <TouchableOpacity style={styles.menuItem} onPress={handleReport} testID="photo-menu-report">
                <Text style={styles.menuItemText}>{t('media.viewer.report')}</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDelete}
                disabled={deleting}
                testID="photo-menu-delete"
              >
                <Text style={[styles.menuItemText, styles.menuItemDestructive]}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Photos scroll view */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {photos.map((photo, index) => (
            <View key={photo.key} style={styles.photoContainer}>
              {isVideoMedia(photo) ? (
                <VideoPlayer uri={photo.url} style={styles.photo} />
              ) : (
                <MediaImage media={photo} variant="full" style={styles.photo} contentFit="contain" />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Photo metadata */}
        {!hideMetadata && (
          <View style={styles.metadataContainer}>
            <View style={styles.metadataPill}>
              <View style={styles.creatorInfo}>
                {loadingCreator ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    {creator?.avatar_metadata?.url ? (
                      <Image
                        source={{ uri: creator.avatar_metadata.url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {creator?.username?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.creatorName}>
                      {creator?.username || t('media.viewer.anonymous')}
                    </Text>
                    <Text style={styles.separator}>·</Text>
                    <Text style={styles.date}>
                      {formatDate(currentPhoto.uploaded_at)}
                    </Text>
                  </>
                )}
              </View>
            </View>

          </View>
        )}

        {/* Page indicators removed as requested */}
      </View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    marginBottom: 40,
  },
  metadataContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataPill: {
    backgroundColor: 'rgba(31, 31, 31, 0.7)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    color: '#FFFFFF',
    fontSize: 11,
    marginHorizontal: 6,
  },
  date: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 11,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  menuDropdown: {
    position: 'absolute',
    top: 54,
    right: 12,
    zIndex: 12,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: '#111827',
  },
  menuItemDestructive: {
    color: '#DC2626',
  },
});
