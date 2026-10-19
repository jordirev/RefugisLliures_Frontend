import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RightsDeclarationModal } from '../../../components/RightsDeclarationModal';

describe('RightsDeclarationModal', () => {
  const onAccept = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('mostra les declaracions (autoria i consentiment de les persones)', async () => {
    const { getByText } = await render(<RightsDeclarationModal visible onAccept={onAccept} onCancel={onCancel} />);
    expect(getByText('media.rights.title')).toBeTruthy();
    expect(getByText('• media.rights.authorship')).toBeTruthy();
    expect(getByText('• media.rights.peopleConsent')).toBeTruthy();
  });

  it('no deixa continuar fins que es marca la casella', async () => {
    const { getByTestId } = await render(<RightsDeclarationModal visible onAccept={onAccept} onCancel={onCancel} />);
    expect(getByTestId('rights-accept').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(getByTestId('rights-accept'));
    expect(onAccept).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId('rights-checkbox'));
    await fireEvent.press(getByTestId('rights-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('cancel·lar crida onCancel', async () => {
    const { getByTestId } = await render(<RightsDeclarationModal visible onAccept={onAccept} onCancel={onCancel} />);
    await fireEvent.press(getByTestId('rights-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
