import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { RefugeProposal, User } from '../models';
import { Badge } from './Badge';
import { useTranslation } from '../hooks/useTranslation';
import { useUser } from '../hooks/useUsersQuery';

interface ProposalCardProps {
  proposal: RefugeProposal;
  onPress: (proposal: RefugeProposal) => void;
  showCreatorInfo?: boolean; // Mode admin
}

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

export function ProposalCard({ proposal, onPress, showCreatorInfo = false }: ProposalCardProps) {
  const { t } = useTranslation();
  
  // Utilitzar React Query per carregar usuaris
  const { data: creator, isLoading: loadingCreator } = useUser(
    showCreatorInfo ? proposal.creator_uid : undefined
  );
  const { data: reviewer, isLoading: loadingReviewer } = useUser(
    showCreatorInfo ? proposal.reviewer_uid : undefined
  );
  
  const loadingUsers = loadingCreator || loadingReviewer;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const actionColors = ACTION_COLORS[proposal.action];
  const statusColors = STATUS_COLORS[proposal.status];

  // Get refuge name from refuge_snapshot or payload
  const refugeName = proposal.refuge_snapshot?.name || proposal.payload?.name || t('proposals.card.unknownRefuge');

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(proposal)}
      activeOpacity={0.7}
    >
      {/* Header: Refuge name */}
      <View style={styles.header}>
        <Text style={styles.refugeName} numberOfLines={1}>
          {refugeName}
        </Text>
      </View>

      {/* Badges: Action & Status */}
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

      {/* Created at */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('proposals.card.createdAt')}:</Text>
        <Text style={styles.infoValue}>{formatDate(proposal.created_at)}</Text>
      </View>

      {/* Reviewed info (if approved or rejected) */}
      {proposal.status !== 'pending' && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('proposals.card.reviewedAt')}:</Text>
            <Text style={styles.infoValue}>{formatDate(proposal.reviewed_at)}</Text>
          </View>

          {/* Rejection reason */}
          {proposal.status === 'rejected' && proposal.rejection_reason && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionLabel}>{t('proposals.card.rejectionReason')}:</Text>
              <Text style={styles.rejectionText} numberOfLines={3}>
                {proposal.rejection_reason}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Creator & Reviewer info (admin mode) */}
      {showCreatorInfo && (
        <View style={styles.usersContainer}>
          {loadingUsers ? (
            <ActivityIndicator size="small" color="#FF6900" />
          ) : (
            <>
              {/* Creator */}
              <View style={styles.userRow}>
                <View style={styles.avatarContainer}>
                  {creator?.avatar_metadata?.url ? (
                    <Image 
                      source={{ uri: creator.avatar_metadata.url }} 
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarPlaceholderText}>
                        {creator?.username?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userLabel}>{t('proposals.card.creator')}:</Text>
                  <Text style={styles.userName}>{creator?.username || t('proposals.card.unknownUser')}</Text>
                </View>
              </View>

              {/* Reviewer (if exists) */}
              {reviewer && (
                <View style={styles.userRow}>
                  <View style={styles.avatarContainer}>
                    {reviewer?.avatar_metadata?.url ? (
                      <Image 
                        source={{ uri: reviewer.avatar_metadata.url }} 
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarPlaceholderText}>
                          {reviewer?.username?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userLabel}>{t('proposals.card.reviewer')}:</Text>
                    <Text style={styles.userName}>{reviewer?.username}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    marginBottom: 12,
  },
  refugeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Arimo',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  rejectionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectionLabel: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  usersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});
