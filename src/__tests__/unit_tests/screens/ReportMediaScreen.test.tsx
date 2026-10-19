/**
 * Tests unitaris de ReportMediaScreen
 *
 * Cobreix: llista de 16 motius agrupats, validació (motiu, «Altres» amb detalls,
 * ≤1000 caràcters, bona fe), enviament i errors 403/409.
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { ReportMediaScreen } from '../../../screens/ReportMediaScreen';
import { MEDIA_REPORT_REASONS, validateMediaReport } from '../../../utils/mediaReportReasons';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: { refugeId: 'refuge-1', mediaKey: 'refugis-lliures/refuge-1/abc.webp' } }),
}));

const mockMutate = jest.fn();
let mockIsPending = false;
jest.mock('../../../hooks/useMediaModerationQuery', () => ({
  useReportMedia: () => ({ mutate: mockMutate, isPending: mockIsPending }),
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

jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');

describe('ReportMediaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
  });

  it('mostra els 16 motius del contracte agrupats', async () => {
    const { getByTestId, getByText } = await render(<ReportMediaScreen />);
    expect(MEDIA_REPORT_REASONS).toHaveLength(16);
    MEDIA_REPORT_REASONS.forEach((reason) => {
      expect(getByTestId(`report-reason-${reason}`)).toBeTruthy();
    });
    [
      'childSafety',
      'sexualContent',
      'violenceHate',
      'animalCruelty',
      'selfHarm',
      'illegal',
      'privacyRights',
      'fraudSpam',
      'other',
    ].forEach((group) => expect(getByText(`media.report.groups.${group}`)).toBeTruthy());
  });

  it('exigeix triar un motiu', async () => {
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-submit'));
    expect(getByTestId('report-validation-error').props.children).toBe('media.report.errors.reasonRequired');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('exigeix detalls per al motiu «other»', async () => {
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-reason-other'));
    await fireEvent.press(getByTestId('report-good-faith'));
    await fireEvent.press(getByTestId('report-submit'));
    expect(getByTestId('report-validation-error').props.children).toBe('media.report.errors.detailsRequired');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('exigeix la declaració de bona fe', async () => {
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-reason-my_image'));
    await fireEvent.press(getByTestId('report-submit'));
    expect(getByTestId('report-validation-error').props.children).toBe('media.report.errors.goodFaithRequired');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('limita els detalls a 1000 caràcters', async () => {
    const { getByTestId } = await render(<ReportMediaScreen />);
    expect(getByTestId('report-details').props.maxLength).toBe(1000);
    expect(validateMediaReport({ reason: 'other', details: 'x'.repeat(1001), goodFaith: true })).toBe(
      'media.report.errors.detailsTooLong'
    );
  });

  it('envia la denúncia amb refugeId, mediaKey, motiu i detalls', async () => {
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-reason-other'));
    await fireEvent.changeText(getByTestId('report-details'), '  Publicitat d\'una botiga  ');
    await fireEvent.press(getByTestId('report-good-faith'));
    await fireEvent.press(getByTestId('report-submit'));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        refugeId: 'refuge-1',
        mediaKey: 'refugis-lliures/refuge-1/abc.webp',
        reason: 'other',
        details: 'Publicitat d\'una botiga',
      },
      expect.any(Object)
    );
  });

  it('detalls opcionals: no s\'envien si són buits', async () => {
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-reason-violence_gore'));
    await fireEvent.press(getByTestId('report-good-faith'));
    await fireEvent.press(getByTestId('report-submit'));
    expect(mockMutate.mock.calls[0][0].details).toBeUndefined();
  });

  it('èxit: mostra el missatge amb el correu de contacte i torna enrere', async () => {
    mockMutate.mockImplementation((_vars, opts) => opts.onSuccess());
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-reason-hate_speech'));
    await fireEvent.press(getByTestId('report-good-faith'));
    await fireEvent.press(getByTestId('report-submit'));

    expect(mockShowAlert).toHaveBeenCalledWith(
      'media.report.successTitle',
      'media.report.successMessage',
      expect.any(Array)
    );
    const buttons = mockShowAlert.mock.calls[0][2];
    await act(() => buttons[0].onPress());
    expect(mockGoBack).toHaveBeenCalled();
  });

  it.each([
    ['own_media', 'media.report.errors.ownMedia'],
    ['already_reported', 'media.report.errors.alreadyReported'],
    ['user_blocked', 'media.errors.userBlocked'],
    ['unknown', 'media.report.errors.generic'],
  ])('error %s → %s', async (code, key) => {
    mockMutate.mockImplementation((_vars, opts) => opts.onError({ code }));
    const { getByTestId } = await render(<ReportMediaScreen />);
    await fireEvent.press(getByTestId('report-reason-fraud_scam_spam'));
    await fireEvent.press(getByTestId('report-good-faith'));
    await fireEvent.press(getByTestId('report-submit'));
    await waitFor(() => expect(mockShowAlert).toHaveBeenCalledWith('common.error', key));
  });
});
