import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User, Experience, ImageMetadata } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { VideoThumbnail } from './PhotoViewerModal';

// Icons
// @ts-ignore
import AddPhotoIcon from '../assets/icons/photo-plus.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = 120; // Quadrat petit
const IMAGE_HEIGHT = 120; // Quadrat petit

interface UserExperienceProps {
  user: User | null;
  experience: Experience;
  isAnswer?: boolean;
  onEdit?: (experienceId: string, newComment: string, newFiles: File[]) => void;
  onDelete?: () => void;
  onPhotoPress: (photos: ImageMetadata[], index: number) => void;
  refugeCreatorUid?: string; // UID del creador de l'experiència per PhotoViewerModal
}

// Helper to check if URL is a video
const isVideo = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

export function UserExperience({
  user,
  experience,
  isAnswer = false,
  onEdit,
  onDelete,
  onPhotoPress,
  refugeCreatorUid,
}: UserExperienceProps) {
  const { t } = useTranslation();
  const { backendUser: currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(experience.comment);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return 'Sense data';

    try {
      // Agafa només la part de la data (primer 10 caràcters si ve amb hora)
      const datePart = dateString.substring(0, 10);

      // Si ve en format yyyy-mm-dd, converteix a dd-mm-yyyy
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year}`;
      }

      // Per qualsevol altre cas, intenta parsejar com a data
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }

      return 'Sense data'; // Retorna text per defecte si no es pot parsejar
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Sense data';
    }
  };

  const shouldTruncate = experience.comment.length > 150;
  const displayMessage = shouldTruncate && !isExpanded && !isEditing 
    ? `${experience.comment.substring(0, 150)}...` 
    : experience.comment;
  const isCreator = currentUser?.uid === experience.creator_uid;

  const images = experience.images_metadata || [];
  const totalImages = images.length;

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    if (index !== currentImageIndex && index >= 0 && index < totalImages) {
      setCurrentImageIndex(index);
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
    setEditedComment(experience.comment);
    setNewFiles([]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedComment(experience.comment);
    setNewFiles([]);
  };

  const handleConfirmEdit = () => {
    if (onEdit) {
      onEdit(experience.id, editedComment, newFiles);
    }
    setIsEditing(false);
    setNewFiles([]);
  };

  const handleAddPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert(t('refuge.gallery.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map((asset) => {
          // Convert to File-like object
          const uri = asset.uri;
          const name = uri.split('/').pop() || 'photo.jpg';
          const type = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';

          return {
            uri,
            name,
            type,
          } as any;
        });

        setNewFiles([...newFiles, ...files]);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const hasChanges = editedComment !== experience.comment || newFiles.length > 0;

  return (
    <View style={[styles.container, isAnswer && styles.answerContainer]}>
      {/* Top row: avatar, name, date */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {user?.avatar_metadata?.url ? (
            <Image source={{ uri: user.avatar_metadata.url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {user?.username || t('common.unknown')}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(experience.modified_at)}</Text>
        </View>
      </View>

      {/* Message content */}
      <View style={styles.messageContainer}>
        {isEditing ? (
          <>
            <TextInput
              style={styles.editInput}
              value={editedComment}
              onChangeText={setEditedComment}
              multiline
              maxLength={2000}
            />
            <Text style={styles.characterCount}>
              {editedComment.length} / 2000
            </Text>
          </>
        ) : (
          <Text style={styles.messageText}>{displayMessage}</Text>
        )}
      </View>

      {/* Photo carousel */}
      {totalImages > 0 && (
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.key}
                activeOpacity={0.9}
                onPress={() => onPhotoPress(images, index)}
                style={styles.imageContainer}
              >
                {isVideo(image.url) ? (
                  <>
                    <VideoThumbnail uri={image.url} style={styles.carouselImage} />
                    <View style={styles.videoOverlay}>
                      <View style={styles.playIconContainer}>
                        <Text style={styles.playIcon}>▶</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Image
                    source={{ uri: image.url }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* New files preview (when editing) */}
      {isEditing && newFiles.length > 0 && (
        <View style={styles.newFilesContainer}>
          <Text style={styles.newFilesLabel}>{t('experiences.newPhotos')}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {newFiles.map((file, index) => (
              <View key={index} style={styles.newFilePreview}>
                <Image
                  source={{ uri: file.uri }}
                  style={styles.newFileImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => handleRemoveNewFile(index)}
                >
                  <Text style={styles.removeFileText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Edit mode info */}
      {isEditing && (
        <View style={styles.editInfoContainer}>
          <Text style={styles.editInfoText}>
            {t('experiences.deletePhotoInfo')}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        {!isEditing && shouldTruncate && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              {isExpanded ? t('common.readLess') : t('common.readMore')}
            </Text>
          </TouchableOpacity>
        )}
        
        {isCreator && !isEditing && (
          <>
            <TouchableOpacity onPress={handleEditPress} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isEditing && (
          <>
            <TouchableOpacity onPress={handleAddPhotos} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{t('experiences.addPhotos')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            {hasChanges && (
              <TouchableOpacity onPress={handleConfirmEdit} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  answerContainer: {
    marginLeft: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  dateContainer: {
    marginLeft: 'auto',
    paddingLeft: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  messageContainer: {
    paddingLeft: 44,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  editInput: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  carouselContainer: {
    marginLeft: 44,
    marginBottom: 8,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    marginRight: 12, // Més separació entre imatges
  },
  carouselImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 8, // Bores arrodonides però menys pronunciades per imatges petites
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8, // Coincideix amb carouselImage
  },
  playIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
    color: '#e0e0e0ff',
  },
  newFilesContainer: {
    paddingLeft: 44,
    marginBottom: 8,
  },
  newFilesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  newFilePreview: {
    width: 80,
    height: 80,
    marginRight: 8,
    position: 'relative',
  },
  newFileImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeFileButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editInfoContainer: {
    paddingLeft: 44,
    marginBottom: 8,
  },
  editInfoText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingLeft: 44,
    gap: 16,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 4,
  },
  confirmButtonText: {
    fontSize: 13,
    color: '#FF6900',
    fontWeight: '600',
  },
});
