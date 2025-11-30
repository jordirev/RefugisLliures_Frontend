import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { Renovation, Location } from '../models';

import { LinearGradient } from 'expo-linear-gradient';
 
// import svg icons here
import WhatsAppIcon from '../assets/icons/whatsapp.svg';
import TelegramIcon from '../assets/icons/telegram.png';
import RegionIcon from '../assets/icons/region.svg';
import CalendarIcon from '../assets/icons/calendar2.svg';

interface RenovationCardProps {
  renovation: Renovation;
  refuge?: Location;
  isUserRenovation?: boolean;
  onViewOnMap?: () => void;
  onMoreInfo?: () => void;
  onJoin?: () => void;
}

export function RenovationCard({ 
  renovation,
  refuge,
  isUserRenovation = false,
  onViewOnMap,
  onMoreInfo,
  onJoin 
}: RenovationCardProps) {

  const { t } = useTranslation();

  const handleOpenLink = () => {
    if (renovation.group_link) {
      Linking.openURL(renovation.group_link);
    }
  };

  const getGroupType = (link?: string) => {
    if (!link) return null;
    const whatsappRegex = /^https?:\/\/chat\.whatsapp\.com\/.+/i;
    const telegramRegex = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/.+/i;
    if (whatsappRegex.test(link)) return 'whatsapp';
    if (telegramRegex.test(link)) return 'telegram';
    return null;
  };

  const groupType = getGroupType(renovation.group_link);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const refugeName = refuge?.name || t('refuge.title');
  const refugeLocation = refuge?.region || refuge?.departement || t('common.unknown');
  const refugeImageUrl = refuge?.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{refugeName}</Text>
          
          <View style={styles.infoRow}>
            <RegionIcon width={16} height={16} style={styles.icon} />
            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">{refugeLocation}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <CalendarIcon width={16} height={16} style={styles.icon} />
            <Text style={styles.infoText}>
              {renovation.fin_date && formatDate(renovation.ini_date) !== formatDate(renovation.fin_date)
                ? `${formatDate(renovation.ini_date)} - ${formatDate(renovation.fin_date)}`
                : formatDate(renovation.ini_date)}
            </Text>
          </View>
        </View>
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: refugeImageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{renovation.description}</Text>
        
        {isUserRenovation && renovation.group_link && (
          <TouchableOpacity
            style={styles.groupButton}
            onPress={handleOpenLink}
          >
            {groupType === 'telegram' ? (
              <Image source={TelegramIcon} style={styles.telegramIcon} />
            ) : (
              <WhatsAppIcon width={16} height={16} style={styles.whatsappIcon} />
            )}

            <Text style={groupType === 'telegram' ? styles.telegramText : styles.whatsappText}>
              {groupType === 'telegram' ? t('renovations.join_telegram_link') : t('renovations.join_whatapp_link')}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.bottomButtonsContainer}>
          <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonOutline]}
                onPress={onViewOnMap}
              >
                <Text style={styles.buttonSecondaryText}>{t('refuge.actions.viewOnMap')}</Text>
              </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onMoreInfo}
            >
              <Text style={styles.buttonSecondaryText}>+ {t('renovations.moreInfo')}</Text>
            </TouchableOpacity>
          </View>

          {!isUserRenovation && (
            <TouchableOpacity onPress={onJoin} activeOpacity={0.9}>
              <LinearGradient
                colors={['#FF8904', '#F54900']}
                start={[0, 0]}
                end={[1, 1]}
                style={[styles.button, styles.buttonPrimaryGradient]}
              >
                <Text style={styles.buttonPrimaryText}>{t('renovations.join')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    paddingTop: 20,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Arimo',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 16,
    marginRight: 48,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  whatsappIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  telegramIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  whatsappText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '400',
  },
  telegramText: {
    fontSize: 14,
    color: '#2AABEE',
    fontWeight: '400',
  },
  bottomButtonsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  buttonSecondaryText: {
    color: '#030303ff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Arimo',
  },
  buttonPrimary: {
    // kept for compatibility; background moved to gradient
  },
  buttonPrimaryGradient: {
    borderRadius: 8,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Arimo',
  },
});
