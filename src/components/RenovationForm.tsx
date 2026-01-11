import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { SearchBar } from './SearchBar';
import { RefugeCard } from './RefugeCard';
import { Location } from '../models';
import { RefugisService } from '../services/RefugisService';

// Icon imports
import InformationIcon from '../assets/icons/information-circle.svg';

export interface RenovationFormData {
  refuge_id?: string;
  ini_date: string;
  fin_date: string;
  description: string;
  materials_needed?: string;
  group_link: string;
}

interface RenovationFormProps {
  mode: 'create' | 'edit';
  initialData?: RenovationFormData;
  initialRefuge?: Location | null;
  allRefuges: Location[];
  onSubmit: (data: RenovationFormData, hasChanges: boolean, changedFields: Partial<RenovationFormData>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  resetKey?: number; // Key to force reset the form
}

export function RenovationForm({
  mode,
  initialData,
  initialRefuge,
  allRefuges,
  onSubmit,
  onCancel,
  isLoading,
  resetKey,
}: RenovationFormProps) {
  const { t } = useTranslation();

  // Form state
  const [selectedRefuge, setSelectedRefuge] = useState<Location | null>(initialRefuge || null);
  const [iniDate, setIniDate] = useState<string>(initialData?.ini_date || '');
  const [finDate, setFinDate] = useState<string>(initialData?.fin_date || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [materialsNeeded, setMaterialsNeeded] = useState<string>(initialData?.materials_needed || '');
  const [groupLink, setGroupLink] = useState<string>(initialData?.group_link || '');

  // Reset form when resetKey changes or initialData changes
  useEffect(() => {
    setSelectedRefuge(initialRefuge || null);
    setIniDate(initialData?.ini_date || '');
    setFinDate(initialData?.fin_date || '');
    setDescription(initialData?.description || '');
    setMaterialsNeeded(initialData?.materials_needed || '');
    setGroupLink(initialData?.group_link || '');
    setSearchQuery('');
    setRefugeError(null);
    setIniDateError(null);
    setFinDateError(null);
    setDescriptionError(null);
    setGroupLinkError(null);
  }, [resetKey, initialData, initialRefuge]);

  // Search state for refuge selection
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'ini' | 'fin' | null>(null);
  const [calendarMinDate, setCalendarMinDate] = useState<string | undefined>(undefined);

  // Tooltip state for group link info
  const [showGroupLinkInfo, setShowGroupLinkInfo] = useState(false);

  // Error states
  const [refugeError, setRefugeError] = useState<string | null>(null);
  const [iniDateError, setIniDateError] = useState<string | null>(null);
  const [finDateError, setFinDateError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [groupLinkError, setGroupLinkError] = useState<string | null>(null);

  // Filter refuges based on search query
  const filteredRefuges = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }
    const lower = searchQuery.toLowerCase();
    return allRefuges.filter(
      (refuge) => refuge.name && refuge.name.toLowerCase().includes(lower)
    );
  }, [searchQuery, allRefuges]);

  // Suggestions for autocomplete
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return Array.from(new Set(filteredRefuges.map((loc) => loc.name).filter(Boolean)));
  }, [searchQuery, filteredRefuges]);

  const handleRefugeSelect = async (name: string) => {
    const refuge = allRefuges.find((r) => r.name === name);
    if (refuge && refuge.id) {
      // Carregar les dades completes del refugi incloent images_metadata
      try {
        const fullRefuge = await RefugisService.getRefugiById(refuge.id);
        if (fullRefuge) {
          setSelectedRefuge(fullRefuge);
        } else {
          // Si no es pot carregar, usar les dades bàsiques
          setSelectedRefuge(refuge);
        }
      } catch (error) {
        console.error('Error loading full refuge data:', error);
        // Si hi ha error, usar les dades bàsiques
        setSelectedRefuge(refuge);
      }
      setSearchQuery('');
      setRefugeError(null);
    }
  };

  const handleOpenCalendar = (calMode: 'ini' | 'fin') => {
    setCalendarMode(calMode);
    if (calMode === 'ini') {
      setCalendarMinDate(getTodayMadridDateString());
    } else if (calMode === 'fin') {
      setCalendarMinDate(iniDate || getTodayMadridDateString());
    }
    setShowCalendar(true);
  };

  const handleDateSelect = (dateString: string) => {
    if (calendarMode === 'ini') {
      setIniDate(dateString);
      setIniDateError(null);
      setShowCalendar(false);
      setTimeout(() => {
        setCalendarMode('fin');
        setCalendarMinDate(dateString); // Actualitza el minDate amb la data inicial seleccionada
        setShowCalendar(true);
      }, 300);
    } else if (calendarMode === 'fin') {
      setFinDate(dateString);
      setFinDateError(null);
      setShowCalendar(false);
      setCalendarMode(null);
    }
  };

  const validateGroupLink = (link: string): boolean => {
    const whatsappRegex = /^https:\/\/chat\.whatsapp\.com\/.+/;
    const telegramRegex = /^https:\/\/t\.me\/.+/;
    return whatsappRegex.test(link) || telegramRegex.test(link);
  };

  const getTodayMadridDateString = (): string => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const year = parts.find((p) => p.type === 'year')?.value ?? String(now.getFullYear());
    const month = parts.find((p) => p.type === 'month')?.value ?? String(now.getMonth() + 1).padStart(2, '0');
    const day = parts.find((p) => p.type === 'day')?.value ?? String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleGroupLinkChange = (text: string) => {
    setGroupLink(text);
    if (groupLinkError) setGroupLinkError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate refuge selection only in create mode
    if (mode === 'create' && !selectedRefuge) {
      setRefugeError(t('createRenovation.errors.refugeRequired'));
      isValid = false;
    }

    // Validate ini_date
    if (!iniDate) {
      setIniDateError(t('createRenovation.errors.iniDateRequired'));
      isValid = false;
    } else {
      const todayMadrid = getTodayMadridDateString();
      if (iniDate && new Date(iniDate) < new Date(todayMadrid)) {
        setIniDateError(t('createRenovation.errors.iniDateBeforeToday'));
        isValid = false;
      }
    }

    // Validate fin_date
    if (!finDate) {
      setFinDateError(t('createRenovation.errors.finDateRequired'));
      isValid = false;
    } else if (iniDate && new Date(finDate) < new Date(iniDate)) {
      setFinDateError(t('createRenovation.errors.finDateBeforeIniDate'));
      isValid = false;
    }

    // Validate description
    if (!description.trim()) {
      setDescriptionError(t('createRenovation.errors.descriptionRequired'));
      isValid = false;
    } else if (description.length > 1000) {
      setDescriptionError(t('createRenovation.errors.descriptionTooLong'));
      isValid = false;
    }

    // Validate materials_needed
    if (materialsNeeded.length > 500) {
      isValid = false;
    }

    // Validate group_link
    if (!groupLink.trim()) {
      setGroupLinkError(t('createRenovation.errors.groupLinkRequired'));
      isValid = false;
    } else if (!validateGroupLink(groupLink)) {
      setGroupLinkError(t('createRenovation.errors.groupLinkInvalid'));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const formData: RenovationFormData = {
      ini_date: iniDate,
      fin_date: finDate,
      description: description.trim(),
      materials_needed: materialsNeeded.trim() || undefined,
      group_link: groupLink.trim(),
    };

    if (mode === 'create' && selectedRefuge) {
      formData.refuge_id = selectedRefuge.id;
    }

    // Calculate changed fields for edit mode
    const changedFields: Partial<RenovationFormData> = {};
    if (mode === 'edit' && initialData) {
      if (iniDate !== initialData.ini_date) {
        changedFields.ini_date = iniDate;
      }
      if (finDate !== initialData.fin_date) {
        changedFields.fin_date = finDate;
      }
      if (description.trim() !== initialData.description) {
        changedFields.description = description.trim();
      }
      if ((materialsNeeded.trim() || undefined) !== initialData.materials_needed) {
        changedFields.materials_needed = materialsNeeded.trim() || undefined;
      }
      if (groupLink.trim() !== initialData.group_link) {
        changedFields.group_link = groupLink.trim();
      }
    }

    await onSubmit(formData, hasChanges, changedFields);
  };

  // Check if form has changes in edit mode
  const hasChanges = useMemo(() => {
    if (mode === 'create') return true;
    if (!initialData) return false;
    
    return (
      iniDate !== initialData.ini_date ||
      finDate !== initialData.fin_date ||
      description.trim() !== initialData.description ||
      (materialsNeeded.trim() || undefined) !== initialData.materials_needed ||
      groupLink.trim() !== initialData.group_link
    );
  }, [mode, initialData, iniDate, finDate, description, materialsNeeded, groupLink]);

  const isFormValid =
    (mode === 'edit' || selectedRefuge) &&
    iniDate &&
    finDate &&
    description.trim() &&
    groupLink.trim() &&
    validateGroupLink(groupLink) &&
    description.length <= 1000 &&
    materialsNeeded.length <= 500 &&
    (iniDate ? new Date(iniDate) >= new Date(getTodayMadridDateString()) : false);

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(t('common.locale'), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Refuge Selection - Only in create mode */}
        {mode === 'create' && (
          <View style={styles.section}>
            {!selectedRefuge ? (
              <>
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  suggestions={suggestions}
                  onSuggestionSelect={handleRefugeSelect}
                  showFilterButton={false}
                  showAddButton={false}
                />
                {refugeError && <Text style={styles.errorText}>{refugeError}</Text>}
              </>
            ) : (
              <>
                <RefugeCard
                  refuge={selectedRefuge}
                  onPress={() => {
                    setSelectedRefuge(null);
                    setRefugeError(null);
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setSelectedRefuge(null);
                    setRefugeError(null);
                  }}
                >
                  <Text style={styles.helperText}>{t('createRenovation.refugeHelper')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Date Selection */}
        <View style={[styles.section]}>
          <Text style={styles.label}>{t('createRenovation.datesLabel')}</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateSubLabel}>{t('createRenovation.iniDateLabel')}</Text>
              <TouchableOpacity
                style={[styles.dateInput, iniDateError ? styles.inputError : null]}
                onPress={() => handleOpenCalendar('ini')}
              >
                <Text style={iniDate ? styles.dateText : styles.datePlaceholder}>
                  {iniDate ? formatDateDisplay(iniDate) : t('createRenovation.selectDate')}
                </Text>
              </TouchableOpacity>
              {iniDateError && <Text style={styles.errorText}>{iniDateError}</Text>}
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateSubLabel}>{t('createRenovation.finDateLabel')}</Text>
              <TouchableOpacity
                style={[styles.dateInput, finDateError ? styles.inputError : null]}
                onPress={() => handleOpenCalendar('fin')}
              >
                <Text style={finDate ? styles.dateText : styles.datePlaceholder}>
                  {finDate ? formatDateDisplay(finDate) : t('createRenovation.selectDate')}
                </Text>
              </TouchableOpacity>
              {finDateError && <Text style={styles.errorText}>{finDateError}</Text>}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('createRenovation.descriptionLabel')}</Text>
          <TextInput
            style={[
              styles.textArea,
              descriptionError ? styles.inputError : null,
            ]}
            placeholder={t('createRenovation.descriptionPlaceholder')}
            placeholderTextColor="#999"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (descriptionError) setDescriptionError(null);
            }}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <View style={styles.characterCount}>
            <Text
              style={[
                styles.characterCountText,
                description.length > 1000 ? styles.characterCountError : null,
              ]}
            >
              {description.length}/1000
            </Text>
          </View>
          {descriptionError && <Text style={styles.errorText}>{descriptionError}</Text>}
        </View>

        {/* Materials Needed (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createRenovation.materialsLabel')}{' '}
            <Text style={styles.optionalText}>({t('common.optional')})</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('createRenovation.materialsPlaceholder')}
            placeholderTextColor="#999"
            value={materialsNeeded}
            onChangeText={setMaterialsNeeded}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <View style={styles.characterCount}>
            <Text
              style={[
                styles.characterCountText,
                materialsNeeded.length > 500 ? styles.characterCountError : null,
              ]}
            >
              {materialsNeeded.length}/500
            </Text>
          </View>
        </View>

        {/* Group Link */}
        <View style={styles.section}>
          <View style={styles.labelWithIcon}>
            <Text style={styles.label}>{t('createRenovation.groupLinkLabel')}</Text>
            <TouchableOpacity onPress={() => setShowGroupLinkInfo(true)}>
              <InformationIcon width={20} height={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, groupLinkError ? styles.inputError : null]}
            placeholder={t('createRenovation.groupLinkPlaceholder')}
            placeholderTextColor="#999"
            value={groupLink}
            onChangeText={handleGroupLinkChange}
            autoCapitalize="none"
            keyboardType="url"
          />
          {groupLinkError && <Text style={styles.errorText}>{groupLinkError}</Text>}
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={styles.submitButtonWrapper}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isFormValid ? ['#FF8904', '#F54900'] : ['#9CA3AF', '#6B7280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? t('common.loading') : mode === 'create' ? t('createRenovation.submit') : t('common.save')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              {calendarMode === 'ini'
                ? t('createRenovation.selectIniDate')
                : t('createRenovation.selectFinDate')}
            </Text>
            <SimpleDatePicker
              selectedDate={calendarMode === 'ini' ? iniDate : finDate}
              onDateSelect={handleDateSelect}
              minDate={calendarMinDate}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Group Link Info Tooltip */}
      <Modal visible={showGroupLinkInfo} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGroupLinkInfo(false)}>
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipText}>{t('createRenovation.groupLinkInfo')}</Text>
            <TouchableOpacity
              style={styles.tooltipCloseButton}
              onPress={() => setShowGroupLinkInfo(false)}
            >
              <Text style={styles.tooltipCloseButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Simple Date Picker Component
interface SimpleDatePickerProps {
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
  minDate?: string;
}

function SimpleDatePicker({ selectedDate, onDateSelect, minDate }: SimpleDatePickerProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setYear(date.getFullYear());
      setMonth(date.getMonth());
    }
  }, [selectedDate]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = [
    'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
  ];
  
  const dayNames = ['Dg', 'Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];

  const handleDayPress = (day: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (minDate && new Date(dateString) < new Date(minDate)) {
      return;
    }
    
    onDateSelect(dateString);
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const isDateDisabled = (day: number): boolean => {
    if (!minDate) return false;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return new Date(dateString) < new Date(minDate);
  };

  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateString === selectedDate;
  };

  return (
    <View style={datePickerStyles.container}>
      <View style={datePickerStyles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={datePickerStyles.navButton}>
          <Text style={datePickerStyles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={datePickerStyles.monthYear}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={datePickerStyles.navButton}>
          <Text style={datePickerStyles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>
      
      <View style={datePickerStyles.daysHeader}>
        {dayNames.map((dayName) => (
          <Text key={dayName} style={datePickerStyles.dayHeaderText}>{dayName}</Text>
        ))}
      </View>
      
      <View style={datePickerStyles.daysGrid}>
        {[...Array(firstDayOfMonth)].map((_, i) => (
          <View key={`empty-${i}`} style={datePickerStyles.dayCell} />
        ))}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const disabled = isDateDisabled(day);
          const selected = isDateSelected(day);
          
          return (
            <TouchableOpacity
              key={day}
              style={[
                datePickerStyles.dayCell,
                selected && datePickerStyles.selectedDay,
                disabled && datePickerStyles.disabledDay,
              ]}
              onPress={() => !disabled && handleDayPress(day)}
              disabled={disabled}
            >
              <Text
                style={[
                  datePickerStyles.dayText,
                  selected && datePickerStyles.selectedDayText,
                  disabled && datePickerStyles.disabledDayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const datePickerStyles = StyleSheet.create({
  container: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 24,
    color: '#FF8904',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDay: {
    backgroundColor: '#FF8904',
    borderRadius: 8,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: '#1F2937',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledDayText: {
    color: '#9CA3AF',
  },
});

const HEADER_HEIGHT = 96;
const BOTTOM_SAFE_AREA_HEIGHT = 34;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: BOTTOM_SAFE_AREA_HEIGHT + 32,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 16,
  },
  characterCountText: {
    fontSize: 12,
    color: '#6B7280',
  },
  characterCountError: {
    color: '#EF4444',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateSubLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  submitContainer: {
    marginTop: 16,
  },
  submitButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tooltipContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  tooltipText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
  },
  tooltipCloseButton: {
    paddingVertical: 12,
    backgroundColor: '#FF8904',
    borderRadius: 12,
    alignItems: 'center',
  },
  tooltipCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
