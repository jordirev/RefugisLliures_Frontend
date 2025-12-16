import React, { useState, useEffect } from 'react';
import { StyleSheet, View, BackHandler, Platform, Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { TabsNavigator } from './TabsNavigator';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { ChangeEmailScreen } from '../screens/ChangeEmailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { CreateRenovationScreen } from '../screens/CreateRenovationScreen';
import { CreateRefugeScreen } from '../screens/CreateRefugeScreen';
import { EditRefugeScreen } from '../screens/EditRefugeScreen';
import { EditRenovationScreen } from '../screens/EditRenovationScreen';
import { RefugeBottomSheet } from './RefugeBottomSheet';
import { RefugeDetailScreen } from '../screens/RefugeDetailScreen';
import { RenovationDetailScreen } from '../screens/RenovationDetailScreen';
import { DeleteRefugePopUp } from './DeleteRefugePopUp';
import { RefugeForm } from './RefugeForm';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';

import { Location } from '../models';
import { RefugeProposalsService } from '../services/RefugeProposalsService';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  // Només estats globals (compartits entre pantalles)
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [refugeToDelete, setRefugeToDelete] = useState<Location | undefined>(undefined);
  const [refugeToEdit, setRefugeToEdit] = useState<Location | undefined>(undefined);
  const [showDetailScreen, setShowDetailScreen] = useState(false);

  // Handlers globals per al BottomSheet
  const handleToggleFavorite = async (locationId: string | undefined) => {
    if (!locationId) return;
    
    try {
      // El hook useFavourite ja gestiona l'afegir/eliminar favorits
      // Aquest handler només es crida com a callback després de la UI actualització
      // No cal fer res aquí, ja que el hook useFavourite ho gestiona
    } catch (error) {
      showAlert(t('common.error'), t('alerts.favoriteError'));
    }
  };

  const handleDeleteRefuge = (location: Location) => {
    setRefugeToDelete(location);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async (comment: string) => {
    if (!refugeToDelete) return;

    try {
      await RefugeProposalsService.proposalDeleteRefuge(refugeToDelete.id, comment || undefined);
      setShowDeletePopup(false);
      setRefugeToDelete(undefined);
      
      // Show success alert
      showAlert(
        t('deleteRefuge.success.title'),
        t('deleteRefuge.success.message')
      );
      
      // Close detail screen if open
      if (showDetailScreen) {
        handleCloseDetailScreen();
      }
    } catch (error: any) {
      console.error('Error creating delete proposal:', error);
      setShowDeletePopup(false);
      showAlert(
        t('common.error'),
        error.message || t('deleteRefuge.error.generic')
      );
    }
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setRefugeToDelete(undefined);
  };

  const handleNavigate = (location: Location) => {
    showAlert(t('navigation.map'), t('alerts.navigation', { name: location.name }));
  };


  const handleShowRefugeBottomSheet = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
  };

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(false);
    setShowDetailScreen(true);
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedLocation(undefined);
  };

  const handleCloseDetailScreen = () => {
    setShowDetailScreen(false);
    setTimeout(() => setSelectedLocation(undefined), 300);
  };

  // Handle Android hardware back button: if a bottom sheet or detail screen is open,
  // close it and consume the event. Otherwise let the default behaviour run.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (showDetailScreen) {
        handleCloseDetailScreen();
        return true;
      }
      if (showBottomSheet) {
        handleCloseBottomSheet();
        return true;
      }
      return false; // allow default behavior (including navigation back from Settings)
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showBottomSheet, showDetailScreen]);

  return (
    <View style={styles.container}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla principal amb tabs */}
        <Stack.Screen name="MainTabs">
          {() => (
            <TabsNavigator
              onLocationSelect={handleShowRefugeBottomSheet}
              onViewDetail={handleViewDetail}
              onViewMap={handleShowRefugeBottomSheet}
              selectedLocation={selectedLocation}
            />
          )}
        </Stack.Screen>

        {/* Pantalles fora del tab bar */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="CreateRenovation" component={CreateRenovationScreen} />
        <Stack.Screen name="CreateRefuge" component={CreateRefugeScreen} />
        <Stack.Screen name="EditRefuge" component={EditRefugeScreen} />
        <Stack.Screen name="EditRenovation" component={EditRenovationScreen} />
        <Stack.Screen name="RefromDetail">
          {({ navigation: nav }: any) => (
            <RenovationDetailScreen
              onViewMap={(location: Location) => {
                // Set selected location & show bottom sheet in AppNavigator
                handleShowRefugeBottomSheet(location);
                // Navigate to the tabs and open Map tab with param
                nav.navigate('MainTabs', { screen: 'Map', params: { selectedRefuge: location } });
              }}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen name="RefugeDetail">
          {({ route, navigation: nav }: any) => {
            const { refuge } = route.params || {};
            return (
              <RefugeDetailScreen
                refuge={refuge}
                onBack={() => nav.goBack()}
                onToggleFavorite={handleToggleFavorite}
                onNavigate={handleNavigate}
                onDelete={handleDeleteRefuge}
                onEdit={(location: Location) => {
                  nav.navigate('EditRefuge', { refuge: location });
                }}
              />
            );
          }}
        </Stack.Screen>
      </Stack.Navigator>

      {/* Bottom Sheet del refugi */}
      {selectedLocation && (
        <RefugeBottomSheet
          refuge={selectedLocation}
          isVisible={showBottomSheet}
          onClose={handleCloseBottomSheet}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={handleNavigate}
          onViewDetails={handleViewDetail}
        />
      )}

      {/* Pantalla de detall del refugi - Per sobre de tot */}
      {selectedLocation && showDetailScreen && !refugeToEdit && (
        <View style={styles.detailScreenOverlay}>
          <RefugeDetailScreen
            refuge={selectedLocation}
            onEdit={(location: Location) => {
              setRefugeToEdit(location);
            }}
            onDelete={handleDeleteRefuge}
            onBack={handleCloseDetailScreen}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigate}
          />
        </View>
      )}

      {/* Edit Refuge Form overlay */}
      {refugeToEdit && (
        <View style={styles.editRefugeOverlay}>
          <View style={styles.editRefugeContainer}>
            {/* Header */}
            <View style={styles.editHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => {
                  setRefugeToEdit(undefined);
                }}
              >
                <BackIcon />
              </TouchableOpacity>
              <Text style={styles.editTitle}>{t('editRefuge.title')}</Text>
            </View>
            
            {/* Refuge Form */}
            <RefugeForm
              mode="edit"
              initialData={refugeToEdit}
              onSubmit={async (data, comment) => {
                try {
                  await RefugeProposalsService.proposalEditRefuge(
                    refugeToEdit.id,
                    data as Partial<Location>,
                    comment
                  );
                  setRefugeToEdit(undefined);
                  showAlert(
                    t('editRefuge.success.title'),
                    t('editRefuge.success.message')
                  );
                } catch (error: any) {
                  showAlert(t('common.error'), error.message);
                }
              }}
              onCancel={() => {
                setRefugeToEdit(undefined);
              }}
            />
          </View>
        </View>
      )}

      {/* Delete Refuge Popup */}
      {refugeToDelete && (
        <DeleteRefugePopUp
          visible={showDeletePopup}
          refugeName={refugeToDelete.name}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
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
  container: {
    flex: 1,
  },
  detailScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  editRefugeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1001,
  },
  editRefugeContainer: {
    flex: 1,
  },
  editHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
});
