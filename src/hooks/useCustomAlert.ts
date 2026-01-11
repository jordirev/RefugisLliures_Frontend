import { useState, useCallback } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title?: string;
  message: string;
  buttons?: AlertButton[];
}

interface AlertState {
  visible: boolean;
  config: AlertConfig | null;
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    config: null,
  });

  const showAlert = useCallback((title: string | undefined, message: string, buttons?: AlertButton[]) => {
    // Si el primer parámetro es undefined y el segundo es el mensaje, ajustar
    const finalTitle = title;
    const finalMessage = message;
    
    setAlertState({
      visible: true,
      config: {
        title: finalTitle,
        message: finalMessage,
        buttons: buttons || [{ text: 'OK', style: 'default' }],
      },
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState({
      visible: false,
      config: null,
    });
  }, []);

  return {
    alertVisible: alertState.visible,
    alertConfig: alertState.config,
    showAlert,
    hideAlert,
  };
}
