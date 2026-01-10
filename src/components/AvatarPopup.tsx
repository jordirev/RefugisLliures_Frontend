import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useTranslation } from '../hooks/useTranslation';
import { UsersService } from '../services/UsersService';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './CustomAlert';

// Icons
import CrossIcon from '../assets/icons/x.svg';
import TrashIcon from '../assets/icons/trash.svg';
import EditWhiteIcon from '../assets/icons/edit-white.png';

interface AvatarPopupProps {
  visible: boolean;
  onClose: () => void;
  avatarUrl?: string | null;
  username?: string;
  uid: string;
  onAvatarUpdated?: () => void;
}

export function AvatarPopup({
  visible,
  onClose,
  avatarUrl,
  username,
  uid,
  onAvatarUpdated,
}: AvatarPopupProps) {
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getInitials = () => {
    if (!username) return '?';
    const parts = username.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleChangePhoto = async () => {
    try {
      // Comprovar si s'està executant amb Expo Go
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      
      // Per web, utilitzar expo-image-picker
      if (Platform.OS === 'web') {
        const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        let isGranted = currentPermission.status === 'granted';

        if (!isGranted) {
          const requestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          isGranted = requestResult.status === 'granted';
        }

        if (!isGranted) {
          showAlert(
            t('common.error'),
            t('profile.avatar.permissionMessage'),
            [{ text: t('common.ok'), onPress: hideAlert }]
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (result.canceled) {
          return;
        }

        const selectedImage = result.assets[0];
        setIsUploading(true);

        try {
          const fileUri = selectedImage.uri;
          const fileName = fileUri.split('/').pop() || 'avatar.jpg';
          const fileType = selectedImage.type === 'image' 
            ? `image/${fileName.split('.').pop()}`
            : 'image/jpeg';

          const response = await fetch(fileUri);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: fileType });

          await UsersService.uploadAvatar(uid, file);
          
          if (onAvatarUpdated) {
            onAvatarUpdated();
          }
          
          showAlert(
            t('profile.avatar.uploadSuccess'),
            t('profile.avatar.uploadSuccessMessage'),
            [{ text: t('common.ok'), onPress: () => { hideAlert(); onClose(); } }]
          );
        } catch (error: any) {
          console.error('Error uploading avatar:', error);
          showAlert(
            t('common.error'),
            error.message || t('profile.avatar.uploadError'),
            [{ text: t('common.ok'), onPress: hideAlert }]
          );
        } finally {
          setIsUploading(false);
        }
        return;
      }

      // Mòbil: comprovar si és Expo Go
      if (isExpoGo) {
        showAlert(
          t('profile.avatar.expoGoTitle', { defaultValue: 'Funcionalitat no disponible' }),
          t('profile.avatar.expoGoMessage', { defaultValue: 'La funcionalitat de canviar avatar amb cropper personalitzat no està disponible amb Expo Go. Si us plau, utilitza un Development Build per accedir a aquesta funcionalitat.' }),
          [{ text: t('common.ok'), onPress: hideAlert }]
        );
        return;
      }

      // Development Build: utilitzar react-native-image-crop-picker amb colors visibles
      const ImageCropPicker = require('react-native-image-crop-picker').default;
      const image = await ImageCropPicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        cropperToolbarTitle: t('profile.avatar.cropTitle', { defaultValue: 'Retalla la imatge' }),
        // Colors clars per fer els botons visibles
        cropperStatusBarColor: '#FFFFFF',
        cropperToolbarColor: '#FFFFFF',
        cropperActiveWidgetColor: '#FF6900',
        cropperToolbarWidgetColor: '#FF6900', // Color taronja per als botons
        freeStyleCropEnabled: false,
        compressImageQuality: 0.8,
        includeBase64: false,
        mediaType: 'photo',
      });

      setIsUploading(true);
      
      try {
        const fileUri = image.path;
        const fileName = fileUri.split('/').pop() || 'avatar.jpg';
        const fileType = image.mime || 'image/jpeg';

        const file = {
          uri: fileUri,
          name: fileName,
          type: fileType,
        } as any;

        await UsersService.uploadAvatar(uid, file);
        
        if (onAvatarUpdated) {
          onAvatarUpdated();
        }
        
        showAlert(
          t('profile.avatar.uploadSuccess'),
          t('profile.avatar.uploadSuccessMessage'),
          [{ text: t('common.ok'), onPress: () => { hideAlert(); onClose(); } }]
        );
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        showAlert(
          t('common.error'),
          error.message || t('profile.avatar.uploadError'),
          [{ text: t('common.ok'), onPress: hideAlert }]
        );
      } finally {
        setIsUploading(false);
      }
    } catch (error: any) {
      if (error.code === 'E_PICKER_CANCELLED') {
        return;
      }
      
      console.error('Error selecting image:', error);
      showAlert(
        t('common.error'),
        error.message || t('profile.avatar.selectError'),
        [{ text: t('common.ok'), onPress: hideAlert }]
      );
    }
  };

  const handleDeletePhoto = () => {
    showAlert(
      t('profile.avatar.deleteConfirmTitle'),
      t('profile.avatar.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: hideAlert },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            setIsDeleting(true);
            try {
              await UsersService.deleteAvatar(uid);
              
              // Notificar l'actualització
              if (onAvatarUpdated) {
                onAvatarUpdated();
              }
              
              showAlert(
                t('profile.avatar.deleteSuccess'),
                t('profile.avatar.deleteSuccessMessage'),
                [{ text: t('common.ok'), onPress: () => { hideAlert(); onClose(); } }]
              );
            } catch (error: any) {
              console.error('Error deleting avatar:', error);
              showAlert(
                t('common.error'),
                error.message || t('profile.avatar.deleteError'),
                [{ text: t('common.ok'), onPress: hideAlert }]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          {/* Close button at top corner */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CrossIcon width={32} height={32} color="#fff" />
          </TouchableOpacity>

          {/* Avatar display */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{getInitials()}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            {/* Change photo button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleChangePhoto}
              disabled={isUploading || isDeleting}
            >
              {isUploading ? (
                <ActivityIndicator color="#374151" size="small" />
              ) : (
                <>
                  <Image source={EditWhiteIcon} style={{ width: 20, height: 20 }} />
                  <Text style={styles.buttonText}>{t('profile.avatar.changePhoto')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Delete photo button */}
            {avatarUrl && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeletePhoto}
                disabled={isUploading || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#374151" size="small" />
                ) : (
                  <>
                    <TrashIcon width={20} height={20} color="#ffffffff" />
                    <Text style={[styles.buttonText, {color: '#ff0000'}]}>{t('profile.avatar.deletePhoto')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* CustomAlert for confirmations and errors */}
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
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  avatarCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6900',
  },
  avatarPlaceholderText: {
    fontSize: 60,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    minHeight: 50,
    backgroundColor: '#2b2b2bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  deleteButton: {
    // Additional styles for delete button if needed
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Arimo',
  },
});
