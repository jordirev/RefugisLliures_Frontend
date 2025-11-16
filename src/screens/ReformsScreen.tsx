import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from '../utils/useTranslation';

export function ReformsScreen() {
  const { t } = useTranslation();
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('renovations.title')}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>🚧 {t('renovations.empty.title')}</Text>
        <Text style={styles.description}>
          {t('renovations.empty.message')}
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Properes actualitzacions:</Text>
          <Text style={styles.cardText}>• Històric de reformes</Text>
          <Text style={styles.cardText}>• Estat de les obres</Text>
          <Text style={styles.cardText}>• Contribucions de la comunitat</Text>
          <Text style={styles.cardText}>• Galeria de fotos abans/després</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 4,
  },
});
