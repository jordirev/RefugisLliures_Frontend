/**
 * Tests unitaris del hook useMediaUpload
 *
 * Cobreix:
 * - Declaració de drets abans de la primera pujada de la sessió
 * - Picker només amb imatges i vídeos (avatar: només imatges)
 * - Fitxers fora de la llista blanca: avís i no s'envien
 * - Invalidacions de React Query (registre queryKeys)
 * - Errors amb codi (user_blocked, age_not_confirmed, not_owner) i fallades parcials
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useMediaUpload } from '../../../hooks/useMediaUpload';
import { MediaUploadService, MediaUploadError } from '../../../services/MediaUploadService';

const mockedPicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('useMediaUpload', () => {
  let queryClient: QueryClient;
  let uploadSpy: jest.SpyInstance;
  const showAlert = jest.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const renderUpload = async () => await renderHook(() => useMediaUpload({ showAlert }), { wrapper });

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    MediaUploadService.resetSessionRights();
    showAlert.mockClear();
    mockedPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockedPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///photo.jpg', mimeType: 'image/jpeg', width: 4000, height: 3000 },
        { uri: 'file:///doc.pdf', mimeType: 'application/pdf' },
      ],
    } as any);
    uploadSpy = jest.spyOn(MediaUploadService, 'uploadFiles').mockResolvedValue({
      uploaded: [{ key: 'k1', url: 'u', uploaded_at: 'd', creator_uid: 'me' }],
      failed: [],
    });
  });

  afterEach(() => {
    uploadSpy.mockRestore();
    queryClient.clear();
  });

  /** Accepta la declaració de drets quan el hook la demana */
  const acceptRightsWhenAsked = async (result: any) => {
    await waitFor(() => expect(result.current.rightsModalProps.visible).toBe(true));
    await act(() => {
      result.current.rightsModalProps.onAccept();
    });
  };

  it('demana la declaració de drets abans de la primera pujada i no la torna a demanar', async () => {
    const { result } = await renderUpload();

    let promise: Promise<any>;
    await act(() => {
      promise = result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1', uid: 'me' });
    });
    await acceptRightsWhenAsked(result);
    await act(async () => {
      await promise;
    });
    expect(MediaUploadService.hasConfirmedRightsThisSession()).toBe(true);

    // Segona pujada: no es torna a mostrar el modal
    await act(async () => {
      await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1', uid: 'me' });
    });
    expect(result.current.rightsModalProps.visible).toBe(false);
    expect(uploadSpy).toHaveBeenCalledTimes(2);
  });

  it('si es cancel·la la declaració no obre el picker ni puja res', async () => {
    const { result } = await renderUpload();
    let promise: Promise<any>;
    await act(() => {
      promise = result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1' });
    });
    await waitFor(() => expect(result.current.rightsModalProps.visible).toBe(true));
    await act(() => {
      result.current.rightsModalProps.onCancel();
    });
    let value: any;
    await act(async () => {
      value = await promise;
    });
    expect(value).toBeNull();
    expect(mockedPicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('obre el picker només amb imatges i vídeos, descarta fitxers no permesos i puja la resta', async () => {
    MediaUploadService.confirmRightsForSession();
    const { result } = await renderUpload();

    await act(async () => {
      await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1', uid: 'me' });
    });

    expect(mockedPicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 10 })
    );
    // El PDF s'ha rebutjat abans de crear cap intent
    expect(showAlert).toHaveBeenCalledWith('media.errors.rejectedTitle', expect.stringContaining('media.errors.invalidType'));
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const variables = uploadSpy.mock.calls[0][0];
    expect(variables.target).toBe('refuge');
    expect(variables.refugeId).toBe('r1');
    expect(variables.files).toHaveLength(1);
    expect(variables.files[0]).toEqual(expect.objectContaining({ contentType: 'image/webp', mediaType: 'image' }));
  });

  it('invalida refugi, mitjans, experiències, llista i usuari després de pujar', async () => {
    MediaUploadService.confirmRightsForSession();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = await renderUpload();

    await act(async () => {
      await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1', uid: 'me' });
    });

    const keys = invalidateSpy.mock.calls.map((c: any) => c[0].queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ['refuges', 'detail', 'r1'],
        ['refugeMedia', 'r1'],
        ['experiences', 'refuge', 'r1'],
        ['refuges', 'list'],
        ['users', 'detail', 'me'],
      ])
    );
    expect(showAlert).toHaveBeenCalledWith('common.success', 'media.upload.success');
  });

  it('avatar: picker només d\'imatges i selecció única', async () => {
    MediaUploadService.confirmRightsForSession();
    mockedPicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///me.png', mimeType: 'image/png', width: 600, height: 600 }],
    } as any);
    const { result } = await renderUpload();

    await act(async () => {
      await result.current.pickAndUpload({ target: 'avatar', uid: 'me' });
    });

    expect(mockedPicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images'], allowsMultipleSelection: false, selectionLimit: 1 })
    );
    expect(uploadSpy.mock.calls[0][0].target).toBe('avatar');
  });

  it('avatar: un vídeo passat com a asset es rebutja', async () => {
    MediaUploadService.confirmRightsForSession();
    const { result } = await renderUpload();
    let value: any;
    await act(async () => {
      value = await result.current.pickAndUpload(
        { target: 'avatar', uid: 'me' },
        { assets: [{ uri: 'file:///clip.mp4', mimeType: 'video/mp4' }] }
      );
    });
    expect(value).toBeNull();
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['user_blocked', 'media.errors.userBlocked'],
    ['age_not_confirmed', 'media.errors.ageNotConfirmed'],
    ['not_owner', 'media.errors.notOwner'],
  ])('mostra una alerta específica per al codi %s', async (code, key) => {
    MediaUploadService.confirmRightsForSession();
    uploadSpy.mockRejectedValueOnce(new MediaUploadError('forbidden', code, 403));
    const { result } = await renderUpload();

    let value: any;
    await act(async () => {
      value = await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1' });
    });

    expect(value).toBeNull();
    expect(showAlert).toHaveBeenCalledWith('media.errors.notAllowedTitle', key);
  });

  it('429 too_many_pending_uploads: alerta clara i cap reintent automàtic', async () => {
    MediaUploadService.confirmRightsForSession();
    uploadSpy.mockRejectedValueOnce(new MediaUploadError('Massa pujades', 'too_many_pending_uploads', 429));
    const { result } = await renderUpload();

    let value: any;
    await act(async () => {
      value = await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1' });
    });

    expect(value).toBeNull();
    expect(showAlert).toHaveBeenCalledWith('common.error', 'media.errors.tooManyPendingUploads');
    expect(uploadSpy).toHaveBeenCalledTimes(1);
  });

  it('mostra els motius de les fallades parcials del confirm', async () => {
    MediaUploadService.confirmRightsForSession();
    uploadSpy.mockResolvedValueOnce({
      uploaded: [],
      failed: [{ upload_id: 'u1', reason: 'moderation_blocked' }],
    });
    const { result } = await renderUpload();

    await act(async () => {
      await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1' });
    });

    expect(showAlert).toHaveBeenCalledWith(
      'common.error',
      expect.stringContaining('media.failureReasons.moderation_blocked')
    );
  });

  it('permís de galeria denegat: avís i cap pujada', async () => {
    MediaUploadService.confirmRightsForSession();
    mockedPicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);
    const { result } = await renderUpload();

    await act(async () => {
      await result.current.pickAndUpload({ target: 'refuge', refugeId: 'r1' });
    });

    expect(showAlert).toHaveBeenCalledWith('media.permissions.title', 'media.permissions.message');
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('pickMedia retorna els fitxers preparats sense pujar-los (experiències)', async () => {
    MediaUploadService.confirmRightsForSession();
    const { result } = await renderUpload();
    let files: any;
    await act(async () => {
      files = await result.current.pickMedia();
    });
    expect(files).toHaveLength(1);
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
