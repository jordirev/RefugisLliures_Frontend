import React, { useState, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '../contexts/AuthContext';
import { ImageMetadata } from '../models';
import { RefugeMediaService } from '../services/RefugeMediaService';
import { UsersService } from '../services/UsersService';
import { useQuery } from '@tanstack/react-query';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

// Icons
// @ts-ignore
import CloseIcon from '../assets/icons/x.svg';
// @ts-ignore
import TrashIcon from '../assets/icons/trash.svg';

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

// Helper function to check if a media is a video based on URL extension
const isVideo = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const [deleting, setDeleting] = useState(false);
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

  const currentPhoto = photos[currentIndex];

  // Obtenir informació del creador de la foto actual
  const { data: creator, isLoading: loadingCreator } = useQuery({
    queryKey: ['user', currentPhoto?.creator_uid],
    queryFn: async () => {
      if (!currentPhoto?.creator_uid) return null;
      return await UsersService.getUserByUid(currentPhoto.creator_uid);
    },
    enabled: !!currentPhoto?.creator_uid && !hideMetadata,
  });

  // Si és des d'una experiència, comprovar si l'usuari és el creador de l'experiència
  const isOwner = experienceCreatorUid 
    ? firebaseUser?.uid === experienceCreatorUid
    : firebaseUser?.uid === currentPhoto?.creator_uid;

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
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
    }
  };

  const handleDelete = async () => {
    showAlert(
      'Eliminar fotografia',
      'Estàs segur que vols eliminar aquesta fotografia? Aquesta acció no es pot desfer.',
      [
        {
          text: 'Cancel·lar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await RefugeMediaService.deleteRefugeMedia(refugeId, currentPhoto.key);
              if (onPhotoDeleted) {
                onPhotoDeleted();
              }
              onClose();
            } catch (error) {
              console.error('Error deleting photo:', error);
              showAlert('Error', 'No s\'ha pogut eliminar la fotografia');
            } finally {
              setDeleting(false);
            }
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
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CloseIcon width={24} height={24} color="#FFFFFF" />
        </TouchableOpacity>

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
              {isVideo(photo.url) ? (
                <VideoPlayer uri={photo.url} style={styles.photo} />
              ) : (
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photo}
                  resizeMode="contain"
                />
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
                      {creator?.username || 'Anònim'}
                    </Text>
                    <Text style={styles.separator}>·</Text>
                    <Text style={styles.date}>
                      {formatDate(currentPhoto.uploaded_at)}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Delete button (only if owner) - when metadata visible */}
            {isOwner && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <TrashIcon width={20} height={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Delete button (only if owner) - when metadata hidden */}
        {hideMetadata && isOwner && (
          <View style={styles.deleteButtonContainerNoMetadata}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <TrashIcon width={20} height={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
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
    right: 10,
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 31, 31, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonContainerNoMetadata: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
});
