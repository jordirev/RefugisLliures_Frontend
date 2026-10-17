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
import Constants from 'expo-constants';
import { useTranslation } from '../hooks/useTranslation';
import { UsersService } from '../services/UsersService';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './CustomAlert';
import { useMediaUpload, getFailureReasonKey } from '../hooks/useMediaUpload';
import { RightsDeclarationModal } from './RightsDeclarationModal';
import type { PickedAsset } from '../services/MediaUploadService';

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
  const [isDeleting, setIsDeleting] = useState(false);
  // Pujada amb target=avatar (només imatges): drets → compressió → intents → PUT → confirm
  const { pickAndUpload, ensureRightsConfirmed, isUploading, rightsModalProps } = useMediaUpload({ showAlert });

  const getInitials = () => {
    if (!username) return '?';
    const parts = username.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleChangePhoto = async () => {
    try {
      // Development build: retall circular amb react-native-image-crop-picker.
      // Web i Expo Go: expo-image-picker (dins de useMediaUpload.pickMedia).
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      let assets: PickedAsset[] | undefined;

      if (Platform.OS !== 'web' && !isExpoGo) {
        const accepted = await ensureRightsConfirmed();
        if (!accepted) return;

        const ImageCropPicker = require('react-native-image-crop-picker').default;
        const image = await ImageCropPicker.openPicker({
          width: 512,
          height: 512,
          cropping: true,
          cropperCircleOverlay: true,
          cropperToolbarTitle: t('profile.avatar.cropTitle', { defaultValue: 'Retalla la imatge' }),
          // Colors clars per fer els botons visibles
          cropperStatusBarColor: '#FFFFFF',
          cropperToolbarColor: '#FFFFFF',
          cropperActiveWidgetColor: '#FF6900',
          cropperToolbarWidgetColor: '#FF6900', // Color taronja per als botons
          freeStyleCropEnabled: false,
          compressImageQuality: 0.9,
          includeBase64: false,
          mediaType: 'photo',
        });
        assets = [
          {
            uri: image.path,
            mimeType: image.mime,
            fileName: image.filename || image.path?.split('/').pop(),
            fileSize: image.size,
            width: image.width,
            height: image.height,
          },
        ];
      }

      const result = await pickAndUpload(
        { target: 'avatar', uid },
        { imagesOnly: true, multiple: false, assets },
        { showResultAlert: false }
      );
      if (!result) return; // cancel·lat o error (el hook ja ha mostrat l'avís)

      if (result.uploaded.length > 0) {
        if (onAvatarUpdated) {
          onAvatarUpdated();
        }
        showAlert(
          t('profile.avatar.uploadSuccess'),
          t('profile.avatar.uploadSuccessMessage'),
          [{ text: t('common.ok'), onPress: () => { hideAlert(); onClose(); } }]
        );
      } else {
        const reason = result.failed[0]?.reason;
        showAlert(
          t('common.error'),
          `${t('profile.avatar.uploadError')}\n${t(getFailureReasonKey(reason))}`,
          [{ text: t('common.ok'), onPress: hideAlert }]
        );
      }
    } catch (error: any) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        return;
      }
      
      console.error('Error selecting image:', error);
      showAlert(
        t('common.error'),
        t('profile.avatar.selectError'),
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

      {/* Declaració de drets (1 cop per sessió) */}
      <RightsDeclarationModal {...rightsModalProps} />

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
