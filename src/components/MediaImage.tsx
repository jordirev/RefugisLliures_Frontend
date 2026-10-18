import React from 'react';
import { StyleProp, ImageStyle, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ImageMetadata } from '../models';

/**
 * Indica si un mitjà és un vídeo. Fa servir `media_type` (contracte nou) i, per als items
 * antics sense aquest camp, l'extensió de la URL.
 */
export function isVideoMedia(media: Pick<ImageMetadata, 'url' | 'media_type'> | null | undefined): boolean {
  if (!media) return false;
  if (media.media_type) return media.media_type === 'video';
  return isVideoUrl(media.url);
}

/** Detecció de vídeo per extensió de la URL (només per a items antics) */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase().split('?')[0];
  return ['.mp4', '.mov', '.avi', '.webm', '.m4v'].some((ext) => lowerUrl.includes(ext));
}

interface MediaImageProps {
  media: ImageMetadata;
  /** `thumb` (graella/carrusel, usa thumb_url) o `full` (visor, usa url) */
  variant?: 'thumb' | 'full';
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  testID?: string;
}

/**
 * Imatge d'un mitjà amb expo-image:
 * - `cacheKey` = clau R2 (estable), de manera que la cache a disc no es trenca quan la URL
 *   prefirmada canvia a cada petició.
 * - `placeholder` = blurhash (placeholder instantani).
 * - Miniatura a la galeria/carrusel i imatge completa al visor; per als vídeos, la miniatura
 *   és el pòster WebP generat pel backend.
 * Fallback per a items antics: sense thumb_url es fa servir `url`.
 */
export function MediaImage({ media, variant = 'thumb', style, contentFit = 'cover', testID }: MediaImageProps) {
  const useThumb = variant === 'thumb' && !!media.thumb_url;
  const uri = useThumb ? (media.thumb_url as string) : media.url;
  const cacheKey = useThumb ? `${media.key}#thumb` : media.key;

  return (
    <Image
      source={{ uri, cacheKey }}
      placeholder={media.blurhash ? { blurhash: media.blurhash } : undefined}
      style={style}
      contentFit={contentFit}
      transition={150}
      cachePolicy="disk"
      recyclingKey={cacheKey}
      testID={testID}
    />
  );
}

/**
 * Pòster d'un vídeo amb la icona de reproducció superposada.
 * Només s'usa quan hi ha `thumb_url` (items nous); els antics continuen amb VideoThumbnail.
 */
export function VideoPoster({ media, style }: { media: ImageMetadata; style?: StyleProp<ImageStyle> }) {
  return (
    <View>
      <MediaImage media={media} variant="thumb" style={style} />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.playIconContainer}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 3,
  },
});
