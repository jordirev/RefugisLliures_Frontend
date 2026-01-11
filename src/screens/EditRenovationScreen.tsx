import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { RenovationForm, RenovationFormData } from '../components/RenovationForm';
import { Location } from '../models';
import { useRefuges, useRefuge } from '../hooks/useRefugesQuery';
import { useRenovation, useUpdateRenovation } from '../hooks/useRenovationsQuery';

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

  const [formResetKey, setFormResetKey] = useState(0);

  const renovationId = route.params?.renovationId;

  // Load renovation data using React Query
  const { data: renovation, isLoading: loadingRenovation } = useRenovation(renovationId);
  
  // Load all refuges
  const { data: allRefuges = [], isLoading: loadingRefuges } = useRefuges();
  
  // Load initial refuge
  const { data: initialRefuge } = useRefuge(renovation?.refuge_id || '');
  
  // Mutation for updating
  const updateMutation = useUpdateRenovation();
  
  const isLoadingData = loadingRenovation || loadingRefuges;
  const isLoading = updateMutation.isPending;

  // Set initial form data when renovation loads
  const [initialData, setInitialData] = useState<RenovationFormData | null>(null);
  
  useEffect(() => {
    if (renovation && !initialData) {
      setInitialData({
        refuge_id: renovation.refuge_id,
        ini_date: renovation.ini_date,
        fin_date: renovation.fin_date,
        description: renovation.description,
        materials_needed: renovation.materials_needed,
        group_link: renovation.group_link,
      });
      setFormResetKey(prev => prev + 1);
    }
  }, [renovation, initialData]);



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

    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate({ id: renovationId, updates: changedFields }, {
        onSuccess: (editedRenovation) => {
          // Success - navigate to renovations detail
          navigation.navigate('RefromDetail', { 
            renovationId: editedRenovation.id,
            renovation: editedRenovation
          });
          resolve();
        },
        onError: (error: any) => {
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
          reject(error);
        }
      });
    });
  };

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
