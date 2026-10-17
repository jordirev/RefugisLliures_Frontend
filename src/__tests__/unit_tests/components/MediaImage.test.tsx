/**
 * Tests de MediaImage / MediaThumbnail (expo-image amb cacheKey i blurhash)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { MediaImage, isVideoMedia } from '../../../components/MediaImage';
import { MediaThumbnail } from '../../../components/MediaThumbnail';

jest.mock('expo-video', () => ({
  VideoView: (props: any) => {
    const { View } = require('react-native');
    return <View testID="video-view" {...props} />;
  },
  useVideoPlayer: jest.fn(() => ({ pause: jest.fn() })),
}));

const base = {
  key: 'refugis-lliures/r1/uuid.webp',
  url: 'https://r2/full.webp?X-Amz-Signature=1',
  uploaded_at: '2026-01-01T00:00:00Z',
  creator_uid: 'u1',
};

const findExpoImages = (root: any) => root.findAll((n: any) => n.type === 'ExpoImage');

describe('MediaImage', () => {
  it('miniatura: usa thumb_url i una cacheKey estable derivada de la clau', () => {
    const { UNSAFE_root } = render(
      <MediaImage media={{ ...base, thumb_url: 'https://r2/thumb.webp?sig=2', blurhash: 'LKO2' }} variant="thumb" />
    );
    const img = findExpoImages(UNSAFE_root)[0];
    expect(img.props.source).toEqual({ uri: 'https://r2/thumb.webp?sig=2', cacheKey: `${base.key}#thumb` });
    expect(img.props.placeholder).toEqual({ blurhash: 'LKO2' });
    expect(img.props.cachePolicy).toBe('disk');
  });

  it('visor: usa la URL completa amb cacheKey = clau', () => {
    const { UNSAFE_root } = render(<MediaImage media={{ ...base, thumb_url: 'https://r2/thumb.webp' }} variant="full" />);
    expect(findExpoImages(UNSAFE_root)[0].props.source).toEqual({ uri: base.url, cacheKey: base.key });
  });

  it('fallback per a items antics sense miniatura ni blurhash', () => {
    const { UNSAFE_root } = render(<MediaImage media={base} variant="thumb" />);
    const img = findExpoImages(UNSAFE_root)[0];
    expect(img.props.source).toEqual({ uri: base.url, cacheKey: base.key });
    expect(img.props.placeholder).toBeUndefined();
  });
});

describe('isVideoMedia', () => {
  it('prioritza media_type i, si falta, l\'extensió de la URL', () => {
    expect(isVideoMedia({ url: 'https://x/a.webp', media_type: 'video' })).toBe(true);
    expect(isVideoMedia({ url: 'https://x/a.mp4', media_type: 'image' })).toBe(false);
    expect(isVideoMedia({ url: 'https://x/a.mov?sig=1' })).toBe(true);
    expect(isVideoMedia({ url: 'https://x/a.jpg' })).toBe(false);
  });
});

describe('MediaThumbnail', () => {
  it('vídeo nou: mostra el pòster (thumb_url) sense carregar el vídeo', () => {
    const { UNSAFE_root, queryByTestId } = render(
      <MediaThumbnail media={{ ...base, media_type: 'video', thumb_url: 'https://r2/poster.webp' }} />
    );
    expect(findExpoImages(UNSAFE_root)[0].props.source.uri).toBe('https://r2/poster.webp');
    expect(queryByTestId('video-view')).toBeNull();
  });

  it('vídeo antic sense pòster: fallback al primer fotograma (expo-video)', () => {
    const { getByTestId } = render(<MediaThumbnail media={{ ...base, url: 'https://r2/old.mp4' }} />);
    expect(getByTestId('video-view')).toBeTruthy();
  });
});
