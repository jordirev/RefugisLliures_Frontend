import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefugeProposal, Location, User } from '../models';
import { Badge } from '../components/Badge';
import { BadgeType } from '../components/BadgeType';
import { BadgeCondition } from '../components/BadgeCondition';
import { RejectProposalPopUp } from '../components/RejectProposalPopUp';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { useUser } from '../hooks/useUsersQuery';
import { useApproveProposal, useRejectProposal } from '../hooks/useProposalsQuery';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';
import AltitudeIcon from '../assets/icons/altitude2.svg';
import AltitudeGreenIcon from '../assets/icons/altitudeGreen.svg';
import UsersIcon from '../assets/icons/users.svg';
import MapPinIcon from '../assets/icons/map-pin.svg';

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
  const [expandedComments, setExpandedComments] = useState<{[key: string]: boolean}>({});

  const HEADER_HEIGHT = 96;

  const toggleComment = (key: string) => {
    setExpandedComments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Utilitzar React Query per carregar usuaris
  const { data: creator } = useUser(proposal.creator_uid);
  const { data: reviewer } = useUser(proposal.reviewer_uid);

  // Mutations per aprovar/rebutjar
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();

  const loading = false; // No cal loading, els hooks gestionen els estats
  const processing = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async () => {
    approveMutation.mutate(
      { 
        proposalId: proposal.id,
        proposalType: proposal.action,
        refugeId: proposal.refuge_id || undefined
      },
      {
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
      }
    );
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

  const renderUserInfo = (user: User | null, label?: string, comment?: string, date?: string, rejectedReason?: string, isReviewer?: boolean) => {
    const hasExtraContent = comment || rejectedReason;
    // If there's no user and no extra content, don't render anything
    if (!user && !hasExtraContent) return null;

    // Fallback to an "unknown user" label (match ProposalCard) when user is missing but there's a reason/comment
    const displayUser: User = user || ({ username: t('proposals.card.unknownUser'), avatar_metadata: null } as unknown as User);
    const commentKey = isReviewer ? 'reviewer' : 'creator';
    const isExpanded = expandedComments[commentKey];
    const contentText = comment || rejectedReason || '';
    const shouldTruncate = contentText.length > 150;

    if (hasExtraContent) {
      // Layout especial per comentari o rejected reason: avatar+nom+data a dalt, contingut a sota ocupant tot l'ample
      return (
        <View style={[styles.userContainerWithComment, isReviewer && styles.reviewerContainer]}>
          {/* Fila superior: avatar, nom, data */}
          <View style={styles.userTopRow}>
            <View style={[styles.avatarContainer, hasExtraContent && styles.avatarWithExtraContent]}>
              {displayUser?.avatar_metadata?.url ? (
                <Image source={{ uri: displayUser.avatar_metadata.url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {user ? (displayUser?.username?.charAt(0)?.toUpperCase() || '?') : '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              {label && <Text style={styles.userLabel}>{label}</Text>}
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{displayUser.username}</Text>
            </View>
            {date && (
              <View style={styles.userDateContainer}>
                <Text style={styles.userDate}>{date}</Text>
              </View>
            )}
          </View>
          {/* Contingut extra a sota */}
          {comment && (
            <View style={styles.commentRow}>
              <Text style={styles.userComment}>
                {shouldTruncate && !isExpanded ? `${comment.substring(0, 150)}...` : comment}
              </Text>
              {shouldTruncate && (
                <TouchableOpacity onPress={() => toggleComment(commentKey)} style={styles.readMoreButton}>
                  <Text style={styles.readMoreText}>
                    {isExpanded ? t('common.readLess') : t('common.readMore')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {rejectedReason && (
            <View style={styles.rejectedReasonRow}>
              <Text style={styles.rejectedReasonText}>
                {shouldTruncate && !isExpanded ? `${rejectedReason.substring(0, 150)}...` : rejectedReason}
              </Text>
              {shouldTruncate && (
                <TouchableOpacity onPress={() => toggleComment(commentKey)} style={styles.readMoreButton}>
                  <Text style={styles.readMoreText}>
                    {isExpanded ? t('common.readLess') : t('common.readMore')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      );
    }

    // Layout normal sense contingut extra
    return (
      <View style={[styles.userContainer, !label && styles.centeredUserContainer, isReviewer && styles.reviewerContainer]}>
        <View style={styles.avatarContainer}>
          {displayUser?.avatar_metadata?.url ? (
            <Image source={{ uri: displayUser.avatar_metadata.url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user ? (displayUser?.username?.charAt(0)?.toUpperCase() || '?') : '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          {label && <Text style={styles.userLabel}>{label}</Text>}
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{displayUser.username}</Text>
        </View>
        {date && (
          <View style={styles.userDateContainer}>
            <Text style={styles.userDate}>{date}</Text>
          </View>
        )}
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

  const renderAmenities = (infoComp: any) => {
    if (!infoComp) return null;

    const amenityIcons: { [key: string]: string } = {
      manque_un_mur: '🏚️',
      cheminee: '🔥',
      poele: '🍳',
      couvertures: '🛏️',
      latrines: '🚽',
      bois: '🪵',
      eau: '💧',
      matelas: '🛌',
      couchage: '😴',
      bas_flancs: '🪜',
      lits: '🛏️',
      mezzanine_etage: '⬆️',
    };

    const amenities = [];
    for (const [key, value] of Object.entries(infoComp)) {
      if (value) {
        amenities.push({
          key,
          label: t(`refuge.amenities.${key}`),
          icon: amenityIcons[key] || '✨',
        });
      }
    }
    return amenities;
  };

  const renderRefugeInfo = (refuge: any, titleKey: string, isUpdated: boolean = false) => {
    if (!refuge) return null;

    const formatCoord = (lat: number, long: number) => {
      return `(${lat}, ${long})`;
    };

    const amenities = renderAmenities(refuge.info_comp);

    // Colors for updated version
    const updatedColors = isUpdated ? {
      statCard: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
      statValue: { color: '#047857' },
      locationCard: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
      locationText: { color: '#047857' },
      infoCard: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
      description: { color: '#047857' },
    } : {};

    return (
      <View style={styles.section}>
        {titleKey && <Text style={styles.sectionTitle}>{t(titleKey)}</Text>}
        
        {/* Títol i informació bàsica */}
        <View style={styles.refugeSection}>
          <View style={styles.titleContainer}>
            <Text style={[styles.refugeTitle, isUpdated && { color: '#047857' }]}>{refuge.name}</Text>
            {refuge.departement ? (
              <Text style={[styles.departmentText, isUpdated && { color: '#059669' }]}>{refuge.departement}, {refuge.region}</Text>
            ) : null}
            <View style={styles.badgesContainer}>
              {refuge.type !== undefined && (
                <BadgeType type={refuge.type} style={{ marginRight: 8 }} />
              )}
              {(refuge.condition !== undefined && refuge.condition !== null) && (
                <BadgeCondition condition={refuge.condition} />
              )}
            </View>
          </View>
          
          {/* Stats en grid */}
          <View style={[styles.statsGrid, { marginTop: 4 }]}>
            <View style={[styles.statCard, updatedColors.statCard]}>
              <AltitudeIcon width={24} height={24} color={isUpdated ? "#047857" : "#FF6900"} />
              <Text style={styles.statLabel}>{t('refuge.details.altitude')}</Text>
              <Text style={[styles.statValue, updatedColors.statValue]}>{refuge.altitude ? `${refuge.altitude}m` : 'N/A'}</Text>
            </View>
            
            <View style={[styles.statCard, updatedColors.statCard]}>
              <UsersIcon width={24} height={24} color={isUpdated ? "#047857" : "#FF6900"} />
              <Text style={styles.statLabel}>{t('refuge.details.capacity')}</Text>
              <Text style={[styles.statValue, updatedColors.statValue]}>{refuge.places ? `${refuge.places}` : 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        {/* Descripció */}
        {refuge.description && (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.description')}</Text>
            <Text style={[styles.description, updatedColors.description]}>{refuge.description}</Text>
          </View>
        )}
        
        {/* Amenities (Equipament) */}
        {amenities && amenities.length > 0 && (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.amenities')}</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity) => (
                <View key={amenity.key} style={styles.amenityChip}>
                  <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Informació de localització */}
        {refuge.coord && (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.localisation')}</Text>
            <View style={[styles.locationCard, updatedColors.locationCard]}>
              <View style={styles.locationInfo}>
                <MapPinIcon width={16} height={16} color={isUpdated ? "#047857" : "#FF6900"} />
                <Text style={[styles.locationText, updatedColors.locationText]}>
                  {t('refuge.details.coordinates')}: {formatCoord(refuge.coord.lat, refuge.coord.long)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Enllaços si existeixen */}
        {refuge.links && refuge.links.length > 0 && (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.moreInformation')}</Text>
            {refuge.links.map((link: string, index: number) => (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(link)}>
                <View style={[styles.infoCard, updatedColors.infoCard]}>
                  <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderFieldByFieldComparison = () => {
    const refugeSnapshot = proposal.refuge_snapshot;
    const refugePayload = proposal.payload;
    if (!refugeSnapshot || !refugePayload) return null;

    const formatCoord = (lat: number, long: number) => {
      return `(${lat}, ${long})`;
    };

    const amenitiesOld = renderAmenities(refugeSnapshot.info_comp);
    const amenitiesNew = renderAmenities(refugePayload.info_comp);

    return (
      <View style={styles.section}>
        {/* Títol */}
        <View style={styles.refugeSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.refugeTitle}>{refugeSnapshot.name}</Text>
            {refugeSnapshot.name !== refugePayload.name && (
              <Text style={[styles.refugeTitle, { color: '#047857', marginTop: 8 }]}>{refugePayload.name}</Text>
            )}
            
            {refugeSnapshot.departement && (
              <Text style={styles.departmentText}>{refugeSnapshot.departement}, {refugeSnapshot.region}</Text>
            )}
            {('departement' in refugePayload && (refugeSnapshot.departement !== refugePayload.departement || refugeSnapshot.region !== refugePayload.region)) && (
              <View>
                {(refugePayload.departement || refugePayload.region) && (
                  <Text style={[styles.departmentText, { color: '#059669' }]}>
                    {refugePayload.departement || refugeSnapshot.departement}{refugePayload.departement && refugePayload.region ? ', ' : ''}{refugePayload.region || refugeSnapshot.region}
                  </Text>
                )}
                {((!refugePayload.departement && refugeSnapshot.departement) || (!refugePayload.region && refugeSnapshot.region)) && (
                  <Text style={[styles.departmentText, { color: '#DC2626', textDecorationLine: 'line-through' }]}>
                    {!refugePayload.departement && refugeSnapshot.departement ? refugeSnapshot.departement : ''}{!refugePayload.departement && refugeSnapshot.departement && !refugePayload.region && refugeSnapshot.region ? ', ' : ''}{!refugePayload.region && refugeSnapshot.region ? refugeSnapshot.region : ''}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.badgesContainer}>
              {refugeSnapshot.type !== undefined && (
                <BadgeType type={refugeSnapshot.type} style={{ marginRight: 8 }} />
              )}
              {(refugeSnapshot.condition !== undefined && refugeSnapshot.condition !== null) && (
                <BadgeCondition condition={refugeSnapshot.condition} />
              )}
            </View>
            {('type' in refugePayload || 'condition' in refugePayload) && (refugeSnapshot.type !== refugePayload.type || refugeSnapshot.condition !== refugePayload.condition) && (
              <View style={{ marginTop: 4 }}>
                {('type' in refugePayload) && ('condition' in refugePayload) && refugeSnapshot.type !== refugePayload.type && refugeSnapshot.condition !== refugePayload.condition && refugePayload.type !== undefined && refugePayload.condition !== undefined && refugePayload.condition !== null ? (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.badgeLabel}>{t('proposals.detail.newTypeAndCondition')}</Text>
                  </View>
                ) : (
                  <>
                    {('type' in refugePayload) && refugeSnapshot.type !== refugePayload.type && refugePayload.type !== undefined && (
                      <View style={{ marginBottom: 4 }}>
                        <Text style={styles.badgeLabel}>{t('proposals.detail.newType')}</Text>
                      </View>
                    )}
                    {('condition' in refugePayload) && refugeSnapshot.condition !== refugePayload.condition && refugePayload.condition !== undefined && refugePayload.condition !== null && (
                      <View style={{ marginBottom: 4 }}>
                        <Text style={styles.badgeLabel}>{t('proposals.detail.newCondition')}</Text>
                      </View>
                    )}
                  </>
                )}
                <View style={styles.badgesContainer}>
                  {refugePayload.type !== undefined && (
                    <BadgeType type={refugePayload.type} style={{ marginRight: 8 }} />
                  )}
                  {refugePayload.condition !== undefined && refugePayload.condition !== null && (
                    <BadgeCondition condition={refugePayload.condition} />
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Stats en grid */}
          <View style={[styles.statsGrid, { marginTop: 4 }]}>
            <View style={styles.statCard}>
              <AltitudeIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.altitude')}</Text>
              <Text style={styles.statValue}>{refugeSnapshot.altitude ? `${refugeSnapshot.altitude}m` : 'N/A'}</Text>
            </View>
            
            <View style={styles.statCard}>
              <UsersIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.capacity')}</Text>
              <Text style={styles.statValue}>{refugeSnapshot.places ? `${refugeSnapshot.places}` : 'N/A'}</Text>
            </View>
          </View>
          
          {(('altitude' in refugePayload && refugeSnapshot.altitude !== refugePayload.altitude) || ('places' in refugePayload && refugeSnapshot.places !== refugePayload.places)) && (
            <View style={[styles.statsGrid, { marginTop: 8 }]}>
              {('altitude' in refugePayload && refugeSnapshot.altitude !== refugePayload.altitude) ? (
                <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
                  <AltitudeGreenIcon width={24} height={24} />
                  <Text style={styles.statLabel}>{t('refuge.details.altitude')}</Text>
                  <Text style={[styles.statValue, { color: '#047857' }]}>{refugePayload.altitude ? `${refugePayload.altitude}m` : 'N/A'}</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              
              {('places' in refugePayload && refugeSnapshot.places !== refugePayload.places) ? (
                <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
                  <UsersIcon width={24} height={24} color="#047857" />
                  <Text style={styles.statLabel}>{t('refuge.details.capacity')}</Text>
                  <Text style={[styles.statValue, { color: '#047857' }]}>{refugePayload.places ? `${refugePayload.places}` : 'N/A'}</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
          )}
        </View>
        
        {/* Descripció */}
        {refugeSnapshot.description && (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.description')}</Text>
            <Text style={styles.description}>{refugeSnapshot.description}</Text>
            {('description' in refugePayload && refugeSnapshot.description !== refugePayload.description) && (
              refugePayload.description ? (
                <Text style={[styles.description, { color: '#047857', marginTop: 8 }]}>{refugePayload.description}</Text>
              ) : (
                <Text style={[styles.description, { color: '#DC2626', textDecorationLine: 'line-through', marginTop: 8 }]}>{refugeSnapshot.description}</Text>
              )
            )}
          </View>
        )}
        
        {/* Amenities */}
        {(amenitiesOld && amenitiesOld.length > 0) || (amenitiesNew && amenitiesNew.length > 0) ? (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.amenities')}</Text>
            {('info_comp' in refugePayload && JSON.stringify(refugeSnapshot.info_comp) !== JSON.stringify(refugePayload.info_comp)) ? (
              <View style={styles.amenitiesGrid}>
                {/* Show all amenities - old ones that remain, new ones in green, removed ones in red */}
                {amenitiesOld && amenitiesOld.map((amenity) => {
                  const isInNew = amenitiesNew?.some(a => a.key === amenity.key);
                  const isRemoved = !isInNew;
                  if (isRemoved) {
                    return (
                      <View key={amenity.key} style={[styles.amenityChip, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                        <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                        <Text style={[styles.amenityLabel, { color: '#DC2626', textDecorationLine: 'line-through' }]}>{amenity.label}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
                {amenitiesNew && amenitiesNew.map((amenity) => {
                  const wasInOld = amenitiesOld?.some(a => a.key === amenity.key);
                  return (
                    <View key={amenity.key} style={[styles.amenityChip, !wasInOld && { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
                      <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                      <Text style={[styles.amenityLabel, !wasInOld && { color: '#047857' }]}>{amenity.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.amenitiesGrid}>
                {amenitiesOld && amenitiesOld.map((amenity) => (
                  <View key={amenity.key} style={styles.amenityChip}>
                    <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                    <Text style={styles.amenityLabel}>{amenity.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
        
        {/* Localització */}
        {refugeSnapshot.coord && (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.localisation')}</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <MapPinIcon width={16} height={16} color="#FF6900" />
                <Text style={styles.locationText}>
                  {t('refuge.details.coordinates')}: {formatCoord(refugeSnapshot.coord.lat, refugeSnapshot.coord.long)}
                </Text>
              </View>
            </View>
            {('coord' in refugePayload && (refugeSnapshot.coord.lat !== refugePayload.coord?.lat || refugeSnapshot.coord.long !== refugePayload.coord?.long)) && refugePayload.coord && (
              <View style={[styles.locationCard, { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7', marginTop: 8 }]}>
                <View style={styles.locationInfo}>
                  <MapPinIcon width={16} height={16} color="#047857" />
                  <Text style={[styles.locationText, { color: '#047857' }]}>
                    {t('refuge.details.coordinates')}: {formatCoord(refugePayload.coord.lat, refugePayload.coord.long)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Enllaços */}
        {(refugeSnapshot.links && refugeSnapshot.links.length > 0) || (refugePayload.links && refugePayload.links.length > 0) ? (
          <View style={styles.refugeSection}>
            <Text style={styles.refugeSectionTitle}>{t('refuge.details.moreInformation')}</Text>
            {('links' in refugePayload && JSON.stringify(refugeSnapshot.links) !== JSON.stringify(refugePayload.links)) ? (
              <View>
                {/* Show removed links in red strikethrough */}
                {refugeSnapshot.links && refugeSnapshot.links.map((link: string, index: number) => {
                  const isInNew = refugePayload.links?.includes(link);
                  if (!isInNew) {
                    return (
                      <TouchableOpacity key={`old-${index}`} onPress={() => Linking.openURL(link)}>
                        <View style={[styles.infoCard, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                          <Text style={[styles.linkText, { color: '#DC2626', textDecorationLine: 'line-through' }]} numberOfLines={1}>{link}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })}
                {/* Show all new links - existing ones normal, new ones in green */}
                {refugePayload.links && refugePayload.links.map((link: string, index: number) => {
                  const wasInOld = refugeSnapshot.links?.includes(link);
                  return (
                    <TouchableOpacity key={`new-${index}`} onPress={() => Linking.openURL(link)}>
                      <View style={[styles.infoCard, !wasInOld && { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
                        <Text style={[styles.linkText, !wasInOld && { color: '#047857' }]} numberOfLines={1}>{link}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View>
                {refugeSnapshot.links && refugeSnapshot.links.map((link: string, index: number) => (
                  <TouchableOpacity key={index} onPress={() => Linking.openURL(link)}>
                    <View style={styles.infoCard}>
                      <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  const renderRefugeComparison = () => {
    if (proposal.action === 'delete') {
      const refugeSnapshot = proposal.refuge_snapshot;
      if (!refugeSnapshot) return null;
      return renderRefugeInfo(refugeSnapshot, '', false);
    }

    if (proposal.action === 'create') {
      const newRefuge = proposal.payload;
      if (!newRefuge) return null;
      return renderRefugeInfo(newRefuge, '', false);
    }

    // For update, show field-by-field comparison
    return renderFieldByFieldComparison();
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

            {/* Creator info */}
            {creator && renderUserInfo(creator, undefined, proposal.comment, formatDate(proposal.created_at))}

          </View>

          {/* Users info (reviewer). If there's no reviewer but a rejection reason, show unknown + reason */}
          {(reviewer || (proposal.status === 'rejected' && proposal.rejection_reason)) && (
            <>
              <Text style={styles.sectionTitle}>{t('proposals.detail.review')}</Text>
              {
                // Distinguish reviewer_uid cases:
                // - If reviewer_uid === 'unknown' -> show unknown user
                // - If reviewer_uid === null and reason === 'refuge has been deleted' -> show Admin
                // Otherwise show the fetched reviewer (may be null)
              }
              {(() => {
                let reviewerToShow: User | null = reviewer || null;
                if (proposal.reviewer_uid === 'unknown') {
                  // keep null so renderUserInfo will display the 'unknownUser' fallback
                  reviewerToShow = null;
                } else if (proposal.reviewer_uid == null && proposal.rejection_reason === 'refuge has been deleted') {
                  // show Admin label
                  reviewerToShow = { username: 'Admin', avatar_metadata: null } as unknown as User;
                }
                return renderUserInfo(reviewerToShow, undefined, undefined, formatDate(proposal.reviewed_at), proposal.status === 'rejected' ? proposal.rejection_reason : undefined, true);
              })()}
            </>
          )}

          {/* Separator with title */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>
              {proposal.action === 'delete' 
                ? t('proposals.detail.refugeToDelete')
                : proposal.action === 'create'
                ? t('proposals.detail.newRefuge')
                : t('proposals.detail.changes')}
            </Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Refuge comparison */}
          {renderRefugeComparison()}

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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  commentBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
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
    marginBottom: 8,
  },
  userContainerWithComment: {
    marginBottom: 8,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarWithExtraContent: {
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    fontWeight: '500',
  },
  userComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  commentRow: {
    marginTop: 4,
    paddingLeft: 44,
  },
  rejectedReasonRow: {
    marginTop: 4,
    paddingLeft: 44,
  },
  rejectedReasonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgeLabel: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  userDateContainer: {
    marginLeft: 'auto',
    paddingLeft: 12,
  },
  userDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  centeredUserContainer: {
    alignItems: 'flex-start',
    marginTop: 12,
  },
  reviewerContainer: {
    marginBottom: 24,
    marginTop: 0,
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
  refugeSection: {
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 12,
  },
  refugeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 0,
  },
  departmentText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  refugeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  amenityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  amenityLabel: {
    fontSize: 13,
    color: '#9A3412',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginHorizontal: 12,
  },
});
