import React, { useState, useEffect } from 'react';
import { StyleSheet, View, BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { ProposalsScreen } from '../screens/ProposalsScreen';
import { ProposalDetailScreen } from '../screens/ProposalDetailScreen';
import { DoubtsScreen } from '../screens/DoubtsScreen';
import { ExperiencesScreen } from '../screens/ExperiencesScreen';
import { RefugeBottomSheet } from './RefugeBottomSheet';
import { RefugeDetailScreen } from '../screens/RefugeDetailScreen';
import { RenovationDetailScreen } from '../screens/RenovationDetailScreen';
import { DeleteRefugePopUp } from './DeleteRefugePopUp';

import { Location } from '../models';
import { useDeleteRefugeProposal } from '../hooks/useProposalsQuery';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { t } = useTranslation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const navigation = useNavigation<any>();
  
  // Mutation for deleting refuge proposal
  const deleteProposalMutation = useDeleteRefugeProposal();
  
  // Només estats globals (compartits entre pantalles)
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [refugeToDelete, setRefugeToDelete] = useState<Location | undefined>(undefined);
  const [refugeToEdit, setRefugeToEdit] = useState<Location | undefined>(undefined);
  const [showDetailScreen, setShowDetailScreen] = useState(false);
  
  // Estats per DoubtsScreen i ExperiencesScreen overlays
  const [showDoubtsScreen, setShowDoubtsScreen] = useState(false);
  const [doubtsParams, setDoubtsParams] = useState<{refugeId: string, refugeName: string} | null>(null);
  const [showExperiencesScreen, setShowExperiencesScreen] = useState(false);
  const [experiencesParams, setExperiencesParams] = useState<{refugeId: string, refugeName: string} | null>(null);

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

  const handleConfirmDelete = (comment: string) => {
    if (!refugeToDelete) return;

    deleteProposalMutation.mutate({ refugeId: refugeToDelete.id, comment: comment || undefined }, {
      onSuccess: () => {
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
      },
      onError: (error: any) => {
        console.error('Error creating delete proposal:', error);
        setShowDeletePopup(false);
        
        // Skip showing alert if error is about coordinates
        const errorMessage = error.message || '';
        const isCoordError = /Cannot read property '(long|lat|coord)' of undefined/i.test(errorMessage) ||
                             /coord/i.test(errorMessage);
        
        if (!isCoordError) {
          showAlert(
            t('common.error'),
            errorMessage || t('deleteRefuge.error.generic')
          );
        }
      }
    });
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
      if (showExperiencesScreen) {
        setShowExperiencesScreen(false);
        setExperiencesParams(null);
        return true;
      }
      if (showDoubtsScreen) {
        setShowDoubtsScreen(false);
        setDoubtsParams(null);
        return true;
      }
      if (refugeToEdit) {
        setRefugeToEdit(undefined);
        return true;
      }
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
  }, [showBottomSheet, showDetailScreen, refugeToEdit, showDoubtsScreen, showExperiencesScreen]);

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
        <Stack.Screen name="Proposals" component={ProposalsScreen} />
        <Stack.Screen name="ProposalDetail" component={ProposalDetailScreen} />
        <Stack.Screen name="DoubtsScreen" component={DoubtsScreen} />
        <Stack.Screen name="ExperiencesScreen" component={ExperiencesScreen} />
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
            const { refugeId } = route.params || {};
            if (!refugeId) {
              nav.goBack();
              return null;
            }
            return (
              <RefugeDetailScreen
                refugeId={refugeId}
                onBack={() => nav.goBack()}
                onToggleFavorite={handleToggleFavorite}
                onNavigate={handleNavigate}
                onDelete={handleDeleteRefuge}
                onEdit={(location: Location) => {
                  nav.navigate('EditRefuge', { refuge: location });
                }}
                onViewMap={(location: Location) => {
                  nav.goBack();
                  setTimeout(() => {
                    handleShowRefugeBottomSheet(location);
                    navigation.navigate('MainTabs', { screen: 'Map', params: { selectedRefuge: location } });
                  }, 100);
                }}
                onNavigateToDoubts={(refugeId: string, refugeName: string) => {
                  setDoubtsParams({ refugeId, refugeName });
                  setShowDoubtsScreen(true);
                }}
                onNavigateToExperiences={(refugeId: string, refugeName: string) => {
                  setExperiencesParams({ refugeId, refugeName });
                  setShowExperiencesScreen(true);
                }}
              />
            );
          }}
        </Stack.Screen>
      </Stack.Navigator>

      {/* Bottom Sheet del refugi */}
      {selectedLocation && (
        <RefugeBottomSheet
          refugeId={selectedLocation.id}
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
            refugeId={selectedLocation.id}
            onEdit={(location: Location) => {
              setRefugeToEdit(location);
            }}
            onDelete={handleDeleteRefuge}
            onBack={handleCloseDetailScreen}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigate}
            onViewMap={(location: Location) => {
              handleCloseDetailScreen();
              setTimeout(() => {
                handleShowRefugeBottomSheet(location);
                navigation.navigate('MainTabs', { screen: 'Map', params: { selectedRefuge: location } });
              }, 300);
            }}            onNavigateToDoubts={(refugeId: string, refugeName: string) => {
              setDoubtsParams({ refugeId, refugeName });
              setShowDoubtsScreen(true);
            }}            onNavigateToExperiences={(refugeId: string, refugeName: string) => {
              setExperiencesParams({ refugeId, refugeName });
              setShowExperiencesScreen(true);
            }}          />
        </View>
      )}

      {/* Edit Refuge Screen overlay - Per sobre de RefugeDetailScreen */}
      {refugeToEdit && (
        <View style={styles.editRefugeOverlay}>
          <EditRefugeScreen 
            refuge={refugeToEdit} 
            onCancel={() => setRefugeToEdit(undefined)}
          />
        </View>
      )}

      {/* Doubts Screen overlay - Per sobre de RefugeDetailScreen */}
      {showDoubtsScreen && doubtsParams && (
        <View style={styles.editRefugeOverlay}>
          <DoubtsScreen 
            refugeId={doubtsParams.refugeId}
            refugeName={doubtsParams.refugeName}
            onClose={() => {
              setShowDoubtsScreen(false);
              setDoubtsParams(null);
            }}
          />
        </View>
      )}

      {/* Experiences Screen overlay - Per sobre de RefugeDetailScreen */}
      {showExperiencesScreen && experiencesParams && (
        <View style={styles.editRefugeOverlay}>
          <ExperiencesScreen 
            refugeId={experiencesParams.refugeId}
            refugeName={experiencesParams.refugeName}
            onClose={() => {
              setShowExperiencesScreen(false);
              setExperiencesParams(null);
            }}
          />
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
});
