import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MapCacheService } from '../services/MapCacheService';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface OfflineMapManagerProps {
  visible: boolean;
  onClose: () => void;
}

export function OfflineMapManager({ visible, onClose }: OfflineMapManagerProps) {
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStats, setDownloadStats] = useState({ downloaded: 0, total: 0 });

  useEffect(() => {
    if (visible) {
      loadCacheStatus();
    }
  }, [visible]);

  const loadCacheStatus = async () => {
    try {
      const status = await MapCacheService.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('Error loading cache status:', error);
    }
  };

  const handleDownloadMaps = () => {
    showAlert(
      'Descarregar Mapes Offline',
      'Això descarregarà els mapes dels Pirineus per ús offline. La descàrrega pot trigar diversos minuts i utilitzar dades mòbils.',
      [
        { text: 'Cancel·lar', style: 'cancel' },
        { 
          text: 'Descarregar', 
          onPress: () => { startDownload(); },
          style: 'default'
        }
      ]
    );
  };

  const startDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStats({ downloaded: 0, total: 0 });

    try {
      const success = await MapCacheService.downloadTilesForArea(
        MapCacheService.PYRENEES_BOUNDS,
        6, // Min zoom
        14, // Max zoom
        (downloaded, total, percentage) => {
          setDownloadProgress(percentage);
          setDownloadStats({ downloaded, total });
        },
        (success) => {
          setIsDownloading(false);
          if (success) {
            showAlert('Èxit', 'Mapes descarregats correctament! Ara pots utilitzar l\'app offline.');
          } else {
            showAlert('Error', 'Hi ha hagut un problema descarregant els mapes. Torna-ho a intentar.');
          }
          loadCacheStatus();
        }
      );
    } catch (error) {
      setIsDownloading(false);
      showAlert('Error', 'Hi ha hagut un problema descarregant els mapes.');
      console.error('Download error:', error);
    }
  };

  const handleClearCache = () => {
    showAlert(
      'Eliminar Mapes',
      'Això eliminarà tots els mapes descarregats. Hauràs de tornar-los a descarregar per utilitzar l\'app offline.',
      [
        { text: 'Cancel·lar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: () => {
            (async () => {
              try {
                await MapCacheService.clearCache();
                showAlert('Eliminat', 'Mapes eliminats correctament.');
                loadCacheStatus();
              } catch (error) {
                showAlert('Error', 'Hi ha hagut un problema eliminant els mapes.');
              }
            })();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getStatusColor = () => {
    if (!cacheStatus?.metadata) return '#6b7280';
    if (cacheStatus.metadata.isComplete) return '#10b981';
    return '#f59e0b';
  };

  const getStatusText = () => {
    if (!cacheStatus?.metadata) return 'No hi ha mapes offline';
    if (cacheStatus.metadata.isComplete) return 'Mapes offline disponibles';
    if (cacheStatus.metadata.downloadedTiles > 0) return 'Descàrrega incompleta';
    return 'No hi ha mapes offline';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mapes Offline</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* Estat del cache */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>

          {/* Informació del cache */}
          {cacheStatus && (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mida del cache:</Text>
                <Text style={styles.infoValue}>
                  {formatFileSize(cacheStatus.sizeInMB)}
                </Text>
              </View>
              
              {cacheStatus.metadata && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tiles descarregats:</Text>
                    <Text style={styles.infoValue}>
                      {cacheStatus.metadata.downloadedTiles} / {cacheStatus.metadata.totalTiles}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Última actualització:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(cacheStatus.metadata.downloadDate).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {cacheStatus.metadata.refugesCount !== undefined && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Refugis descarregats:</Text>
                      <Text style={styles.infoValue}>
                        {cacheStatus.metadata.refugesCount}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Progress bar durante la descàrrega */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Descarregant mapes... {downloadProgress.toFixed(1)}%
              </Text>
              <Text style={styles.progressStats}>
                {downloadStats.downloaded} / {downloadStats.total} tiles
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
              </View>
            </View>
          )}

          {/* Botons d'acció */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.downloadButton,
                isDownloading && styles.disabledButton
              ]}
              onPress={handleDownloadMaps}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.downloadButtonText}>
                  📱 Descarregar Mapes dels Pirineus
                </Text>
              )}
            </TouchableOpacity>

            {cacheStatus?.metadata && (
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClearCache}
                disabled={isDownloading}
              >
                <Text style={styles.clearButtonText}>
                  🗑️ Eliminar Mapes
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Informació adicional */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>ℹ️ Informació</Text>
            <Text style={styles.infoBoxText}>
              • Els mapes offline permeten utilitzar l'app sense connexió{'\n'}
              • Es descarreguen els nivells de zoom 6-14 dels Pirineus{'\n'}
              • Es guarda la llista completa de refugis{'\n'}
              • La descàrrega pot trigar 5-15 minuts depenent de la connexió{'\n'}
              • Mida aproximada: 80-200 MB
            </Text>
          </View>
        </ScrollView>
      </View>
      
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  progressStats: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#10b981',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});