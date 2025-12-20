import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageMetadata } from '../models';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { useTranslation } from '../hooks/useTranslation';

// Icons
// @ts-ignore
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';

interface GalleryScreenProps {
  photos: ImageMetadata[];
  refugeId: string;
  refugeName: string;
  onBack: () => void;
  onPhotoDeleted?: () => void;
  onAddPhotos?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding

export function GalleryScreen({
  photos,
  refugeId,
  refugeName,
  onBack,
  onPhotoDeleted,
  onAddPhotos,
}: GalleryScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerVisible(true);
  };

  const handlePhotoDeleted = () => {
    setViewerVisible(false);
    if (onPhotoDeleted) {
      onPhotoDeleted();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Fixed header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeftIcon width={24} height={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('refuge.gallery.title')}</Text>
          <Text style={styles.headerSubtitle}>{refugeName}</Text>
        </View>
      </View>

      {/* Content */}
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('refuge.gallery.noPhotos')}</Text>
          {onAddPhotos && (
            <TouchableOpacity
              style={styles.addPhotosButton}
              onPress={onAddPhotos}
              activeOpacity={0.8}
            >
              <Text style={styles.addPhotosButtonText}>{t('refuge.gallery.addPhotosButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.key}
                style={styles.photoItem}
                onPress={() => handlePhotoPress(index)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Photo viewer modal */}
      {photos.length > 0 && (
        <PhotoViewerModal
          visible={viewerVisible}
          photos={photos}
          initialIndex={selectedPhotoIndex}
          refugeId={refugeId}
          onClose={() => setViewerVisible(false)}
          onPhotoDeleted={handlePhotoDeleted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addPhotosButton: {
    backgroundColor: '#FF6900',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addPhotosButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});
