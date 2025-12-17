import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { Location } from '../models';
import { useCreateRefugeProposal } from '../hooks/useProposalsQuery';
import { RefugeForm } from '../components/RefugeForm';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';

export function CreateRefugeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Mutation for creating refuge proposal
  const createProposalMutation = useCreateRefugeProposal();

  const handleSubmit = async (data: Location | Partial<Location>, comment?: string) => {
    return new Promise<void>((resolve, reject) => {
      createProposalMutation.mutate({ payload: data as Location, comment }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      {/* Header with SafeArea */}
      <View style={styles.headerContainer}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('createRefuge.title')}</Text>
        </View>
      </View>

      {/* Form content */}
      <View style={styles.formContainer}>
        <RefugeForm
          mode="create"
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 5,
  },
});
