import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

export function EditRefugeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<EditRefugeScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const { refuge } = route.params;

  const handleSubmit = async (data: Location | Partial<Location>, comment?: string) => {
    await RefugeProposalsService.proposalEditRefuge(
      refuge.id,
      data as Partial<Location>,
      comment
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      {/* Fixed header with SafeArea */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('editRefuge.title')}</Text>
        </View>
      </View>

      {/* Form content */}
      <View style={[styles.formContainer, { paddingTop: insets.top }]}>
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
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
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
    marginTop: 60,
  },
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 5,
  },
});
