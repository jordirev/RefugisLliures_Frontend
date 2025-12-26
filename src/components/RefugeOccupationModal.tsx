import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { useRefugeVisits, useCreateRefugeVisit, useUpdateRefugeVisit, useDeleteRefugeVisit } from '../hooks/useRefugeVisitsQuery';
import { Location } from '../models';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import CloseIcon from '../assets/icons/x.svg';

interface RefugeOccupationModalProps {
  visible: boolean;
  onClose: () => void;
  refuge: Location;
}

type ActionMode = 'none' | 'add' | 'edit' | 'delete';

export function RefugeOccupationModal({ visible, onClose, refuge }: RefugeOccupationModalProps) {
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Fetch refuge visits
  const { data: visits, isLoading } = useRefugeVisits(refuge.id);
  
  // Mutations
  const createVisitMutation = useCreateRefugeVisit();
  const updateVisitMutation = useUpdateRefugeVisit();
  const deleteVisitMutation = useDeleteRefugeVisit();

  // Calendar state
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  
  // Selected date and action state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>('none');
  const [numVisitors, setNumVisitors] = useState<string>('');
  const [numVisitorsError, setNumVisitorsError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedDate(null);
      setActionMode('none');
      setNumVisitors('');
      setNumVisitorsError(null);
      setShowDisclaimer(false);
      // Reset to current month
      setYear(new Date().getFullYear());
      setMonth(new Date().getMonth());
    }
  }, [visible]);

  // Get today's date string
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Get visit for a specific date
  const getVisitForDate = (dateString: string) => {
    return visits?.find(v => v.date === dateString);
  };

  // Check if date is in the past
  const isDatePast = (day: number): boolean => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return new Date(dateString) < new Date(getTodayString());
  };

  // Check if date is selected
  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateString === selectedDate;
  };

  // Handle day press
  const handleDayPress = (day: number) => {
    if (isDatePast(day)) return;
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
    setActionMode('none');
    setNumVisitors('');
    setNumVisitorsError(null);
  };

  // Handle add visit button
  const handleAddVisitButton = () => {
    setShowDisclaimer(true);
  };

  // Handle disclaimer confirmed
  const handleDisclaimerConfirmed = () => {
    setShowDisclaimer(false);
    setActionMode('add');
    setNumVisitors('');
    setNumVisitorsError(null);
  };

  // Handle edit visit button
  const handleEditVisitButton = () => {
    const visit = selectedDate ? getVisitForDate(selectedDate) : null;
    if (visit) {
      setActionMode('edit');
      setNumVisitors(String(visit.num_visitors));
      setNumVisitorsError(null);
    }
  };

  // Handle delete visit button
  const handleDeleteVisitButton = () => {
    showAlert(
      t('refuge.occupation.deleteVisit'),
      t('refuge.occupation.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), onPress: handleDeleteVisit, style: 'destructive' },
      ]
    );
  };

  // Validate num visitors
  const validateNumVisitors = (value: string): boolean => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      setNumVisitorsError(t('refuge.occupation.numVisitorsError'));
      return false;
    }
    setNumVisitorsError(null);
    return true;
  };

  // Handle create visit
  const handleCreateVisit = async () => {
    if (!validateNumVisitors(numVisitors) || !selectedDate) return;

    try {
      const visit = await createVisitMutation.mutateAsync({
        refugeId: refuge.id,
        visitDate: selectedDate,
        request: { num_visitors: parseInt(numVisitors) }
      });

      // Check if places exceeded
      if (refuge.places && visit.total_visitors > refuge.places) {
        showAlert(
          t('common.warning'),
          t('refuge.occupation.placesExceeded', { 
            total: visit.total_visitors, 
            places: refuge.places 
          })
        );
      }

      setActionMode('none');
      setNumVisitors('');
    } catch (error) {
      console.error('Error creating visit:', error);
      showAlert(t('common.error'), error instanceof Error ? error.message : String(error));
    }
  };

  // Handle update visit
  const handleUpdateVisit = async () => {
    if (!validateNumVisitors(numVisitors) || !selectedDate) return;

    try {
      const visit = await updateVisitMutation.mutateAsync({
        refugeId: refuge.id,
        visitDate: selectedDate,
        request: { num_visitors: parseInt(numVisitors) }
      });

      // Check if places exceeded
      if (refuge.places && visit.total_visitors > refuge.places) {
        showAlert(
          t('common.warning'),
          t('refuge.occupation.placesExceeded', { 
            total: visit.total_visitors, 
            places: refuge.places 
          })
        );
      }

      setActionMode('none');
      setNumVisitors('');
    } catch (error) {
      console.error('Error updating visit:', error);
      showAlert(t('common.error'), error instanceof Error ? error.message : String(error));
    }
  };

  // Handle delete visit
  const handleDeleteVisit = async () => {
    if (!selectedDate) return;

    try {
      await deleteVisitMutation.mutateAsync({
        refugeId: refuge.id,
        visitDate: selectedDate
      });

      setSelectedDate(null);
      setActionMode('none');
    } catch (error) {
      console.error('Error deleting visit:', error);
      showAlert(t('common.error'), error instanceof Error ? error.message : String(error));
    }
  };

  // Handle cancel action
  const handleCancelAction = () => {
    setActionMode('none');
    setNumVisitors('');
    setNumVisitorsError(null);
  };

  // Calendar navigation
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

  // Calendar render helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = [
    t('common.months.january'), t('common.months.february'), t('common.months.march'),
    t('common.months.april'), t('common.months.may'), t('common.months.june'),
    t('common.months.july'), t('common.months.august'), t('common.months.september'),
    t('common.months.october'), t('common.months.november'), t('common.months.december')
  ];
  
  const dayNames = [
    t('common.days.sun'), t('common.days.mon'), t('common.days.tue'),
    t('common.days.wed'), t('common.days.thu'), t('common.days.fri'), t('common.days.sat')
  ];

  const selectedVisit = selectedDate ? getVisitForDate(selectedDate) : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{t('refuge.occupation.title')}</Text>
                {refuge.places && (
                  <Text style={styles.subtitle}>{t('filters.capacity')}: {refuge.places} {t('common.places')}</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon width={24} height={24} color="#4A5565" />
              </TouchableOpacity>
            </View>

            {/* Loading state */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6900" />
              </View>
            )}

            {/* Calendar */}
            {!isLoading && (
              <>
                <View style={styles.calendarContainer}>
                  {/* Calendar header */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                      <Text style={styles.navButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthYear}>{monthNames[month]} {year}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                      <Text style={styles.navButtonText}>→</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Day names */}
                  <View style={styles.daysHeader}>
                    {dayNames.map((dayName) => (
                      <Text key={dayName} style={styles.dayHeaderText}>{dayName}</Text>
                    ))}
                  </View>
                  
                  {/* Days grid */}
                  <View style={styles.daysGrid}>
                    {[...Array(firstDayOfMonth)].map((_, i) => (
                      <View key={`empty-${i}`} style={styles.dayCell} />
                    ))}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1;
                      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const visit = getVisitForDate(dateString);
                      const isPast = isDatePast(day);
                      const isSelected = isDateSelected(day);
                      const isOverCapacity = visit && refuge.places && visit.total_visitors > refuge.places;
                      const hasVisit = visit && visit.total_visitors > 0;
                      
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayCell,
                            isPast && styles.pastDay,
                            isOverCapacity && !isSelected && styles.overCapacityDay,
                            hasVisit && !isOverCapacity && !isSelected && styles.hasVisitDay,
                            isSelected && styles.selectedDay,
                          ]}
                          onPress={() => handleDayPress(day)}
                          disabled={isPast}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isPast && !isSelected && styles.pastDayText,
                              isOverCapacity && !isSelected && styles.overCapacityDayText,
                              hasVisit && !isOverCapacity && !isSelected && styles.hasVisitDayText,
                              isSelected && styles.selectedDayText,
                            ]}
                          >
                            {day}
                          </Text>
                          {hasVisit && (
                            <Text
                              style={[
                                styles.visitorCount,
                                isOverCapacity && !isSelected && styles.overCapacityVisitorCount,
                                !isOverCapacity && !isSelected && styles.hasVisitVisitorCount,
                                isSelected && styles.selectedVisitorCount,
                              ]}
                            >
                              {visit.total_visitors}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Action buttons for selected date */}
                {selectedDate && actionMode === 'none' && (
                  <View style={styles.actionButtonsContainer}>
                    {selectedVisit?.is_visitor ? (
                      <>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={handleEditVisitButton}
                        >
                          <Text style={styles.editButtonText}>{t('refuge.occupation.editVisit')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={handleDeleteVisitButton}
                        >
                          <Text style={styles.deleteButtonText}>{t('refuge.occupation.deleteVisit')}</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddVisitButton}
                      >
                        <Text style={styles.addButtonText}>{t('refuge.occupation.addVisit')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Add/Edit form */}
                {(actionMode === 'add' || actionMode === 'edit') && (
                  <View style={styles.formContainer}>
                    <Text style={styles.formLabel}>{t('refuge.occupation.numVisitorsLabel')}</Text>
                    <TextInput
                      style={[styles.input, numVisitorsError ? styles.inputError : null]}
                      placeholder={t('refuge.occupation.numVisitorsPlaceholder')}
                      placeholderTextColor="#999"
                      value={numVisitors}
                      onChangeText={(text) => {
                        setNumVisitors(text);
                        if (numVisitorsError) setNumVisitorsError(null);
                      }}
                      keyboardType="numeric"
                    />
                    {numVisitorsError && (
                      <Text style={styles.errorText}>{numVisitorsError}</Text>
                    )}
                    
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelAction}
                      >
                        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={actionMode === 'add' ? handleCreateVisit : handleUpdateVisit}
                        disabled={createVisitMutation.isPending || updateVisitMutation.isPending}
                      >
                        {createVisitMutation.isPending || updateVisitMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>

      {/* Disclaimer Alert */}
      {showDisclaimer && (
        <CustomAlert
          visible={showDisclaimer}
          title={t('common.warning')}
          message={t('refuge.occupation.disclaimer')}
          buttons={[
            { text: t('common.cancel'), style: 'cancel', onPress: () => setShowDisclaimer(false) },
            { text: t('common.understand'), onPress: handleDisclaimerConfirmed },
          ]}
          onDismiss={() => setShowDisclaimer(false)}
        />
      )}

      {/* Error/Success alerts */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#FF6900',
    fontWeight: '600',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    borderRadius: 8,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  visitorCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  selectedDay: {
    backgroundColor: '#FF6900',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  pastDay: {
    backgroundColor: '#F3F4F6',
  },
  pastDayText: {
    color: '#9CA3AF',
  },
  overCapacityDay: {
    backgroundColor: '#FEE2E2',
  },
  overCapacityDayText: {
    color: '#DC2626',
  },
  overCapacityVisitorCount: {
    color: '#DC2626',
  },
  hasVisitDay: {
    backgroundColor: '#DCFCE7',
  },
  hasVisitDayText: {
    color: '#16A34A',
  },
  hasVisitVisitorCount: {
    color: '#16A34A',
  },
  selectedVisitorCount: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#FF6900',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    marginTop: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginBottom: 8,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF6900',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
