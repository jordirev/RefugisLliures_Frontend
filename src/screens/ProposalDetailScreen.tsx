import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefugeProposal, Location, User } from '../models';
import { Badge } from '../components/Badge';
import { RejectProposalPopUp } from '../components/RejectProposalPopUp';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { useUser } from '../hooks/useUsersQuery';
import { useApproveProposal, useRejectProposal } from '../hooks/useProposalsQuery';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';

type ProposalDetailScreenParams = {
  proposal: RefugeProposal;
  mode: 'my' | 'admin';
};

// Colors for action badges
const ACTION_COLORS = {
  create: { background: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  update: { background: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  delete: { background: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
};

// Colors for status badges
const STATUS_COLORS = {
  pending: { background: '#E0E7FF', color: '#3730A3', border: '#A5B4FC' },
  approved: { background: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  rejected: { background: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
};

export function ProposalDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: ProposalDetailScreenParams }, 'params'>>();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const proposal = route.params?.proposal;
  const mode = route.params?.mode || 'my';
  const isAdminMode = mode === 'admin';

  const [showRejectPopup, setShowRejectPopup] = useState(false);

  const HEADER_HEIGHT = 96;

  // Utilitzar React Query per carregar usuaris
  const { data: creator } = useUser(proposal.creator_uid);
  const { data: reviewer } = useUser(proposal.reviewer_uid);

  // Mutations per aprovar/rebutjar
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();

  const loading = false; // No cal loading, els hooks gestionen els estats
  const processing = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async () => {
    approveMutation.mutate(proposal.id, {
      onSuccess: () => {
        showAlert(
          t('proposals.approve.successTitle'),
          t('proposals.approve.successMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      },
      onError: (error: any) => {
        showAlert(t('common.error'), error.message || t('proposals.errors.approveError'));
      },
    });
  };

  const handleReject = async (reason: string) => {
    setShowRejectPopup(false);
    rejectMutation.mutate(
      { proposalId: proposal.id, reason },
      {
        onSuccess: () => {
          showAlert(
            t('proposals.reject.successTitle'),
            t('proposals.reject.successMessage'),
            [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
          );
        },
        onError: (error: any) => {
          showAlert(t('common.error'), error.message || t('proposals.errors.rejectError'));
        },
      }
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderUserInfo = (user: User | null, label: string) => {
    if (!user) return null;

    return (
      <View style={styles.userContainer}>
        <View style={styles.avatarContainer}>
          {user?.avatar_metadata?.url ? (
            <Image source={{ uri: user.avatar_metadata.url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>{label}</Text>
          <Text style={styles.userName}>{user.username}</Text>
        </View>
      </View>
    );
  };

  const renderFieldComparison = (label: string, currentValue: any, newValue: any) => {
    // Don't show if both are null/undefined
    if ((currentValue === null || currentValue === undefined) && 
        (newValue === null || newValue === undefined)) {
      return null;
    }

    const hasChange = JSON.stringify(currentValue) !== JSON.stringify(newValue);

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.valuesContainer}>
          {/* Current value */}
          {currentValue !== null && currentValue !== undefined && (
            <View style={styles.valueBox}>
              <Text style={styles.valueLabel}>{t('proposals.detail.current')}:</Text>
              <Text style={styles.valueText}>
                {typeof currentValue === 'object' 
                  ? JSON.stringify(currentValue, null, 2) 
                  : String(currentValue)}
              </Text>
            </View>
          )}
          
          {/* New value */}
          {hasChange && newValue !== null && newValue !== undefined && (
            <View style={[styles.valueBox, styles.newValueBox]}>
              <Text style={[styles.valueLabel, styles.newValueLabel]}>
                {proposal.action === 'create' 
                  ? t('proposals.detail.value')
                  : t('proposals.detail.new')}:
              </Text>
              <Text style={[styles.valueText, styles.newValueText]}>
                {typeof newValue === 'object' 
                  ? JSON.stringify(newValue, null, 2) 
                  : String(newValue)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRefugeComparison = () => {
    if (proposal.action === 'delete') {
      // For delete, show refuge_snapshot
      const refugeSnapshot = proposal.refuge_snapshot;
      if (!refugeSnapshot) return null;
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('proposals.detail.refugeToDelete')}</Text>
          {renderFieldComparison(t('refuge.name'), refugeSnapshot.name, null)}
          {renderFieldComparison(t('refuge.surname'), refugeSnapshot.surname, null)}
          {renderFieldComparison(t('refuge.description'), refugeSnapshot.description, null)}
          {renderFieldComparison(
            t('refuge.coordinates'),
            refugeSnapshot.coord 
              ? `${refugeSnapshot.coord.lat.toFixed(4)}, ${refugeSnapshot.coord.long.toFixed(5)}` 
              : null,
            null
          )}
          {renderFieldComparison(t('refuge.altitude'), refugeSnapshot.altitude, null)}
          {renderFieldComparison(t('refuge.places'), refugeSnapshot.places, null)}
        </View>
      );
    }

    if (proposal.action === 'create') {
      // For create, only show payload
      const newRefuge = proposal.payload;
      if (!newRefuge) return null;

      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('proposals.detail.newRefuge')}</Text>
          {renderFieldComparison(t('refuge.name'), null, newRefuge.name)}
          {renderFieldComparison(t('refuge.surname'), null, newRefuge.surname)}
          {renderFieldComparison(t('refuge.description'), null, newRefuge.description)}
          {renderFieldComparison(
            t('refuge.coordinates'),
            null,
            newRefuge.coord 
              ? `${newRefuge.coord.lat.toFixed(4)}, ${newRefuge.coord.long.toFixed(5)}` 
              : null
          )}
          {renderFieldComparison(t('refuge.altitude'), null, newRefuge.altitude)}
          {renderFieldComparison(t('refuge.places'), null, newRefuge.places)}
        </View>
      );
    }

    // For update, show comparison between refuge_snapshot and payload
    const refugeSnapshot = proposal.refuge_snapshot;
    if (!refugeSnapshot || !proposal.payload) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('proposals.detail.changes')}</Text>
        {renderFieldComparison(t('refuge.name'), refugeSnapshot.name, proposal.payload.name)}
        {renderFieldComparison(t('refuge.surname'), refugeSnapshot.surname, proposal.payload.surname)}
        {renderFieldComparison(t('refuge.description'), refugeSnapshot.description, proposal.payload.description)}
        {renderFieldComparison(
          t('refuge.coordinates'),
          refugeSnapshot.coord 
            ? `${refugeSnapshot.coord.lat.toFixed(4)}, ${refugeSnapshot.coord.long.toFixed(5)}` 
            : null,
          proposal.payload.coord 
            ? `${proposal.payload.coord.lat.toFixed(4)}, ${proposal.payload.coord.long.toFixed(5)}` 
            : null
        )}
        {renderFieldComparison(t('refuge.altitude'), refugeSnapshot.altitude, proposal.payload.altitude)}
        {renderFieldComparison(t('refuge.places'), refugeSnapshot.places, proposal.payload.places)}
      </View>
    );
  };

  const actionColors = ACTION_COLORS[proposal.action];
  const statusColors = STATUS_COLORS[proposal.status];
  const canReview = isAdminMode && proposal.status === 'pending';

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('proposals.detail.title')}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6900" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_HEIGHT + 16, paddingBottom: canReview ? 100 : 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Proposal info */}
          <View style={styles.section}>
            <Text style={styles.refugeName}>
              {proposal.refuge_snapshot?.name || proposal.payload?.name || t('proposals.card.unknownRefuge')}
            </Text>

            {/* Badges */}
            <View style={styles.badgesContainer}>
              <Badge
                text={t(`proposals.actions.${proposal.action}`)}
                background={actionColors.background}
                color={actionColors.color}
                borderColor={actionColors.border}
              />
              <Badge
                text={t(`proposals.status.${proposal.status}`)}
                background={statusColors.background}
                color={statusColors.color}
                borderColor={statusColors.border}
              />
            </View>

            {/* Dates */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('proposals.card.createdAt')}:</Text>
              <Text style={styles.infoValue}>{formatDate(proposal.created_at)}</Text>
            </View>

            {proposal.status !== 'pending' && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('proposals.card.reviewedAt')}:</Text>
                <Text style={styles.infoValue}>{formatDate(proposal.reviewed_at)}</Text>
              </View>
            )}
          </View>

          {/* Comment */}
          {proposal.comment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('proposals.detail.comment')}</Text>
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>{proposal.comment}</Text>
              </View>
            </View>
          )}

          {/* Rejection reason */}
          {proposal.status === 'rejected' && proposal.rejection_reason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('proposals.card.rejectionReason')}</Text>
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionText}>{proposal.rejection_reason}</Text>
              </View>
            </View>
          )}

          {/* Users info */}
          {creator && renderUserInfo(creator, t('proposals.card.creator'))}
          {reviewer && renderUserInfo(reviewer, t('proposals.card.reviewer'))}

          {/* Refuge comparison */}
          {renderRefugeComparison()}

          {/* Comment before buttons */}
          {canReview && proposal.comment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('proposals.detail.comment')}</Text>
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>{proposal.comment}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Action buttons (only for admins on pending proposals) */}
      {canReview && !loading && (
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => setShowRejectPopup(true)}
            disabled={processing}
          >
            <Text style={styles.rejectButtonText}>{t('proposals.detail.reject')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApprove}
            disabled={processing}
            activeOpacity={0.8}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.approveButton}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.approveButtonText}>{t('proposals.detail.approve')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Reject Popup */}
      {showRejectPopup && (
        <RejectProposalPopUp
          visible={showRejectPopup}
          proposalId={proposal.id}
          refugeName={proposal.refuge_snapshot?.name || proposal.payload?.name || t('proposals.card.unknownRefuge')}
          onCancel={() => setShowRejectPopup(false)}
          onConfirm={handleReject}
        />
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  refugeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  commentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  valuesContainer: {
    gap: 8,
  },
  valueBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newValueBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  valueLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  newValueLabel: {
    color: '#065F46',
  },
  valueText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  newValueText: {
    color: '#047857',
    fontWeight: '500',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  approveButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
