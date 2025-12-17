import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RefugeProposal, RefugeProposalStatus } from '../models';
import { ProposalCard } from '../components/ProposalCard';
import { Badge } from '../components/Badge';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { useProposals, useMyProposals } from '../hooks/useProposalsQuery';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';

type ProposalsScreenMode = 'my' | 'admin';

type ProposalsScreenParams = {
  mode: ProposalsScreenMode;
};

type StatusFilter = 'all' | RefugeProposalStatus;

const FILTER_COLORS = {
  all: { background: '#FFF5ED', color: '#FF6900', border: '#ffd8bcff' },
  pending: { background: '#E0E7FF', color: '#3730A3', border: '#A5B4FC' },
  approved: { background: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  rejected: { background: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
};

const UNSELECTED_COLOR = { background: '#F3F4F6', color: '#9CA3AF', border: '#D1D5DB' };

export function ProposalsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: ProposalsScreenParams }, 'params'>>();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const mode = route.params?.mode || 'my';
  const isAdminMode = mode === 'admin';

  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(
    isAdminMode ? 'pending' : 'all'
  );

  const HEADER_HEIGHT = 96;

  // Determinar quin status passar al hook (undefined si 'all')
  const statusFilter = selectedFilter === 'all' ? undefined : (selectedFilter as RefugeProposalStatus);

  // Utilitzar el hook corresponent segons el mode
  const {
    data: proposals = [],
    isLoading: loading,
    isError,
    refetch,
  } = isAdminMode
    ? useProposals(statusFilter)
    : useMyProposals(statusFilter);

  // Gestionar errors
  useEffect(() => {
    if (isError) {
      showAlert(t('common.error'), t('proposals.errorLoading'));
    }
  }, [isError]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleFilterPress = (filter: StatusFilter) => {
    setSelectedFilter(filter);
  };

  const handleProposalPress = (proposal: RefugeProposal) => {
    navigation.navigate('ProposalDetail', { proposal, mode });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderFilterBadge = (filter: StatusFilter) => {
    const isSelected = selectedFilter === filter;
    const colors = isSelected ? FILTER_COLORS[filter] : UNSELECTED_COLOR;

    return (
      <TouchableOpacity
        key={filter}
        onPress={() => handleFilterPress(filter)}
        activeOpacity={0.7}
      >
        <Badge
          text={t(`proposals.filters.${filter}`)}
          background={colors.background}
          color={colors.color}
          borderColor={colors.border}
          containerStyle={styles.filterBadge}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {t('proposals.emptyState')}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isAdminMode 
              ? t('proposals.titleAdmin') 
              : t('proposals.titleMy')}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { top: HEADER_HEIGHT }]}>
        <View style={styles.filtersScroll}>
          {renderFilterBadge('all')}
          {renderFilterBadge('pending')}
          {renderFilterBadge('approved')}
          {renderFilterBadge('rejected')}
        </View>
      </View>

      {/* Content */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6900" />
          </View>
        ) : (
          <FlatList
            data={proposals}
            renderItem={({ item }) => (
              <ProposalCard
                proposal={item}
                onPress={handleProposalPress}
                showCreatorInfo={isAdminMode}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: HEADER_HEIGHT + 70, paddingBottom: Math.max(insets.bottom, 16) },
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                colors={['#FF6900']}
                tintColor="#FF6900"
                progressViewOffset={HEADER_HEIGHT + 70}
              />
            }
          />
        )}
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

      {/* Bottom safe area */}
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
    backgroundColor: '#fff',
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1.2,
    borderBottomColor: '#e3e4e5ff',
    flexDirection: 'row',
    gap: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Arimo',
    color: '#111827',
    textAlign: 'left',
    flex: 1,
  },
  filtersContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
