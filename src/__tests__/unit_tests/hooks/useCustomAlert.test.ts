/**
 * Tests unitaris per al hook useCustomAlert
 * 
 * Aquest fitxer cobreix:
 * - Estat inicial del hook
 * - Funció showAlert amb diferents configuracions
 * - Funció hideAlert
 * - Gestió de botons
 * - Casos límit i errors
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

describe('useCustomAlert Hook', () => {
  describe('Estat inicial', () => {
    it('hauria de tenir l\'estat inicial correcte', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      expect(result.current.alertVisible).toBe(false);
      expect(result.current.alertConfig).toBeNull();
      expect(typeof result.current.showAlert).toBe('function');
      expect(typeof result.current.hideAlert).toBe('function');
    });

    it('hauria de retornar funcions estables entre renders', async () => {
      const { result, rerender } = await renderHook(() => useCustomAlert());

      const initialShowAlert = result.current.showAlert;
      const initialHideAlert = result.current.hideAlert;

      await rerender({});

      expect(result.current.showAlert).toBe(initialShowAlert);
      expect(result.current.hideAlert).toBe(initialHideAlert);
    });
  });

  describe('showAlert - Funcionalitat bàsica', () => {
    it('hauria de mostrar una alerta amb títol i missatge', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Títol de prova', 'Missatge de prova');
      });

      expect(result.current.alertVisible).toBe(true);
      expect(result.current.alertConfig).not.toBeNull();
      expect(result.current.alertConfig?.title).toBe('Títol de prova');
      expect(result.current.alertConfig?.message).toBe('Missatge de prova');
    });

    it('hauria de mostrar una alerta només amb missatge (sense títol)', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert(undefined, 'Missatge sense títol');
      });

      expect(result.current.alertVisible).toBe(true);
      expect(result.current.alertConfig?.title).toBeUndefined();
      expect(result.current.alertConfig?.message).toBe('Missatge sense títol');
    });

    it('hauria de mostrar una alerta amb botó OK per defecte quan no es proporcionen botons', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Títol', 'Missatge');
      });

      expect(result.current.alertConfig?.buttons).toBeDefined();
      expect(result.current.alertConfig?.buttons).toHaveLength(1);
      expect(result.current.alertConfig?.buttons![0].text).toBe('OK');
      expect(result.current.alertConfig?.buttons![0].style).toBe('default');
    });

    it('hauria de mostrar una alerta amb botons personalitzats', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [
        { text: 'Cancel·lar', style: 'cancel' as const },
        { text: 'Acceptar', style: 'default' as const },
      ];

      await act(() => {
        result.current.showAlert('Confirmar', 'Estàs segur?', buttons);
      });

      expect(result.current.alertConfig?.buttons).toHaveLength(2);
      expect(result.current.alertConfig?.buttons![0].text).toBe('Cancel·lar');
      expect(result.current.alertConfig?.buttons![1].text).toBe('Acceptar');
    });

    it('hauria de gestionar múltiples botons', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [
        { text: 'Opció 1', style: 'default' as const },
        { text: 'Opció 2', style: 'default' as const },
        { text: 'Cancel·lar', style: 'cancel' as const },
      ];

      await act(() => {
        result.current.showAlert('Trieu una opció', 'Seleccioneu una de les següents:', buttons);
      });

      expect(result.current.alertConfig?.buttons).toHaveLength(3);
    });
  });

  describe('showAlert - Botons amb callbacks', () => {
    it('hauria de mantenir els callbacks dels botons', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const onPressMock = jest.fn();
      const buttons = [
        { text: 'Acceptar', onPress: onPressMock, style: 'default' as const },
      ];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].onPress).toBe(onPressMock);
    });

    it('hauria de mantenir múltiples callbacks diferents', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const onPress1 = jest.fn();
      const onPress2 = jest.fn();
      const buttons = [
        { text: 'Botó 1', onPress: onPress1, style: 'default' as const },
        { text: 'Botó 2', onPress: onPress2, style: 'default' as const },
      ];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].onPress).toBe(onPress1);
      expect(result.current.alertConfig?.buttons![1].onPress).toBe(onPress2);
    });

    it('hauria de permetre botons sense callback', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [
        { text: 'OK', style: 'default' as const },
      ];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].onPress).toBeUndefined();
    });
  });

  describe('showAlert - Estils de botons', () => {
    it('hauria de suportar estil "default"', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [{ text: 'OK', style: 'default' as const }];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].style).toBe('default');
    });

    it('hauria de suportar estil "cancel"', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [{ text: 'Cancel·lar', style: 'cancel' as const }];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].style).toBe('cancel');
    });

    it('hauria de suportar estil "destructive"', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [{ text: 'Eliminar', style: 'destructive' as const }];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].style).toBe('destructive');
    });

    it('hauria de combinar diferents estils de botons', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const buttons = [
        { text: 'Eliminar', style: 'destructive' as const },
        { text: 'Acceptar', style: 'default' as const },
        { text: 'Cancel·lar', style: 'cancel' as const },
      ];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].style).toBe('destructive');
      expect(result.current.alertConfig?.buttons![1].style).toBe('default');
      expect(result.current.alertConfig?.buttons![2].style).toBe('cancel');
    });
  });

  describe('hideAlert', () => {
    it('hauria d\'amagar l\'alerta quan es crida hideAlert', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Títol', 'Missatge');
      });

      expect(result.current.alertVisible).toBe(true);

      await act(() => {
        result.current.hideAlert();
      });

      expect(result.current.alertVisible).toBe(false);
      expect(result.current.alertConfig).toBeNull();
    });

    it('hauria de poder amagar sense haver mostrat cap alerta prèviament', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      expect(result.current.alertVisible).toBe(false);

      await act(() => {
        result.current.hideAlert();
      });

      expect(result.current.alertVisible).toBe(false);
      expect(result.current.alertConfig).toBeNull();
    });

    it('hauria de permetre mostrar una nova alerta després d\'amagar', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Primera alerta', 'Primer missatge');
      });

      await act(() => {
        result.current.hideAlert();
      });

      await act(() => {
        result.current.showAlert('Segona alerta', 'Segon missatge');
      });

      expect(result.current.alertVisible).toBe(true);
      expect(result.current.alertConfig?.title).toBe('Segona alerta');
      expect(result.current.alertConfig?.message).toBe('Segon missatge');
    });
  });

  describe('Múltiples alertes consecutives', () => {
    it('hauria de sobreescriure l\'alerta anterior quan se\'n mostra una de nova', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Primera', 'Missatge 1');
      });

      expect(result.current.alertConfig?.title).toBe('Primera');

      await act(() => {
        result.current.showAlert('Segona', 'Missatge 2');
      });

      expect(result.current.alertConfig?.title).toBe('Segona');
      expect(result.current.alertConfig?.message).toBe('Missatge 2');
    });

    it('hauria de mantenir la visibilitat quan es mostra una nova alerta', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Primera', 'Missatge 1');
      });

      expect(result.current.alertVisible).toBe(true);

      await act(() => {
        result.current.showAlert('Segona', 'Missatge 2');
      });

      expect(result.current.alertVisible).toBe(true);
    });
  });

  describe('Casos límit i especials', () => {
    it('hauria de gestionar títols molt llargs', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const longTitle = 'A'.repeat(1000);

      await act(() => {
        result.current.showAlert(longTitle, 'Missatge');
      });

      expect(result.current.alertConfig?.title).toBe(longTitle);
      expect(result.current.alertConfig?.title).toHaveLength(1000);
    });

    it('hauria de gestionar missatges molt llargs', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const longMessage = 'B'.repeat(5000);

      await act(() => {
        result.current.showAlert('Títol', longMessage);
      });

      expect(result.current.alertConfig?.message).toBe(longMessage);
      expect(result.current.alertConfig?.message).toHaveLength(5000);
    });

    it('hauria de gestionar títols buits', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('', 'Missatge');
      });

      expect(result.current.alertConfig?.title).toBe('');
    });

    it('hauria de gestionar missatges buits', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Títol', '');
      });

      expect(result.current.alertConfig?.message).toBe('');
    });

    it('hauria de gestionar caràcters especials en títols', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const specialTitle = '<>&"\'àèìòù';

      await act(() => {
        result.current.showAlert(specialTitle, 'Missatge');
      });

      expect(result.current.alertConfig?.title).toBe(specialTitle);
    });

    it('hauria de gestionar caràcters especials en missatges', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const specialMessage = 'Línea 1\nLínea 2\tTab\r\n';

      await act(() => {
        result.current.showAlert('Títol', specialMessage);
      });

      expect(result.current.alertConfig?.message).toBe(specialMessage);
    });

    it('hauria de gestionar emojis en títols i missatges', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('🏔️ Refugis', '✅ Guardat correctament! 🎉');
      });

      expect(result.current.alertConfig?.title).toBe('🏔️ Refugis');
      expect(result.current.alertConfig?.message).toBe('✅ Guardat correctament! 🎉');
    });

    it('hauria de gestionar arrays buits de botons', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', []);
      });

      expect(result.current.alertVisible).toBe(true);
      expect(result.current.alertConfig?.title).toBe('Títol');
      expect(result.current.alertConfig?.message).toBe('Missatge');
      expect(result.current.alertConfig?.buttons).toEqual([]);
    });

    it('hauria de gestionar un gran nombre de botons', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const manyButtons = Array.from({ length: 10 }, (_, i) => ({
        text: `Opció ${i + 1}`,
        style: 'default' as const,
      }));

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', manyButtons);
      });

      expect(result.current.alertConfig?.buttons).toHaveLength(10);
    });

    it('hauria de gestionar botons amb textos molt llargs', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const longButtonText = 'A'.repeat(100);
      const buttons = [{ text: longButtonText, style: 'default' as const }];

      await act(() => {
        result.current.showAlert('Títol', 'Missatge', buttons);
      });

      expect(result.current.alertConfig?.buttons![0].text).toHaveLength(100);
    });
  });

  describe('Estabilitat de funcions', () => {
    it('showAlert hauria de ser estable entre crides', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const initialShowAlert = result.current.showAlert;

      await act(() => {
        result.current.showAlert('Test', 'Missatge');
      });

      expect(result.current.showAlert).toBe(initialShowAlert);
    });

    it('hideAlert hauria de ser estable entre crides', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      const initialHideAlert = result.current.hideAlert;

      await act(() => {
        result.current.showAlert('Test', 'Missatge');
      });

      await act(() => {
        result.current.hideAlert();
      });

      expect(result.current.hideAlert).toBe(initialHideAlert);
    });
  });

  describe('Combinació d\'operacions', () => {
    it('hauria de gestionar múltiples operacions show/hide', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      // Mostrar 1
      await act(() => {
        result.current.showAlert('Alerta 1', 'Missatge 1');
      });
      expect(result.current.alertVisible).toBe(true);

      // Amagar
      await act(() => {
        result.current.hideAlert();
      });
      expect(result.current.alertVisible).toBe(false);

      // Mostrar 2
      await act(() => {
        result.current.showAlert('Alerta 2', 'Missatge 2');
      });
      expect(result.current.alertVisible).toBe(true);
      expect(result.current.alertConfig?.title).toBe('Alerta 2');

      // Amagar
      await act(() => {
        result.current.hideAlert();
      });
      expect(result.current.alertVisible).toBe(false);
    });

    it('hauria de gestionar múltiples hideAlert consecutius', async () => {
      const { result } = await renderHook(() => useCustomAlert());

      await act(() => {
        result.current.showAlert('Títol', 'Missatge');
      });

      await act(() => {
        result.current.hideAlert();
        result.current.hideAlert();
        result.current.hideAlert();
      });

      expect(result.current.alertVisible).toBe(false);
      expect(result.current.alertConfig).toBeNull();
    });
  });
});
