import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { RenovationForm, RenovationFormData } from '../components/RenovationForm';
import { Location } from '../models';
import { RefugisService } from '../services/RefugisService';
import { RenovationService } from '../services/RenovationService';
import { mapRenovationFromDTO } from '../services/mappers/RenovationMapper';

// Icon imports
import BackIcon from '../assets/icons/arrow-left.svg';
import NavigationIcon from '../assets/icons/navigation.svg';

type EditRenovationScreenRouteProp = RouteProp<
  { EditRenovation: { renovationId: string } },
  'EditRenovation'
>;

export function EditRenovationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<EditRenovationScreenRouteProp>();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [allRefuges, setAllRefuges] = useState<Location[]>([]);
  const [initialRefuge, setInitialRefuge] = useState<Location | null>(null);
  const [initialData, setInitialData] = useState<RenovationFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formResetKey, setFormResetKey] = useState(0);

  const renovationId = route.params?.renovationId;

  useEffect(() => {
    loadData();
  }, [renovationId]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load refuges
      const refuges = await RefugisService.getRefugis();
      setAllRefuges(refuges);

      // Load renovation data
      const renovationDTO = await RenovationService.getRenovationById(renovationId);
      if (!renovationDTO) {
        showAlert(t('common.error'), t('renovations.notFound'));
        navigation.goBack();
        return;
      }

      const renovation = mapRenovationFromDTO(renovationDTO);
      
      // Load refuge
      const refuge = await RefugisService.getRefugiById(renovation.refuge_id);
      setInitialRefuge(refuge);

      // Set initial form data
      setInitialData({
        refuge_id: renovation.refuge_id,
        ini_date: renovation.ini_date,
        fin_date: renovation.fin_date,
        description: renovation.description,
        materials_needed: renovation.materials_needed,
        group_link: renovation.group_link,
      });
      
      // Increment reset key to force form reset
      setFormResetKey(prev => prev + 1);
    } catch (error) {
      console.error('Error loading renovation data:', error);
      showAlert(t('common.error'), t('renovations.errorLoadingDetails'));
      navigation.goBack();
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('RefromDetail', { 
      renovationId: renovationId
    });
  };
  
  const handleSubmit = async (formData: RenovationFormData, hasChanges: boolean, changedFields: Partial<RenovationFormData>) => {
    // If no changes, just navigate back
    if (!hasChanges) {
      handleCancel();
      return;
    }

    setIsLoading(true);

    try {
      const editedRenovation = await RenovationService.updateRenovation(renovationId, changedFields);

      // Success - navigate to renovations detail
      navigation.navigate('RefromDetail', { 
        renovationId: editedRenovation.id,
        renovation: editedRenovation
      });

    } catch (error: any) {
      console.error('Error updating renovation:', error);
      
      // Handle conflict (409) - overlapping renovation
      if (error.overlappingRenovation) {
        const overlappingRenovation = error.overlappingRenovation;
        showAlert(
          undefined,
          t('createRenovation.errors.overlapMessage'),
          [
            {
              text: t('common.ok'),
              style: 'cancel',
              onPress: hideAlert,
            },
            {
              text: t('createRenovation.viewOverlappingRenovation'),
              style: 'default',
              onPress: () => {
                hideAlert();
                handleCancel();
              },
            },
          ]
        );
      } else {
        showAlert(t('common.error'), error.message || t('renovations.errorUpdating'));
      }
    } finally {
      setIsLoading(false);
    }
  };
    
  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      navigation.navigate('RefromDetail', { 
        renovationId: renovationId
      });
      return true; // Prevent default behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation, renovationId]);
  

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('renovations.editRenovation')}</Text>
        </View>
      </View>

      {initialData && (
        <RenovationForm
          mode="edit"
          initialData={initialData}
          initialRefuge={initialRefuge}
          allRefuges={allRefuges}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          resetKey={formResetKey}
        />
      )}

      {/* Custom Alert */}
      {alertVisible && alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons?.map((button) => ({
            ...button,
            icon: button.text === t('createRenovation.viewOverlappingRenovation') 
              ? NavigationIcon 
              : undefined,
          }))}
          onDismiss={hideAlert}
        />
      )}

        {insets.bottom > 0 && (
            <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 5,
  },
});
