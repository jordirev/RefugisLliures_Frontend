/**
 * Hook únic de pujada de mitjans (refugi, experiència i avatar).
 *
 * selecció → declaració de drets (1 cop per sessió) → llista blanca → compressió →
 * upload-intents → PUT directe → confirm → invalidacions de React Query.
 *
 * Substitueix les còpies duplicades de RefugeDetailScreen / QuickActionsMenu,
 * la pujada multipart de les experiències i la de l'avatar.
 */

import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from './useTranslation';
import { invalidateMediaQueries } from './mediaInvalidation';

export { invalidateMediaQueries };
import {
  MediaUploadService,
  MediaUploadError,
  MediaUploadResult,
  PickedAsset,
  PreparedMediaFile,
  UploadTarget,
  MAX_FILES_PER_INTENT,
  AVATAR_MAX_LONG_EDGE,
  MAX_VIDEO_DURATION_SECONDS,
} from '../services/MediaUploadService';

type AlertButton = { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
type ShowAlert = (title: string | undefined, message: string, buttons?: AlertButton[]) => void;

export interface UploadMediaVariables {
  target: UploadTarget;
  refugeId?: string;
  experienceId?: string;
  /** UID de l'usuari actual (per invalidar `['users','detail',uid]`) */
  uid?: string;
  files: PreparedMediaFile[];
}

export interface PickMediaOptions {
  /** Només imatges (avatar) */
  imagesOnly?: boolean;
  /** Selecció múltiple (per defecte true) */
  multiple?: boolean;
  /** Assets ja seleccionats (p. ex. del crop-picker): se salta el picker */
  assets?: PickedAsset[];
}

/**
 * Clau i18n per a un codi d'error de pujada (client o backend)
 */
export function getUploadErrorKey(code?: string | null): string {
  switch (code) {
    case 'invalid_type':
      return 'media.errors.invalidType';
    case 'too_large':
      return 'media.errors.tooLarge';
    case 'too_long':
      return 'media.errors.tooLong';
    case 'too_many_files':
      return 'media.errors.tooManyFiles';
    case 'age_not_confirmed':
      return 'media.errors.ageNotConfirmed';
    case 'user_blocked':
      return 'media.errors.userBlocked';
    case 'not_owner':
      return 'media.errors.notOwner';
    case 'not_found':
      return 'media.errors.notFound';
    default:
      return 'media.errors.uploadFailed';
  }
}

/**
 * Clau i18n per al motiu d'una fallada del confirm
 */
export function getFailureReasonKey(reason?: string | null): string {
  switch (reason) {
    case 'missing_object':
    case 'too_large':
    case 'invalid_type':
    case 'processing_error':
    case 'moderation_blocked':
    case 'put_failed':
      return `media.failureReasons.${reason}`;
    default:
      return 'media.failureReasons.unknown';
  }
}

export function useMediaUpload(options: { showAlert?: ShowAlert } = {}) {
  const { showAlert } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [rightsModalVisible, setRightsModalVisible] = useState(false);
  const rightsResolver = useRef<((accepted: boolean) => void) | null>(null);

  const alert = useCallback(
    (title: string, message: string) => {
      if (showAlert) showAlert(title, message);
      else console.warn(`[useMediaUpload] ${title}: ${message}`);
    },
    [showAlert]
  );

  const mutation = useMutation({
    mutationFn: async (variables: UploadMediaVariables): Promise<MediaUploadResult> => {
      setProgress(0);
      return MediaUploadService.uploadFiles({
        target: variables.target,
        refugeId: variables.refugeId,
        experienceId: variables.experienceId,
        files: variables.files,
        onProgress: setProgress,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateMediaQueries(queryClient, { refugeId: variables.refugeId, uid: variables.uid });
    },
  });

  /* ---------------------- Declaració de drets ---------------------- */

  const ensureRightsConfirmed = useCallback((): Promise<boolean> => {
    if (MediaUploadService.hasConfirmedRightsThisSession()) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      rightsResolver.current = resolve;
      setRightsModalVisible(true);
    });
  }, []);

  const resolveRights = useCallback((accepted: boolean) => {
    if (accepted) MediaUploadService.confirmRightsForSession();
    setRightsModalVisible(false);
    const resolver = rightsResolver.current;
    rightsResolver.current = null;
    resolver?.(accepted);
  }, []);

  const rightsModalProps = {
    visible: rightsModalVisible,
    onAccept: () => resolveRights(true),
    onCancel: () => resolveRights(false),
  };

  /* --------------------------- Errors ------------------------------ */

  const handleUploadError = useCallback(
    (error: unknown) => {
      const code = error instanceof MediaUploadError || (error as any)?.code ? (error as any).code : null;
      const title =
        code === 'user_blocked' || code === 'age_not_confirmed' || code === 'not_owner'
          ? t('media.errors.notAllowedTitle')
          : t('common.error');
      alert(title, t(getUploadErrorKey(code), { max: MAX_FILES_PER_INTENT, seconds: MAX_VIDEO_DURATION_SECONDS }));
    },
    [alert, t]
  );

  /* ---------------------- Preparació d'assets ---------------------- */

  /**
   * Valida i comprimeix una llista d'assets. Els rebutjats no s'envien mai.
   * Mostra un únic avís amb el resum dels rebutjats.
   */
  const prepareAssets = useCallback(
    async (assets: PickedAsset[], prepOptions: { imagesOnly?: boolean } = {}) => {
      const prepared: PreparedMediaFile[] = [];
      const rejections: Record<string, number> = {};

      for (const asset of assets) {
        try {
          const file = await MediaUploadService.prepareAsset(asset, {
            imagesOnly: prepOptions.imagesOnly,
            maxImageEdge: prepOptions.imagesOnly ? AVATAR_MAX_LONG_EDGE : undefined,
          });
          prepared.push(file);
        } catch (error: any) {
          const code = error?.code || 'compression_failed';
          rejections[code] = (rejections[code] || 0) + 1;
        }
      }

      const rejectedCodes = Object.keys(rejections);
      if (rejectedCodes.length > 0) {
        const lines = rejectedCodes.map(
          (code) =>
            `• ${t(getUploadErrorKey(code), { max: MAX_FILES_PER_INTENT, seconds: MAX_VIDEO_DURATION_SECONDS })} (${rejections[code]})`
        );
        alert(t('media.errors.rejectedTitle'), lines.join('\n'));
      }
      return prepared;
    },
    [alert, t]
  );

  /**
   * Obre el selector (només imatges i vídeos; només imatges per a l'avatar), demana la
   * declaració de drets si cal i retorna els fitxers validats i comprimits.
   * Retorna null si l'usuari cancel·la.
   */
  const pickMedia = useCallback(
    async (pickOptions: PickMediaOptions = {}): Promise<PreparedMediaFile[] | null> => {
      const { imagesOnly = false, multiple = true } = pickOptions;

      const accepted = await ensureRightsConfirmed();
      if (!accepted) return null;

      let assets: PickedAsset[] | undefined = pickOptions.assets;
      if (!assets) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          alert(t('media.permissions.title'), t('media.permissions.message'));
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: imagesOnly ? ['images'] : ['images', 'videos'],
          allowsMultipleSelection: multiple,
          selectionLimit: multiple ? MAX_FILES_PER_INTENT : 1,
          videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
          quality: 1, // la compressió la fem nosaltres
          ...(Platform.OS === 'ios' && {
            presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          }),
        });

        if (result.canceled || !result.assets || result.assets.length === 0) return null;
        assets = result.assets as PickedAsset[];
      }

      if (assets.length > MAX_FILES_PER_INTENT) {
        alert(t('common.error'), t('media.errors.tooManyFiles', { max: MAX_FILES_PER_INTENT }));
        assets = assets.slice(0, MAX_FILES_PER_INTENT);
      }

      setIsPreparing(true);
      try {
        return await prepareAssets(assets, { imagesOnly });
      } finally {
        setIsPreparing(false);
      }
    },
    [alert, ensureRightsConfirmed, prepareAssets, t]
  );

  /**
   * Puja fitxers ja preparats i mostra el resultat. Retorna null si hi ha hagut un error global.
   */
  const uploadPrepared = useCallback(
    async (
      variables: UploadMediaVariables,
      uploadOptions: { showResultAlert?: boolean } = {}
    ): Promise<MediaUploadResult | null> => {
      const { showResultAlert = true } = uploadOptions;
      if (variables.files.length === 0) return null;
      try {
        const result = await mutation.mutateAsync(variables);
        if (showResultAlert) {
          if (result.failed.length === 0) {
            alert(t('common.success'), t('media.upload.success', { count: result.uploaded.length }));
          } else {
            const reasons = Array.from(new Set(result.failed.map((f) => t(getFailureReasonKey(f.reason)))));
            alert(
              result.uploaded.length > 0 ? t('common.warning') : t('common.error'),
              t('media.upload.partial', {
                uploaded: result.uploaded.length,
                failed: result.failed.length,
              }) + `\n${reasons.map((r) => `• ${r}`).join('\n')}`
            );
          }
        }
        return result;
      } catch (error) {
        console.error('[useMediaUpload] Error pujant mitjans:', error);
        handleUploadError(error);
        return null;
      }
    },
    [alert, handleUploadError, mutation, t]
  );

  /**
   * Selecció + pujada en un sol pas (refugi i avatar)
   */
  const pickAndUpload = useCallback(
    async (
      variables: Omit<UploadMediaVariables, 'files'>,
      pickOptions: PickMediaOptions = {},
      uploadOptions: { showResultAlert?: boolean } = {}
    ): Promise<MediaUploadResult | null> => {
      try {
        const files = await pickMedia({
          ...pickOptions,
          imagesOnly: pickOptions.imagesOnly ?? variables.target === 'avatar',
          multiple: pickOptions.multiple ?? variables.target !== 'avatar',
        });
        if (!files || files.length === 0) return null;
        return await uploadPrepared({ ...variables, files }, uploadOptions);
      } catch (error) {
        console.error('[useMediaUpload] Error seleccionant mitjans:', error);
        handleUploadError(error);
        return null;
      }
    },
    [handleUploadError, pickMedia, uploadPrepared]
  );

  return {
    pickMedia,
    prepareAssets,
    uploadPrepared,
    pickAndUpload,
    ensureRightsConfirmed,
    handleUploadError,
    rightsModalProps,
    progress,
    isPreparing,
    isUploading: isPreparing || mutation.isPending,
    mutation,
  };
}
