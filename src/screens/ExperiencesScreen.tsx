import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { UserExperience } from '../components/UserExperience';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../hooks/useExperiencesQuery';
import { useDeleteRefugeMedia } from '../hooks/useRefugeMediaQuery';
import { useUser } from '../hooks/useUsersQuery';
import { Experience, ImageMetadata } from '../models';

// Icons
// @ts-ignore
import BackIcon from '../assets/icons/arrow-left.svg';
// @ts-ignore
import AddPhotoIcon from '../assets/icons/addPhoto-grey.png';

type ExperiencesScreenParams = {
  refugeId: string;
  refugeName: string;
};

// Component to render individual experience (avoids hook issues in loops)
const ExperienceItem: React.FC<{
  experience: Experience;
  onEdit: (experienceId: string, newComment: string, newFiles: File[]) => void;
  onDelete: (experienceId: string) => void;
  onPhotoPress: (photos: ImageMetadata[], index: number) => void;
}> = ({ experience, onEdit, onDelete, onPhotoPress }) => {
  const { data: user } = useUser(experience.creator_uid);

  return (
    <UserExperience
      user={user || null}
      experience={experience}
      onEdit={onEdit}
      onDelete={() => onDelete(experience.id)}
      onPhotoPress={onPhotoPress}
      refugeCreatorUid={experience.creator_uid}
    />
  );
};

export function ExperiencesScreen({ refugeId: refugeIdProp, refugeName: refugeNameProp, onClose }: { refugeId?: string; refugeName?: string; onClose?: () => void } = {}) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  // Try to get route params, but don't fail if not in a navigator
  let routeParams: ExperiencesScreenParams | undefined;
  try {
    const route = useRoute<RouteProp<{ params: ExperiencesScreenParams }, 'params'>>();
    routeParams = route.params;
  } catch (e) {
    // Component not inside navigator, use props instead
  }
  
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const refugeId = refugeIdProp || routeParams?.refugeId;
  const refugeName = refugeNameProp || routeParams?.refugeName;

  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<ImageMetadata[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [inputHeight, setInputHeight] = useState(44);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const HEADER_HEIGHT = 96;
  const MAX_INPUT_HEIGHT = 120; // Approx 6 lines

  // Hooks
  const { data: experiences, isLoading } = useExperiences(refugeId);
  const createExperienceMutation = useCreateExperience();
  const updateExperienceMutation = useUpdateExperience();
  const deleteExperienceMutation = useDeleteExperience();
  const deleteMediaMutation = useDeleteRefugeMedia();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  const handleAddPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert(t('common.error'), t('refuge.gallery.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map((asset) => {
          const uri = asset.uri;
          const name = uri.split('/').pop() || 'photo.jpg';
          const type = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';

          return {
            uri,
            name,
            type,
          } as any;
        });

        setSelectedFiles([...selectedFiles, ...files]);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      showAlert(t('common.error'), t('experiences.errors.selectPhotosError'));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!comment.trim() && selectedFiles.length === 0) return;

    // Check character limit
    if (comment.trim().length > 2000) {
      showAlert(
        t('common.error'), 
        t('experiences.errors.commentTooLong', { max: 2000 })
      );
      return;
    }

    // Create experience
    createExperienceMutation.mutate(
      {
        refuge_id: refugeId,
        comment: comment.trim(),
        files: selectedFiles,
      },
      {
        onSuccess: (data) => {
          setComment('');
          setSelectedFiles([]);
          setInputHeight(44);
          Keyboard.dismiss();

          if (data.failed_files && data.failed_files.length > 0) {
            showAlert(
              t('common.warning'),
              t('experiences.warnings.someFilesFailedToUpload')
            );
          }
        },
        onError: (error: any) => {
          showAlert(
            t('common.error'), 
            error.message || t('experiences.errors.createExperienceError')
          );
        },
      }
    );
  };

  const handleEdit = (experienceId: string, newComment: string, newFiles: File[]) => {
    // Check character limit
    if (newComment.trim().length > 2000) {
      showAlert(
        t('common.error'), 
        t('experiences.errors.commentTooLong', { max: 2000 })
      );
      return;
    }

    updateExperienceMutation.mutate(
      {
        experienceId,
        refugeId,
        request: {
          comment: newComment,
          files: newFiles.length > 0 ? newFiles : undefined,
        },
      },
      {
        onSuccess: (data) => {
          if (data.failed_files && data.failed_files.length > 0) {
            showAlert(
              t('common.warning'),
              t('experiences.warnings.someFilesFailedToUpload')
            );
          } else {
            showAlert(t('common.success'), t('experiences.updateSuccess'));
          }
        },
        onError: (error: any) => {
          showAlert(
            t('common.error'), 
            error.message || t('experiences.errors.updateExperienceError')
          );
        },
      }
    );
  };

  const handleDelete = (experienceId: string) => {
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
              { experienceId, refugeId },
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

  const handlePhotoPress = (photos: ImageMetadata[], index: number) => {
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(index);
    setPhotoModalVisible(true);
  };

  const handlePhotoDeleted = () => {
    setPhotoModalVisible(false);
    // React Query will handle cache invalidation
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    const newHeight = Math.min(Math.max(44, contentHeight + 16), MAX_INPUT_HEIGHT);
    setInputHeight(newHeight);
  };

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('experiences.title')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6900" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: HEADER_HEIGHT + 16,
                paddingBottom: 16,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Refuge name */}
            <Text style={styles.refugeName}>{refugeName}</Text>

            {/* Experiences list */}
            {experiences && experiences.length > 0 ? (
              experiences.map((experience) => (
                <ExperienceItem
                  key={experience.id}
                  experience={experience}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPhotoPress={handlePhotoPress}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('experiences.noExperiences')}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input area */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputContainer}>
            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filesPreviewContainer}
              >
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.filePreview}>
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.filePreviewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => handleRemoveFile(index)}
                    >
                      <Text style={styles.removeFileText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputFieldContainer}>
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={handleAddPhotos}
                >
                  <Image source={AddPhotoIcon} style={{ width: 28, height: 28 }} />
                </TouchableOpacity>
                
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { height: inputHeight }]}
                  placeholder={t('experiences.placeholder')}
                  placeholderTextColor="#9CA3AF"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={2000}
                  onContentSizeChange={(e) => 
                    handleContentSizeChange(
                      e.nativeEvent.contentSize.width,
                      e.nativeEvent.contentSize.height
                    )
                  }
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!comment.trim() && selectedFiles.length === 0) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={
                  (!comment.trim() && selectedFiles.length === 0) || 
                  createExperienceMutation.isPending
                }
              >
                {createExperienceMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendButtonText}>▶</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        visible={photoModalVisible}
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
        refugeId={refugeId}
        onClose={() => setPhotoModalVisible(false)}
        onPhotoDeleted={handlePhotoDeleted}
        hideMetadata={true}
        experienceCreatorUid={
          experiences?.find(exp => 
            exp.images_metadata?.some(img => 
              selectedPhotos.some(photo => photo.key === img.key)
            )
          )?.creator_uid
        }
      />

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
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1.2,
    borderBottomColor: '#e3e4e5ff',
    flexDirection: 'row',
    gap: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Arimo',
    color: '#111827',
    textAlign: 'left',
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  refugeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filesPreviewContainer: {
    marginBottom: 8,
    maxHeight: 90,
  },
  filePreview: {
    width: 70,
    height: 70,
    marginRight: 8,
    position: 'relative',
  },
  filePreviewImage: {
    width: 70,
    height: 70,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputFieldContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addPhotoButton: {
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 0,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
