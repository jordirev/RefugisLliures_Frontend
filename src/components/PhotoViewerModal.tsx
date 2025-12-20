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
import { useAuth } from '../contexts/AuthContext';
import { ImageMetadata } from '../models';
import { RefugeMediaService } from '../services/RefugeMediaService';
import { UsersService } from '../services/UsersService';
import { useQuery } from '@tanstack/react-query';

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
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PhotoViewerModal({
  visible,
  photos,
  initialIndex,
  refugeId,
  onClose,
  onPhotoDeleted,
}: PhotoViewerModalProps) {
  const { firebaseUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const [deleting, setDeleting] = useState(false);

  const currentPhoto = photos[currentIndex];

  // Obtenir informació del creador de la foto actual
  const { data: creator, isLoading: loadingCreator } = useQuery({
    queryKey: ['user', currentPhoto?.creator_uid],
    queryFn: async () => {
      if (!currentPhoto?.creator_uid) return null;
      return await UsersService.getUserByUid(currentPhoto.creator_uid);
    },
    enabled: !!currentPhoto?.creator_uid,
  });

  const isOwner = firebaseUser?.uid === currentPhoto?.creator_uid;

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
    Alert.alert(
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
              Alert.alert('Error', 'No s\'ha pogut eliminar la fotografia');
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
    return date.toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
              <Image
                source={{ uri: photo.url }}
                style={styles.photo}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Photo metadata */}
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

          {/* Delete button (only if owner) */}
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

        {/* Page indicators removed as requested */}
      </View>
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
  },
  metadataContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flex: 1,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
