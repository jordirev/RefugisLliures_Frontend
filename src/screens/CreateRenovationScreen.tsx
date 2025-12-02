import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { RenovationForm, RenovationFormData } from '../components/RenovationForm';
import { Location } from '../models';
import { RefugisService } from '../services/RefugisService';
import { RenovationService } from '../services/RenovationService';

// Icon imports
import BackIcon from '../assets/icons/arrow-left.svg';
import NavigationIcon from '../assets/icons/navigation.svg';


export function CreateRenovationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [allRefuges, setAllRefuges] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  // Load all refuges on mount
  useEffect(() => {
    loadRefuges();
  }, []);

  // Show info alert and reset form every time screen is focused
  useFocusEffect(
    useCallback(() => {
      setFormResetKey(prev => prev + 1); // Reset form
      showAlert(
        t('renovations.alerts.infoCreationTittle'),
        t('renovations.alerts.infoCreationMessage'),
        [{ text: t('common.close'), onPress: hideAlert }]
      );
    }, [])
  );

  const loadRefuges = async () => {
    try {
      const refuges = await RefugisService.getRefugis();
      setAllRefuges(refuges);
    } catch (error) {
      console.error('Error loading refuges:', error);
    }
  };

  const handleSubmit = async (formData: RenovationFormData, hasChanges: boolean, changedFields: Partial<RenovationFormData>) => {
    setIsLoading(true);

    try {
      const createdRenovation = await RenovationService.createRenovation({
        refuge_id: formData.refuge_id!,
        ini_date: formData.ini_date,
        fin_date: formData.fin_date,
        description: formData.description,
        materials_needed: formData.materials_needed,
        group_link: formData.group_link,
      });

      // Success - navigate to renovations detail with the created renovation
      navigation.navigate('RefromDetail', { 
        renovationId: createdRenovation.id,
        renovation: createdRenovation
      });
    } catch (error: any) {
      console.error('Error creating renovation:', error);
      
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
              onPress: () => {
                hideAlert();
                navigation.navigate('Renovations');
              },
            },
            {
              text: t('createRenovation.viewOverlappingRenovation'),
              style: 'default',
              onPress: () => {
                hideAlert();
                navigation.navigate('RefromDetail', { 
                  renovationId: overlappingRenovation.id 
                });
              },
            },
          ]
        );
      } else {
        showAlert(t('common.error'), error.message || t('createRenovation.errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('Renovations');
  };
  
  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      navigation.navigate('Renovations');
      return true; // Prevent default behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('createRenovation.title')}</Text>
        </View>
      </View>

      <RenovationForm
        mode="create"
        allRefuges={allRefuges}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        resetKey={formResetKey}
      />

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

