/**
 * Tests unitaris d'AgeGateScreen (confirmació d'edat bloquejant)
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AgeGateScreen } from '../../../screens/AgeGateScreen';

const mockConfirmAge = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ confirmAge: mockConfirmAge, logout: mockLogout }),
}));

const mockShowAlert = jest.fn();
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: jest.fn(),
  }),
}));

const fillDate = async (getByTestId: any, d: string, m: string, y: string) => {
  await fireEvent.changeText(getByTestId('agegate-day'), d);
  await fireEvent.changeText(getByTestId('agegate-month'), m);
  await fireEvent.changeText(getByTestId('agegate-year'), y);
};

describe('AgeGateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
  });

  it('mostra el títol i el formulari de data de naixement', async () => {
    const { getByText, getByTestId } = await render(<AgeGateScreen />);
    expect(getByText('age.gateTitle')).toBeTruthy();
    expect(getByTestId('agegate-day')).toBeTruthy();
    expect(getByTestId('agegate-month')).toBeTruthy();
    expect(getByTestId('agegate-year')).toBeTruthy();
  });

  it('només accepta dígits als camps', async () => {
    const { getByTestId } = await render(<AgeGateScreen />);
    await fireEvent.changeText(getByTestId('agegate-day'), '1a');
    expect(getByTestId('agegate-day').props.value).toBe('1');
  });

  it('data invàlida → error i no crida el backend', async () => {
    const { getByTestId } = await render(<AgeGateScreen />);
    await fillDate(getByTestId, '30', '02', '1990');
    await act(async () => {
      await fireEvent.press(getByTestId('agegate-submit'));
    });
    expect(getByTestId('agegate-error')).toBeTruthy();
    expect(mockConfirmAge).not.toHaveBeenCalled();
  });

  it('adult → PATCH age-confirmation amb la data ISO', async () => {
    mockConfirmAge.mockResolvedValue(undefined);
    const { getByTestId } = await render(<AgeGateScreen />);
    await fillDate(getByTestId, '7', '3', '1985');
    await act(async () => {
      await fireEvent.press(getByTestId('agegate-submit'));
    });
    expect(mockConfirmAge).toHaveBeenCalledWith('1985-03-07');
    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it('menor de 16 (validació local) → missatge i logout, sense cridar el backend', async () => {
    const { getByTestId } = await render(<AgeGateScreen />);
    await fillDate(getByTestId, '01', '01', String(new Date().getFullYear() - 12));
    await act(async () => {
      await fireEvent.press(getByTestId('agegate-submit'));
    });
    expect(mockConfirmAge).not.toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith('age.underageTitle', 'age.underageMessage', expect.any(Array));
    const buttons = mockShowAlert.mock.calls[0][2];
    await act(async () => {
      buttons[0].onPress();
    });
    expect(mockLogout).toHaveBeenCalled();
  });

  it('403 underage del backend → missatge i logout', async () => {
    mockConfirmAge.mockRejectedValue({ code: 'underage' });
    const { getByTestId } = await render(<AgeGateScreen />);
    await fillDate(getByTestId, '01', '01', '2000');
    await act(async () => {
      await fireEvent.press(getByTestId('agegate-submit'));
    });
    await waitFor(() =>
      expect(mockShowAlert).toHaveBeenCalledWith('age.underageTitle', 'age.underageMessage', expect.any(Array))
    );
    await act(async () => {
      mockShowAlert.mock.calls[0][2][0].onPress();
    });
    expect(mockLogout).toHaveBeenCalled();
  });

  it('altres errors → alerta genèrica', async () => {
    mockConfirmAge.mockRejectedValue(new Error('network'));
    const { getByTestId } = await render(<AgeGateScreen />);
    await fillDate(getByTestId, '01', '01', '2000');
    await act(async () => {
      await fireEvent.press(getByTestId('agegate-submit'));
    });
    expect(mockShowAlert).toHaveBeenCalledWith('common.error', 'age.confirmError');
  });

  it('permet tancar la sessió sense confirmar', async () => {
    const { getByTestId } = await render(<AgeGateScreen />);
    await act(async () => {
      await fireEvent.press(getByTestId('agegate-logout'));
    });
    expect(mockLogout).toHaveBeenCalled();
  });
});
