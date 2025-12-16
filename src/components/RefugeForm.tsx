import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { Location, InfoComp } from '../models';
import { BadgeSelector } from './BadgeSelector';
import { BadgeType } from './BadgeType';
import { BadgeCondition } from './BadgeCondition';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { ProposalCommentInput } from './ProposalCommentInput';

// Icons
import AltitudeIcon from '../assets/icons/altitude2.svg';
import UsersIcon from '../assets/icons/users.svg';

interface RefugeFormProps {
  mode: 'create' | 'edit';
  initialData?: Location;
  onSubmit: (data: Location | Partial<Location>, comment?: string) => Promise<void>;
  onCancel: () => void;
}

export function RefugeForm({ mode, initialData, onSubmit, onCancel }: RefugeFormProps) {
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

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
  const linksRef = useRef<View>(null);

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
    links: linksRef,
  };

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [latitude, setLatitude] = useState(initialData?.coord.lat.toString() || '');
  const [longitude, setLongitude] = useState(initialData?.coord.long.toString() || '');
  const [region, setRegion] = useState(initialData?.region || '');
  const [departement, setDepartement] = useState(initialData?.departement || '');
  const [type, setType] = useState<string>(initialData?.type || 'non gardé');
  const [condition, setCondition] = useState<number>(initialData?.condition ?? 1);
  const [altitude, setAltitude] = useState(initialData?.altitude?.toString() || '');
  const [places, setPlaces] = useState(initialData?.places?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [links, setLinks] = useState<string[]>(
    initialData?.links && initialData.links.length > 0 ? initialData.links : ['']
  );
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Badge selector state
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [conditionExpanded, setConditionExpanded] = useState(false);

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
    links?: string;
  }>({});

  // Amenities state
  const defaultAmenities: InfoComp = {
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
  };

  const [amenities, setAmenities] = useState<InfoComp>(
    initialData?.info_comp || defaultAmenities
  );

  // Track if any field has been edited (for edit mode)
  const [hasChanges, setHasChanges] = useState(false);

  // Track edited state for each field
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const hasNameChanged = name !== (initialData.name || '');
      const hasLatChanged = latitude !== (initialData.coord.lat.toString() || '');
      const hasLongChanged = longitude !== (initialData.coord.long.toString() || '');
      const hasRegionChanged = region !== (initialData.region || '');
      const hasDeptChanged = departement !== (initialData.departement || '');
      const hasTypeChanged = type !== (initialData.type || 'non gardé');
      const hasConditionChanged = condition !== (initialData.condition ?? 1);
      const hasAltChanged = altitude !== (initialData.altitude?.toString() || '');
      const hasPlacesChanged = places !== (initialData.places?.toString() || '');
      const hasDescChanged = description !== (initialData.description || '');
      
      // Compare links
      const originalLinks = initialData.links || [];
      const currentLinks = links.filter(l => l.trim() !== '');
      const hasLinksChanged = 
        originalLinks.length !== currentLinks.length ||
        originalLinks.some((link, idx) => link !== currentLinks[idx]);

      // Compare amenities
      const originalAmenities = initialData.info_comp || defaultAmenities;
      const hasAmenitiesChanged = Object.keys(defaultAmenities).some(
        key => amenities[key as keyof InfoComp] !== originalAmenities[key as keyof InfoComp]
      );

      const changed =
        hasNameChanged ||
        hasLatChanged ||
        hasLongChanged ||
        hasRegionChanged ||
        hasDeptChanged ||
        hasTypeChanged ||
        hasConditionChanged ||
        hasAltChanged ||
        hasPlacesChanged ||
        hasDescChanged ||
        hasLinksChanged ||
        hasAmenitiesChanged;

      setHasChanges(changed);
    }
  }, [
    mode,
    name,
    latitude,
    longitude,
    region,
    departement,
    type,
    condition,
    altitude,
    places,
    description,
    links,
    amenities,
    initialData,
  ]);

  const isFormValid =
    name.trim() !== '' && latitude.trim() !== '' && longitude.trim() !== '';
  const canSubmit = mode === 'create' ? isFormValid : isFormValid && hasChanges;

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
    setAmenities((prev) => ({
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

    // Validar latitud (obligatori, número vàlid amb com a mínim 3 decimals)
    if (!latitude.trim() && mode === 'create') {
      newErrors.latitude = t('createRefuge.errors.latitudeRequired');
    } else if (latitude.includes(',')) {
      newErrors.latitude = t('createRefuge.errors.invalidColon');
    } else {
      const latTrim = latitude.trim();
      const latRegex = /^-?\d+\.\d{3,}$/; // at least 3 decimals
      if (!latRegex.test(latTrim)) {
        newErrors.latitude = t('createRefuge.errors.latitudeAtLeast3Decimals');
      }
    }

    // Validar longitud (obligatori, número vàlid amb com a mínim 3 decimals)
    if (!longitude.trim() && mode === 'create') {
      newErrors.longitude = t('createRefuge.errors.longitudeRequired');
    } else if (longitude.includes(',')) {
      newErrors.longitude = t('createRefuge.errors.invalidColon');
    } else {
      const longTrim = longitude.trim();
      const longRegex = /^-?\d+\.\d{3,}$/; // at least 3 decimals
      if (!longRegex.test(longTrim)) {
        newErrors.longitude = t('createRefuge.errors.longitudeAtLeast3Decimals');
      }
    }

    // Validar regió (màxim 100 caràcters)
    if (region.length > 100) {
      newErrors.region = t('createRefuge.errors.regionTooLong');
    }

    // Validar departement (màxim 100 caràcters)
    if (departement.length > 100) {
      newErrors.departement = t('createRefuge.errors.departementTooLong');
    }

    // Validar altitud (enter positiu, sense comes ni punts, màxim 8800)
    if (altitude.trim()) {
      const altTrim = altitude.trim();
      if (!/^[0-9]+$/.test(altTrim)) {
        newErrors.altitude = t('createRefuge.errors.altitudeInvalid');
      } else {
        const altNum = parseInt(altTrim, 10);
        if (altNum < 0) {
          newErrors.altitude = t('createRefuge.errors.altitudeInvalid');
        } else if (altNum > 8800) {
          newErrors.altitude = t('createRefuge.errors.altitudeTooHigh');
        }
      }
    }

    // Validar places (enter positiu, sense comes ni punts)
    if (places.trim()) {
      const placesTrim = places.trim();
      if (!/^[0-9]+$/.test(placesTrim)) {
        newErrors.places = t('createRefuge.errors.placesInvalid');
      } else {
        const placesNum = parseInt(placesTrim, 10);
        if (placesNum < 0) {
          newErrors.places = t('createRefuge.errors.placesInvalid');
        }
      }
    }

    // Validar descripció (màxim 3000 caràcters)
    if (description.length > 3000) {
      newErrors.description = t('createRefuge.errors.descriptionTooLong');
    }

    // Validar comentari
    if (mode === 'edit') {
      // En mode edit, el comentari és obligatori amb mínim 50 caràcters
      if (!comment.trim()) {
        newErrors.comment = t('editRefuge.errors.commentRequired');
      } else if (comment.trim().length < 50) {
        newErrors.comment = t('editRefuge.errors.commentTooShort', { min: 50 });
      } else if (comment.length > 3000) {
        newErrors.comment = t('createRefuge.errors.commentTooLong');
      }
    } else {
      // En mode create, el comentari és opcional però màxim 3000 caràcters
      if (comment.length > 3000) {
        newErrors.comment = t('createRefuge.errors.commentTooLong');
      }
    }

    // Validate links: ensure any provided link looks like a URL
    const currentLinks = links.filter((l) => l.trim() !== '');
    if (currentLinks.length > 0 && !newErrors.links) {
      const urlRegex = /^(https?:\/\/|www\.)[^\s]+$/i;
      for (let i = 0; i < currentLinks.length; i++) {
        if (!urlRegex.test(currentLinks[i].trim())) {
          newErrors.links = t('createRefuge.errors.linkInvalid') || 'Invalid link format';
          break;
        }
      }
    }

    setErrors(newErrors);

    // Scroll to first error if there are any
    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors));
    }

    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): Location | Partial<Location> => {
    if (mode === 'create') {
      // For create mode, return full Location
      const refugeData: Location = {
        id: '',
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
        links: links.filter((link) => link.trim() !== ''),
        info_comp: amenities,
      };
      return refugeData;
    } else {
      // For edit mode, return only changed fields
      const payload: Partial<Location> = {};

      if (name !== (initialData?.name || '')) {
        payload.name = name.trim();
      }
      if (latitude !== (initialData?.coord.lat.toString() || '') ||
          longitude !== (initialData?.coord.long.toString() || '')) {
        payload.coord = {
          lat: parseFloat(latitude),
          long: parseFloat(longitude),
        };
      }
      if (region !== (initialData?.region || '')) {
        payload.region = region.trim() || null;
      }
      if (departement !== (initialData?.departement || '')) {
        payload.departement = departement.trim() || null;
      }
      if (type !== (initialData?.type || 'non gardé')) {
        payload.type = type;
      }
      if (condition !== (initialData?.condition ?? 1)) {
        payload.condition = condition;
      }
      if (altitude !== (initialData?.altitude?.toString() || '')) {
        payload.altitude = altitude ? parseInt(altitude) : null;
      }
      if (places !== (initialData?.places?.toString() || '')) {
        payload.places = places ? parseInt(places) : null;
      }
      if (description !== (initialData?.description || '')) {
        payload.description = description.trim() || null;
      }

      // Check links changes
      const originalLinks = initialData?.links || [];
      const currentLinks = links.filter((l) => l.trim() !== '');
      const hasLinksChanged =
        originalLinks.length !== currentLinks.length ||
        originalLinks.some((link, idx) => link !== currentLinks[idx]);
      if (hasLinksChanged) {
        payload.links = currentLinks.length > 0 ? currentLinks : [];
      }

      // Check amenities changes
      const originalAmenities = initialData?.info_comp || defaultAmenities;
      const hasAmenitiesChanged = Object.keys(defaultAmenities).some(
        (key) => amenities[key as keyof InfoComp] !== originalAmenities[key as keyof InfoComp]
      );
      if (hasAmenitiesChanged) {
        payload.info_comp = amenities;
      }

      return payload;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = buildPayload();
      await onSubmit(payload, comment.trim() || undefined);

      // Success
      const successTitle = mode === 'create' 
        ? t('createRefuge.success.title')
        : t('editRefuge.success.title');
      const successMessage = mode === 'create'
        ? t('createRefuge.success.message')
        : t('editRefuge.success.message');

      showAlert(successTitle, successMessage, [
        {
          text: t('common.ok'),
          onPress: () => {
            hideAlert();
            onCancel(); // Go back
          },
        },
      ]);
    } catch (error: any) {
      // Skip showing alert if error is about coordinates
      const errorMessage = error.message || '';
      const isCoordError = /Cannot read property '(long|lat|coord)' of undefined/i.test(errorMessage) ||
                           /coord/i.test(errorMessage);
      
      if (!isCoordError) {
        console.error('Error submitting refuge proposal:', error);
        showAlert(t('common.error'), errorMessage || t('createRefuge.error.generic'));
      }
      else{
        // Success
        const successTitle = mode === 'create' 
          ? t('createRefuge.success.title')
          : t('editRefuge.success.title');
        const successMessage = mode === 'create'
          ? t('createRefuge.success.message')
          : t('editRefuge.success.message');
        showAlert(successTitle, successMessage, [
        {
          text: t('common.ok'),
          onPress: () => {
            hideAlert();
            onCancel(); // Go back
          },
        },
      ]);
      }
    } finally {
      setIsLoading(false);
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info text about proposal */}
          <Text style={styles.infoText}>
            {mode === 'create' ? t('createRefuge.proposalInfo') : t('editRefuge.proposalInfo')}
          </Text>

          {/* Default image */}
          <TouchableOpacity onPress={handleImagePress} activeOpacity={0.7}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
              }}
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
            <Text style={styles.sectionTitle}>{t('createRefuge.generalInfo')}</Text>
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
          <View style={[styles.section, { marginTop: 10 }]}>
            <View style={styles.regionRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.regionInput,
                    errors.region && styles.textInputError,
                  ]}
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
                  style={[
                    styles.textInput,
                    styles.regionInput,
                    errors.departement && styles.textInputError,
                  ]}
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
                {errors.departement && (
                  <Text style={styles.errorText}>{errors.departement}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Type and Condition Selectors */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>{t('refuge.details.typeAndCondition')}</Text>
            <Text style={[styles.inputLabel, { fontWeight: '300', fontSize: 10 }]}>
              {t('createRefuge.pressToEdit')}
            </Text>
            <View style={styles.badgeSelectorsRow}>
              <BadgeSelector
                type="type"
                value={type}
                onValueChange={(value) => setType(value as string)}
                expanded={typeExpanded}
                onToggle={() => {
                  setTypeExpanded(!typeExpanded);
                  if (conditionExpanded) setConditionExpanded(false);
                }}
                renderOptionsExternal={true}
              />
              <BadgeSelector
                type="condition"
                value={condition}
                onValueChange={(value) => setCondition(value as number)}
                expanded={conditionExpanded}
                onToggle={() => {
                  setConditionExpanded(!conditionExpanded);
                  if (typeExpanded) setTypeExpanded(false);
                }}
                renderOptionsExternal={true}
              />
            </View>

            {/* Render options below badges */}
            {(typeExpanded || conditionExpanded) && (
              <View style={styles.badgeOptionsContainer}>
                {typeExpanded && (
                  <>
                    {[
                      { value: 'non gardé', label: 'refuge.type.noGuarded' },
                      {
                        value: 'cabane ouverte mais ocupee par le berger l ete',
                        label: 'refuge.type.occupiedInSummer',
                      },
                      { value: 'fermée', label: 'refuge.type.closed' },
                      { value: 'orri', label: 'refuge.type.shelter' },
                      { value: 'emergence', label: 'refuge.type.emergency' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={String(option.value)}
                        onPress={() => {
                          setType(option.value);
                          setTypeExpanded(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <BadgeType type={option.value} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {conditionExpanded && (
                  <>
                    {[
                      { value: 0, label: 'refuge.condition.poor' },
                      { value: 1, label: 'refuge.condition.fair' },
                      { value: 2, label: 'refuge.condition.good' },
                      { value: 3, label: 'refuge.condition.excellent' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={String(option.value)}
                        onPress={() => {
                          setCondition(option.value);
                          setConditionExpanded(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <BadgeCondition condition={option.value} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View
                style={[styles.statCard, errors.altitude && styles.statCardError]}
                ref={altitudeRef}
              >
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

              <View
                style={[styles.statCard, errors.places && styles.statCardError]}
                ref={placesRef}
              >
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
            </View>
            <View style={styles.descriptionContainer}>
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
                numberOfLines={10}
                textAlignVertical="top"
                maxLength={3000}
              />
              <Text style={styles.descriptionCharCounter}>{description.length}/3000</Text>
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Amenities */}
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
          <View style={styles.section} ref={linksRef}>
            <Text style={styles.sectionTitle}>{t('createRefuge.links')}</Text>
            {links.map((link, index) => (
              <View key={index} style={styles.linkRow}>
                <TextInput
                  style={[styles.textInput, styles.linkInput, errors.links && styles.textInputError]}
                  value={link}
                  onChangeText={(value) => {
                    handleLinkChange(index, value);
                    if (errors.links) setErrors({ ...errors, links: undefined });
                  }}
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
            {errors.links && <Text style={styles.errorText}>{errors.links}</Text>}
            <TouchableOpacity style={styles.addLinkButton} onPress={handleAddLink}>
              <Text style={styles.addLinkText}>+ {t('createRefuge.addLink')}</Text>
            </TouchableOpacity>
          </View>

          {/* Comment for admins */}
          <View style={styles.section} ref={commentRef}>
            <Text style={styles.sectionTitle}>{t('createRefuge.adminComment')}</Text>
            <ProposalCommentInput
              mode={mode}
              value={comment}
              onChange={setComment}
              minChars={50}
              maxChars={3000}
              error={errors.comment}
              onClearError={() => setErrors({ ...errors, comment: undefined })}
              numberOfLines={4}
            />
          </View>

          {/* Submit button */}
          <View style={styles.buttonContainer}>
            {canSubmit ? (
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
      </KeyboardAvoidingView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
  },
  nameInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
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
    fontSize: 12,
  },
  regionSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgeSelectorsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  badgeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
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
  descriptionContainer: {
    position: 'relative',
  },
  descriptionCharCounter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: 'transparent',
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingBottom: 40,
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
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});
