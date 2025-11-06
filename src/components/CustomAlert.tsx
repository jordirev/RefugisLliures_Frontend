import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export function CustomAlert({ 
  visible, 
  title, 
  message, 
  buttons = [], 
  onDismiss 
}: CustomAlertProps) {
  
  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  // Si no hay botones, añadir un botón OK por defecto
  const finalButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {title && <Text style={styles.modalTitle}>{title}</Text>}
            <Text style={styles.modalMessage}>{message}</Text>
          </ScrollView>
          <View style={[
            styles.modalButtonsRow,
            finalButtons.length === 1 && styles.modalButtonsCenter
          ]}>
            {finalButtons.map((button, index) => {
              const isPrimary = button.style !== 'cancel';
              const isDestructive = button.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButtonRow,
                    finalButtons.length === 1 ? styles.modalButtonSingle : styles.modalButtonMultiple,
                    isPrimary && !isDestructive && styles.modalPrimary,
                    !isPrimary && styles.modalCancel,
                    isDestructive && styles.modalDestructive,
                    index > 0 && styles.modalButtonMargin
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <View style={styles.modalButtonContent}>
                    <Text style={[
                      styles.modalButtonText,
                      isPrimary && !isDestructive && styles.modalPrimaryText,
                      isDestructive && styles.modalDestructiveText
                    ]}>
                      {button.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    textAlign: 'justify',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'center',
  },
  modalButtonsCenter: {
    justifyContent: 'center',
  },
  modalButtonRow: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSingle: {
    width: '100%',
  },
  modalButtonMultiple: {
    flex: 1,
  },
  modalButtonMargin: {
    marginLeft: 8,
  },
  modalPrimary: {
    backgroundColor: '#FF6900',
  },
  modalCancel: {
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  modalDestructive: {
    backgroundColor: '#ef4444',
  },
  modalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  modalPrimaryText: {
    color: '#ffffff',
  },
  modalDestructiveText: {
    color: '#ffffff',
  },
});
