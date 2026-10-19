import React from 'react';
import { View, Text, StyleSheet, StyleProp, ImageStyle } from 'react-native';
import { ImageMetadata } from '../models';
import { MediaImage, VideoPoster, isVideoMedia } from './MediaImage';
import { VideoThumbnail } from './PhotoViewerModal';

/**
 * Miniatura d'un mitjà per a graelles i carrusels.
 * - Imatge: `thumb_url` amb cache per clau i blurhash (expo-image).
 * - Vídeo nou: pòster WebP (`thumb_url`) + icona de play.
 * - Vídeo antic (sense pòster): primer fotograma amb expo-video (fallback).
 */
export function MediaThumbnail({ media, style }: { media: ImageMetadata; style?: StyleProp<ImageStyle> }) {
  if (!isVideoMedia(media)) {
    return <MediaImage media={media} variant="thumb" style={style} />;
  }
  if (media.thumb_url) {
    return <VideoPoster media={media} style={style} />;
  }
  return (
    <View>
      <VideoThumbnail uri={media.url} style={style} />
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
