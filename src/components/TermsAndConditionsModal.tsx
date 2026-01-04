import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';

interface TermsAndConditionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function TermsAndConditionsModal({ visible, onClose }: TermsAndConditionsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header amb gradient */}
          <LinearGradient
            colors={["#FF8904", "#F54900"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>{t('termsAndConditions.title')}</Text>
          </LinearGradient>

          {/* Contingut amb ScrollView */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.updateDate}>
              {t('termsAndConditions.updateDate')}
            </Text>

            {/* Secció: Acceptació dels Termes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.acceptance.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.acceptance.content')}
              </Text>
            </View>

            {/* Secció: Descripció del Servei */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.description.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.description.content')}
              </Text>
            </View>

            {/* Secció: Ús de Permisos i Dispositiu */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.permissions.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.permissions.intro')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.permissions.location.title')}</Text> {t('termsAndConditions.permissions.location.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.permissions.media.title')}</Text> {t('termsAndConditions.permissions.media.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.permissions.network.title')}</Text> {t('termsAndConditions.permissions.network.content')}
              </Text>
            </View>

            {/* Secció: Responsabilitat de l'Usuari */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.responsibility.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.responsibility.content')}
              </Text>
            </View>

            {/* Separador */}
            <View style={styles.separator} />

            {/* Política de Privacitat */}
            <Text style={styles.privacyTitle}>{t('termsAndConditions.privacy.title')}</Text>

            {/* Secció: Responsable del Tractament */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.privacy.dataController.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.privacy.dataController.content')}
              </Text>
            </View>

            {/* Secció: Dades que Recollim */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.privacy.dataCollection.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.privacy.dataCollection.intro')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.dataCollection.identification.title')}</Text> {t('termsAndConditions.privacy.dataCollection.identification.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.dataCollection.location.title')}</Text> {t('termsAndConditions.privacy.dataCollection.location.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.dataCollection.userContent.title')}</Text> {t('termsAndConditions.privacy.dataCollection.userContent.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.dataCollection.usage.title')}</Text> {t('termsAndConditions.privacy.dataCollection.usage.content')}
              </Text>
            </View>

            {/* Secció: Finalitat del Tractament */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.privacy.dataPurpose.title')}</Text>
              <Text style={styles.paragraph}>{t('termsAndConditions.privacy.dataPurpose.intro')}</Text>
              <Text style={styles.bulletPoint}>
                • {t('termsAndConditions.privacy.dataPurpose.point1')}
              </Text>
              <Text style={styles.bulletPoint}>
                • {t('termsAndConditions.privacy.dataPurpose.point2')}
              </Text>
              <Text style={styles.bulletPoint}>
                • {t('termsAndConditions.privacy.dataPurpose.point3')}
              </Text>
            </View>

            {/* Secció: Tercers i Transferència de Dades */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.privacy.thirdParties.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.privacy.thirdParties.intro')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.thirdParties.firebase.title')}</Text> {t('termsAndConditions.privacy.thirdParties.firebase.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.thirdParties.cloudflare.title')}</Text> {t('termsAndConditions.privacy.thirdParties.cloudflare.content')}
              </Text>
              <Text style={styles.bulletPoint}>
                • <Text style={styles.bold}>{t('termsAndConditions.privacy.thirdParties.analytics.title')}</Text> {t('termsAndConditions.privacy.thirdParties.analytics.content')}
              </Text>
            </View>

            {/* Secció: Drets ARCO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.privacy.rights.title')}</Text>
              <Text style={styles.paragraph}>{t('termsAndConditions.privacy.rights.intro')}</Text>
              <Text style={styles.bulletPoint}>
                • {t('termsAndConditions.privacy.rights.point1')}
              </Text>
              <Text style={styles.bulletPoint}>
                • {t('termsAndConditions.privacy.rights.point2')}
              </Text>
              <Text style={styles.bulletPoint}>
                • {t('termsAndConditions.privacy.rights.point3')}
              </Text>
            </View>

            {/* Secció: Seguretat */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('termsAndConditions.privacy.security.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.privacy.security.content')}
              </Text>
            </View>

            {/* Espai final */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Botó d'acceptar */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={onClose}
              testID="accept-terms-button"
            >
              <LinearGradient
                colors={["#FF8904", "#F54900"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptButtonGradient}
              >
                <Text style={styles.acceptButtonText}>{t('termsAndConditions.acceptButton')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  updateDate: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
