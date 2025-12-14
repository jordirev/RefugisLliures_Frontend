import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { BadgeSelector } from '../components/BadgeSelector';
import { Location, InfoComp } from '../models';
import { RefugeProposalsService } from '../services/RefugeProposalsService';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';
import AltitudeIcon from '../assets/icons/altitude2.svg';
import UsersIcon from '../assets/icons/users.svg';

export function CreateRefugeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  // Scroll ref
  const scrollViewRef = useRef<ScrollView>(null);

  // Field refs for scroll-to-error
  const nameRef = useRef<View>(null);
  const latitudeRef = useRef<View>(null);
  const longitudeRef = useRef<View>(null);
  const regionRef = useRef<View>(null);
  const departementRef = useRef<View>(null);
  const altitudeRef = useRef<View>(null);
  const placesRef = useRef<View>(null);
  const descriptionRef = useRef<View>(null);
  const commentRef = useRef<View>(null);

  const fieldRefs: { [key: string]: React.RefObject<any> } = {
    name: nameRef,
    latitude: latitudeRef,
    longitude: longitudeRef,
    region: regionRef,
    departement: departementRef,
    altitude: altitudeRef,
    places: placesRef,
    description: descriptionRef,
    comment: commentRef,
  };

  // Form state
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [region, setRegion] = useState('');
  const [departement, setDepartement] = useState('');
  const [type, setType] = useState<string>('non gardé');
  const [condition, setCondition] = useState<number>(1);
  const [altitude, setAltitude] = useState('');
  const [places, setPlaces] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState<{
    name?: string;
    latitude?: string;
    longitude?: string;
    region?: string;
    departement?: string;
    altitude?: string;
    places?: string;
    description?: string;
    comment?: string;
  }>({});

  // Amenities state
  const [amenities, setAmenities] = useState<InfoComp>({
    manque_un_mur: false,
    cheminee: false,
    poele: false,
    couvertures: false,
    latrines: false,
    bois: false,
    eau: false,
    matelas: false,
    couchage: false,
    bas_flancs: false,
    lits: false,
    mezzanine_etage: false,
  });

  const isFormValid = name.trim() !== '' && latitude.trim() !== '' && longitude.trim() !== '';

  const scrollToError = (errorFields: string[]) => {
    if (errorFields.length === 0 || !scrollViewRef.current) return;

    const firstErrorField = errorFields[0];
    const fieldRef = fieldRefs[firstErrorField];

    if (fieldRef?.current) {
      fieldRef.current.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => {
          // Fallback if measureLayout fails
          console.warn(`Could not measure layout for field: ${firstErrorField}`);
        }
      );
    }
  };

  const handleImagePress = () => {
    showAlert(
      t('createRefuge.photoAlert.title'),
      t('createRefuge.photoAlert.message'),
      [{ text: t('common.ok'), onPress: hideAlert }]
    );
  };

  const handleAmenityToggle = (key: keyof InfoComp) => {
    setAmenities(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddLink = () => {
    setLinks([...links, '']);
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks.length === 0 ? [''] : newLinks);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validar nom (obligatori, màxim 100 caràcters)
    if (!name.trim()) {
      newErrors.name = t('createRefuge.errors.nameRequired');
    } else if (name.length > 100) {
      newErrors.name = t('createRefuge.errors.nameTooLong');
    }

    // Validar latitud (obligatori, número vàlid)
    if (!latitude.trim()) {
      newErrors.latitude = t('createRefuge.errors.latitudeRequired');
    } else if (isNaN(parseFloat(latitude))) {
      newErrors.latitude = t('createRefuge.errors.latitudeInvalid');
    }

    // Validar longitud (obligatori, número vàlid)
    if (!longitude.trim()) {
      newErrors.longitude = t('createRefuge.errors.longitudeRequired');
    } else if (isNaN(parseFloat(longitude))) {
      newErrors.longitude = t('createRefuge.errors.longitudeInvalid');
    }

    // Validar regió (màxim 100 caràcters)
    if (region.length > 100) {
      newErrors.region = t('createRefuge.errors.regionTooLong');
    }

    // Validar departement (màxim 100 caràcters)
    if (departement.length > 100) {
      newErrors.departement = t('createRefuge.errors.departementTooLong');
    }

    // Validar altitud (enter positiu, màxim 8800)
    if (altitude.trim()) {
      const altNum = parseInt(altitude);
      if (isNaN(altNum) || altNum < 0 || !Number.isInteger(parseFloat(altitude))) {
        newErrors.altitude = t('createRefuge.errors.altitudeInvalid');
      } else if (altNum > 8800) {
        newErrors.altitude = t('createRefuge.errors.altitudeTooHigh');
      }
    }

    // Validar places (enter positiu)
    if (places.trim()) {
      const placesNum = parseInt(places);
      if (isNaN(placesNum) || placesNum < 0 || !Number.isInteger(parseFloat(places))) {
        newErrors.places = t('createRefuge.errors.placesInvalid');
      }
    }

    // Validar descripció (màxim 3000 caràcters)
    if (description.length > 3000) {
      newErrors.description = t('createRefuge.errors.descriptionTooLong');
    }

    // Validar comentari (màxim 3000 caràcters)
    if (comment.length > 3000) {
      newErrors.comment = t('createRefuge.errors.commentTooLong');
    }

    setErrors(newErrors);
    
    // Scroll to first error if there are any
    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors));
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create Location object
      const refugeData: Location = {
        id: '', // Will be generated by backend
        name: name.trim(),
        coord: {
          lat: parseFloat(latitude),
          long: parseFloat(longitude),
        },
        altitude: altitude ? parseInt(altitude) : undefined,
        places: places ? parseInt(places) : undefined,
        type: type,
        condition: condition,
        region: region.trim() || undefined,
        departement: departement.trim() || undefined,
        description: description.trim() || undefined,
        links: links.filter(link => link.trim() !== ''),
        info_comp: amenities,
      };

      // Call the service
      await RefugeProposalsService.proposalCreateRefuge(refugeData, comment.trim() || undefined);

      // Success
      showAlert(
        t('createRefuge.success.title'),
        t('createRefuge.success.message'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              hideAlert();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating refuge proposal:', error);
      showAlert(
        t('common.error'),
        error.message || t('createRefuge.error.generic')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const amenityList: Array<{ key: keyof InfoComp; icon: string }> = [
    { key: 'manque_un_mur', icon: '🏚️' },
    { key: 'cheminee', icon: '🔥' },
    { key: 'poele', icon: '🍳' },
    { key: 'couvertures', icon: '🛏️' },
    { key: 'latrines', icon: '🚽' },
    { key: 'bois', icon: '🪵' },
    { key: 'eau', icon: '💧' },
    { key: 'matelas', icon: '🛌' },
    { key: 'couchage', icon: '😴' },
    { key: 'bas_flancs', icon: '🪜' },
    { key: 'lits', icon: '🛏️' },
    { key: 'mezzanine_etage', icon: '⬆️' },
  ];

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('createRefuge.title')}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info text about proposal */}
        <Text style={styles.infoText}>{t('createRefuge.proposalInfo')}</Text>

        {/* Default image */}
        <TouchableOpacity onPress={handleImagePress} activeOpacity={0.7}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Coordinates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createRefuge.coordinates')}</Text>
          <View style={styles.coordsRow}>
            <View style={styles.coordInput} ref={latitudeRef}>
              <Text style={styles.inputLabel}>
                {t('createRefuge.latitude')} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.latitude && styles.textInputError]}
                value={latitude}
                onChangeText={(text) => {
                  setLatitude(text);
                  if (errors.latitude) setErrors({ ...errors, latitude: undefined });
                }}
                placeholder="42.1234"
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
              {errors.latitude && <Text style={styles.errorText}>{errors.latitude}</Text>}
            </View>
            <View style={styles.coordInput} ref={longitudeRef}>
              <Text style={styles.inputLabel}>
                {t('createRefuge.longitude')} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.longitude && styles.textInputError]}
                value={longitude}
                onChangeText={(text) => {
                  setLongitude(text);
                  if (errors.longitude) setErrors({ ...errors, longitude: undefined });
                }}
                placeholder="1.12345"
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
              {errors.longitude && <Text style={styles.errorText}>{errors.longitude}</Text>}
            </View>
          </View>
        </View>

        {/* Name */}
        <View style={styles.section} ref={nameRef}>
          <Text style={styles.inputLabel}>
            {t('createRefuge.namePlaceholder')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.nameInput, errors.name && styles.textInputError]}
            value={name}
            onChangeText={(text) => {
              if (text.length <= 100) {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }
            }}
            placeholder={t('createRefuge.namePlaceholder')}
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Region and Departement */}
        <View style={styles.section}>
          <View style={styles.regionRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.textInput, styles.regionInput, errors.region && styles.textInputError]}
                value={region}
                onChangeText={(text) => {
                  if (text.length <= 100) {
                    setRegion(text);
                    if (errors.region) setErrors({ ...errors, region: undefined });
                  }
                }}
                placeholder={t('createRefuge.regionPlaceholder')}
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
              {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
            </View>
            <Text style={styles.regionSeparator}>,</Text>
            <View style={{ flex: 1 }} ref={regionRef}>
              <TextInput
                style={[styles.textInput, styles.regionInput, errors.departement && styles.textInputError]}
                value={departement}
                onChangeText={(text) => {
                  if (text.length <= 100) {
                    setDepartement(text);
                    if (errors.departement) setErrors({ ...errors, departement: undefined });
                  }
                }}
                placeholder={t('createRefuge.departementPlaceholder')}
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
              {errors.departement && <Text style={styles.errorText}>{errors.departement}</Text>}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, errors.altitude && styles.statCardError]} ref={altitudeRef}>
              <AltitudeIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.altitude')} (m)</Text>
              <TextInput
                style={styles.statInput}
                value={altitude}
                onChangeText={(text) => {
                  setAltitude(text);
                  if (errors.altitude) setErrors({ ...errors, altitude: undefined });
                }}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />
              {errors.altitude && <Text style={styles.errorTextStat}>{errors.altitude}</Text>}
            </View>

            <View style={[styles.statCard, errors.places && styles.statCardError]} ref={placesRef}>
              <UsersIcon width={24} height={24} color="#FF6900" />
              <Text style={styles.statLabel}>{t('refuge.details.capacity')}</Text>
              <TextInput
                style={styles.statInput}
                value={places}
                onChangeText={(text) => {
                  setPlaces(text);
                  if (errors.places) setErrors({ ...errors, places: undefined });
                }}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />
              {errors.places && <Text style={styles.errorTextStat}>{errors.places}</Text>}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section} ref={descriptionRef}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>{t('refuge.details.description')}</Text>
            <Text style={styles.charCounter}>{description.length}/3000</Text>
          </View>
          <TextInput
            style={[styles.descriptionInput, errors.description && styles.textInputError]}
            value={description}
            onChangeText={(text) => {
              if (text.length <= 3000) {
                setDescription(text);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }
            }}
            placeholder={t('createRefuge.descriptionPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={3000}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('refuge.details.amenities')}</Text>
          <View style={styles.amenitiesGrid}>
            {amenityList.map((amenity) => (
              <TouchableOpacity
                key={amenity.key}
                style={[
                  styles.amenityChip,
                  amenities[amenity.key] && styles.amenityChipSelected,
                ]}
                onPress={() => handleAmenityToggle(amenity.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                <Text
                  style={[
                    styles.amenityLabel,
                    amenities[amenity.key] && styles.amenityLabelSelected,
                  ]}
                >
                  {t(`refuge.amenities.${amenity.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createRefuge.links')}</Text>
          {links.map((link, index) => (
            <View key={index} style={styles.linkRow}>
              <TextInput
                style={[styles.textInput, styles.linkInput]}
                value={link}
                onChangeText={(value) => handleLinkChange(index, value)}
                placeholder={t('createRefuge.linkPlaceholder')}
                placeholderTextColor="#9CA3AF"
              />
              {links.length > 1 && (
                <TouchableOpacity
                  style={styles.removeLinkButton}
                  onPress={() => handleRemoveLink(index)}
                >
                  <Text style={styles.removeLinkText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addLinkButton} onPress={handleAddLink}>
            <Text style={styles.addLinkText}>+ {t('createRefuge.addLink')}</Text>
          </TouchableOpacity>
        </View>

        {/* Comment for admins */}
        <View style={styles.section} ref={commentRef}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>{t('createRefuge.adminComment')}</Text>
            <Text style={styles.charCounter}>{comment.length}/3000</Text>
          </View>
          <TextInput
            style={[styles.descriptionInput, errors.comment && styles.textInputError]}
            value={comment}
            onChangeText={(text) => {
              if (text.length <= 3000) {
                setComment(text);
                if (errors.comment) setErrors({ ...errors, comment: undefined });
              }
            }}
            placeholder={t('createRefuge.adminCommentPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={3000}
          />
          {errors.comment && <Text style={styles.errorText}>{errors.comment}</Text>}
        </View>

        {/* Submit button */}
        <View style={styles.buttonContainer}>
          {isFormValid ? (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6900', '#FF8533']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? t('common.loading') : t('createRefuge.submit')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.submitButtonDisabled}>
              <Text style={styles.submitButtonTextDisabled}>{t('createRefuge.submit')}</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Alert */}
      {alertVisible && alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
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
  scrollView: {
    flex: 1,
    marginTop: 60,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  headerImage: {
    width: '100%',
    height: 240,
    opacity: 0.7,
    marginTop: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionInput: {
    flex: 1,
  },
  regionSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  statInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    minWidth: 60,
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  amenityChipSelected: {
    backgroundColor: '#FFF5ED',
    borderColor: '#FF6900',
  },
  amenityIcon: {
    fontSize: 14,
  },
  amenityLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  amenityLabelSelected: {
    color: '#1F2937',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  linkInput: {
    flex: 1,
  },
  removeLinkButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
  },
  removeLinkText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  addLinkButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addLinkText: {
    fontSize: 14,
    color: '#FF6900',
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9FAFB',
    zIndex: 5,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  textInputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  statCardError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  errorTextStat: {
    color: '#EF4444',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  charCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
