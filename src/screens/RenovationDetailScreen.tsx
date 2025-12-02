import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { RefugeCard } from '../components/RefugeCard';
import { CustomAlert } from '../components/CustomAlert';
import { Renovation, Location, User } from '../models';
import { RenovationService } from '../services/RenovationService';
import { RefugisService } from '../services/RefugisService';
import { UsersService } from '../services/UsersService';
import { mapRenovationFromDTO } from '../services/mappers/RenovationMapper';

// Icons
import CalendarIcon from '../assets/icons/calendar2.svg';
import ToolsIcon from '../assets/icons/reform.svg';
import DescriptionIcon from '../assets/icons/description.svg';
import WhatsAppIcon from '../assets/icons/whatsapp-white.png';
import TelegramIcon from '../assets/icons/telegram-white.png';
import PeopleIcon from '../assets/icons/user.svg';
import BackIcon from '../assets/icons/arrow-left.svg';
import EditIcon from '../assets/icons/edit.svg';
import CrossIcon from '../assets/icons/x.svg';
import TrashIcon from '../assets/icons/trash.svg';

type RenovationDetailScreenRouteProp = RouteProp<
  { RenovationDetail: { renovationId: string } },
  'RenovationDetail'
>;

export function RenovationDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 40 + insets.top;
  const navigation = useNavigation<any>();
  const route = useRoute<RenovationDetailScreenRouteProp>();
  const { firebaseUser } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [renovation, setRenovation] = useState<Renovation | null>(null);
  const [refuge, setRefuge] = useState<Location | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [creator, setCreator] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const renovationId = route.params?.renovationId;

  useFocusEffect(
    useCallback(() => {
      if (renovationId) {
        loadRenovationDetails();
      }
    }, [renovationId])
  );

  const loadRenovationDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load renovation
      const renovationDTO = await RenovationService.getRenovationById(renovationId);
      const mappedRenovation = mapRenovationFromDTO(renovationDTO);
      setRenovation(mappedRenovation);

      // Load refuge
      const refugeData = await RefugisService.getRefugiById(mappedRenovation.refuge_id);
      setRefuge(refugeData);

      // Load creator
      const creatorData = await UsersService.getUserByUid(mappedRenovation.creator_uid);
      setCreator(creatorData);

      // Load participants if user is creator or participant
      if (firebaseUser) {
        const isCreator = mappedRenovation.creator_uid === firebaseUser.uid;
        const isParticipant = mappedRenovation.participants_uids?.includes(firebaseUser.uid);
        
        if (isCreator || isParticipant) {
          await loadParticipants(mappedRenovation.participants_uids || []);
        }
      }
    } catch (error) {
      console.error('Error loading renovation details:', error);
      showAlert(t('common.error'), t('renovations.errorLoadingDetails'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = async (participantUids: string[]) => {
    try {
      const participantsData = await Promise.all(
        participantUids.map(uid => UsersService.getUserByUid(uid))
      );
      setParticipants(participantsData.filter(p => p !== null) as User[]);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const isUserCreator = firebaseUser && renovation && renovation.creator_uid === firebaseUser.uid;
  const isUserParticipant = firebaseUser && renovation && renovation.participants_uids?.includes(firebaseUser.uid);
  const canSeeParticipants = isUserCreator || isUserParticipant;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getGroupType = (link?: string) => {
    if (!link) return null;
    const whatsappRegex = /^https?:\/\/chat\.whatsapp\.com\/.+/i;
    const telegramRegex = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/.+/i;
    if (whatsappRegex.test(link)) return 'whatsapp';
    if (telegramRegex.test(link)) return 'telegram';
    return null;
  };

  const handleOpenLink = () => {
    if (renovation?.group_link) {
      Linking.openURL(renovation.group_link);
    }
  };

  const handleJoinRenovation = async () => {
    if (!renovation) return;

    try {
      setIsJoining(true);
      const updatedRenovationDTO = await RenovationService.joinRenovation(renovation.id);
      const updatedRenovation = mapRenovationFromDTO(updatedRenovationDTO);
      setRenovation(updatedRenovation);
      
      // Reload participants
      await loadParticipants(updatedRenovation.participants_uids || []);
    } catch (error: any) {
      showAlert(t('common.error'), error.message || t('renovations.errorJoining'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRenovation = async () => {
    if (!renovation || !firebaseUser) return;

    showAlert(
      t('renovations.leaveRenovation'),
      t('renovations.confirmLeave'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('renovations.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLeaving(true);
              const updatedRenovationDTO = await RenovationService.removeParticipant(
                renovation.id,
                firebaseUser.uid
              );
              const updatedRenovation = mapRenovationFromDTO(updatedRenovationDTO);
              setRenovation(updatedRenovation);
              
              // Reload participants
              await loadParticipants(updatedRenovation.participants_uids || []);
            } catch (error: any) {
              showAlert(t('common.error'), error.message || t('renovations.errorLeaving'));
            } finally {
              setIsLeaving(false);
            }
          }
        }
      ]
    );
  };

  const handleRemoveParticipant = async (participantUid: string, participantName: string) => {
    if (!renovation) return;

    showAlert(
      t('renovations.removeParticipant'),
      t('renovations.confirmRemoveParticipant', { name: participantName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRenovationDTO = await RenovationService.removeParticipant(
                renovation.id,
                participantUid
              );
              const updatedRenovation = mapRenovationFromDTO(updatedRenovationDTO);
              setRenovation(updatedRenovation);
              
              // Reload participants
              await loadParticipants(updatedRenovation.participants_uids || []);
            } catch (error: any) {
              showAlert(t('common.error'), error.message || t('renovations.errorRemovingParticipant'));
            }
          }
        }
      ]
    );
  };

  const handleEditRenovation = () => {
    if (!renovation) return;
    navigation.navigate('EditRenovation', { renovationId: renovation.id });
  };

  const handleDeleteRenovation = () => {
    if (!renovation) return;

    showAlert(
      t('renovations.deleteRenovation'),
      t('renovations.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await RenovationService.deleteRenovation(renovation.id);
              navigation.navigate('Renovations');
              setIsDeleting(false);
            } catch (error: any) {
              showAlert(t('common.error'), error.message || t('renovations.errorDeleting'));
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleViewOnMap = () => {
    if (refuge) {
      navigation.navigate('Map', { selectedRefuge: refuge });
    }
  };

  const groupType = getGroupType(renovation?.group_link);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!renovation || !refuge) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{t('renovations.notFound')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
      <View style={styles.root}>
        {/* Fixed header */}
        <View style={styles.headerFixed}>
          <SafeAreaView edges={['top']} style={styles.safeArea} />
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Renovations')} style={styles.backIconButton}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('renovations.details')}</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + 16, paddingBottom: Math.max(insets.bottom + 16, 32) }]}
        >

        {/* Refuge Card */}
        <View style={styles.refugeCardContainer}>
          <RefugeCard
            refuge={refuge}
            onPress={() => navigation.navigate('RefugeDetail', { refuge, from: 'RenovationDetail' })}
            onViewMap={handleViewOnMap}
          />
        </View>

        {/* Renovation Details */}
        <View style={styles.detailsCard}>
          {/* Dates Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CalendarIcon width={20} height={20} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{t('renovations.duration')}</Text>
            </View>
            <View style={styles.datesContainer}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>{t('renovations.startDate')}</Text>
                <Text style={styles.dateValue}>{formatDate(renovation.ini_date)}</Text>
              </View>
              <View style={styles.dateArrow}>
                <Text style={styles.dateArrowText}>→</Text>
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>{t('renovations.endDate')}</Text>
                <Text style={styles.dateValue}>{formatDate(renovation.fin_date)}</Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DescriptionIcon width={20} height={20} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{t('renovations.description')}</Text>
            </View>
            <Text 
              style={styles.descriptionText}
              numberOfLines={descriptionExpanded ? undefined : 4}
            >
              {renovation.description}
            </Text>
            {renovation.description && renovation.description.length > 200 && (
              <TouchableOpacity 
                onPress={() => setDescriptionExpanded(!descriptionExpanded)} 
                style={styles.readMoreButton}
                activeOpacity={0.7}
              >
                <Text style={styles.readMoreText}>
                  {descriptionExpanded ? t('common.showLess') : t('common.readMore')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Materials Needed Section */}
          {renovation.materials_needed && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ToolsIcon width={20} height={20} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>{t('renovations.materialsNeeded')}</Text>
              </View>
              <Text style={styles.materialsText}>{renovation.materials_needed}</Text>
            </View>
          )}

          {/* Group Link Section - Only show if user is creator */}
          {canSeeParticipants && renovation.group_link && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.groupLinkButton,
                  groupType === 'telegram' ? styles.telegramButton : styles.whatsappButton
                ]}
                onPress={handleOpenLink}
              >
                {groupType === 'telegram' ? (
                  <Image source={TelegramIcon} style={[styles.groupIcon, { width: 20, height: 20 }]} />
                ) : (
                  <Image source={WhatsAppIcon} style={[styles.groupIcon, { width: 24, height: 24 }]} />
                )}
                <Text style={styles.groupLinkText}>
                  {groupType === 'telegram' 
                    ? t('renovations.join_telegram_link') 
                    : t('renovations.join_whatapp_link')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Creator Section */}
          {creator && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <PeopleIcon width={20} height={20} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>{t('renovations.organizer')}</Text>
              </View>
              <View style={styles.creatorContainer}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {creator.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                {isUserCreator ? (
                  <Text style={styles.creatorName}>{t('common.you')}</Text>
                ) : (
                  <Text style={styles.creatorName}>{creator.username}</Text>
                )}
              </View>
            </View>
          )}

          {/* Participants List */}
          {canSeeParticipants && participants.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <PeopleIcon width={20} height={20} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>
                  {t('renovations.participants')} ({participants.length})
                </Text>
              </View>
              <View style={styles.participantsList}>
                {participants.map((participant) => (
                  <View key={participant.uid} style={styles.participantItem}>
                    <View style={styles.participantInfo}>
                      <View style={styles.participantAvatar}>
                        <Text style={styles.participantAvatarText}>
                          {participant.username?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <Text style={styles.participantName}>{participant.username}</Text>
                    </View>
                    {isUserCreator && (
                      <TouchableOpacity
                        style={styles.removeParticipantButton}
                        onPress={() => handleRemoveParticipant(participant.uid, participant.username)}
                      >
                        <CrossIcon width={18} height={18} color={'red'} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Join/Leave Button */}
          {!isUserCreator && (
            <View style={styles.section}>
              {isUserParticipant ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.leaveButton]}
                  onPress={handleLeaveRenovation}
                  disabled={isLeaving}
                >
                  {isLeaving ? (
                    <ActivityIndicator color="#6B7280" />
                  ) : (
                    <Text style={styles.leaveButtonText}>{t('renovations.leave')}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleJoinRenovation} activeOpacity={0.9} disabled={isJoining}>
                  <LinearGradient
                    colors={['#FF8904', '#F54900']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={[styles.actionButton, styles.joinButton]}
                  >
                    {isJoining ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.joinButtonText}>{t('renovations.join')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Creator Actions */}
          {isUserCreator && (
            <View style={styles.creatorActionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEditRenovation}
              >
                <EditIcon width={20} height={20} style={styles.editIcon} />
                <Text style={styles.editButtonText}>{t('common.edit')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteRenovation}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#DC2626" />
                ) : (
                  <>
                    <TrashIcon width={20} height={20} style={styles.deleteIcon} />
                    <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig?.title}
        message={alertConfig?.message || ''}
        buttons={alertConfig?.buttons}
        onDismiss={hideAlert}
      />

      {/* Bottom safe-area filler to ensure a visible (non-transparent) area behind home indicator */}
        {insets.bottom > 0 && (
          <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
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
  backIconButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Arimo',
    color: '#111827',
  },
  refugeCardContainer: {
    marginTop: 16,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
    color: '#F97316',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Arimo',
    color: '#111827',
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
  },
  dateBox: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontFamily: 'Arimo',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    fontFamily: 'Arimo',
  },
  dateArrow: {
    paddingHorizontal: 8,
  },
  dateArrowText: {
    fontSize: 24,
    color: '#F97316',
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontFamily: 'Arimo',
  },
  readMoreButton: {
    marginTop: 2,
    paddingVertical: 4,
  },
  readMoreText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  materialsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontFamily: 'Arimo',
    fontStyle: 'italic',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arimo',
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Arimo',
  },
  groupLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  telegramButton: {
    backgroundColor: '#0088CC',
  },
  groupIcon: {
    marginRight: 8,
    width: 20,
    height: 20,
  },
  groupLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arimo',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  joinButton: {
    // gradient applied via LinearGradient
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arimo',
  },
  leaveButton: {
    backgroundColor: '#E5E7EB',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Arimo',
  },
  participantsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arimo',
  },
  participantName: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Arimo',
  },
  removeParticipantButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  creatorActionsSection: {
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editIcon: {
    marginRight: 8,
    color: '#374151',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Arimo',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  deleteIcon: {
    marginRight: 8,
    color: '#FF0000',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    fontFamily: 'Arimo',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Arimo',
  },
  backButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arimo',
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
