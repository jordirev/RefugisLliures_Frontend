import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { Location } from '../models';
import { RefugeProposalsService } from '../services/RefugeProposalsService';
import { RefugeForm } from '../components/RefugeForm';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';

type EditRefugeScreenRouteProp = RouteProp<
  {
    EditRefuge: {
      refuge: Location;
    };
  },
  'EditRefuge'
>;

interface EditRefugeScreenProps {
  refuge?: Location;
  onCancel?: () => void;
}

export function EditRefugeScreen({ refuge: refugeProp, onCancel: onCancelProp }: EditRefugeScreenProps = {}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Intentar obtenir navigation i route només si estem dins d'un navigator
  let navigation: any;
  let routeParams: any;
  
  try {
    navigation = useNavigation<any>();
    const route = useRoute<EditRefugeScreenRouteProp>();
    routeParams = route.params;
  } catch (e) {
    // No estem dins d'un navigator, és normal quan es renderitza com a overlay
    navigation = null;
    routeParams = null;
  }

  // Usar el refuge del prop o del route
  const refuge = refugeProp || routeParams?.refuge;

  const handleSubmit = async (data: Location | Partial<Location>, comment?: string) => {
    await RefugeProposalsService.proposalEditRefuge(
      refuge.id,
      data as Partial<Location>,
      comment
    );
  };

  const handleCancel = () => {
    if (onCancelProp) {
      onCancelProp();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('RefugeDetails', { refugeId: refuge.id });
    }
  };

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.root}>
      {/* Header with SafeArea */}
      <View style={styles.headerContainer}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('editRefuge.title')}</Text>
        </View>
      </View>

      {/* Form content */}
      <View style={styles.formContainer}>
        <RefugeForm
          mode="edit"
          initialData={refuge}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </View>

      {/* Bottom SafeArea */}
      {insets.bottom > 0 && (
        <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
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
  formContainer: {
    flex: 1,
  },
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
  },
});
