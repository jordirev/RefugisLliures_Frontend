/**
 * Tests unitaris de MediaReportsScreen (admin)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MediaReportsScreen } from '../../../screens/MediaReportsScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));

let mockReports: any[] = [];
const mockUseMediaReports = jest.fn();
const mockResolve = jest.fn();
jest.mock('../../../hooks/useMediaModerationQuery', () => ({
  useMediaReports: (status: string) => {
    mockUseMediaReports(status);
    return { data: mockReports, isLoading: false, isError: false, refetch: jest.fn(), isRefetching: false };
  },
  useResolveMediaReport: () => ({ mutate: mockResolve, isPending: false }),
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

const report = {
  id: 'rep-1',
  refuge_id: 'refuge-1',
  media_key: 'refugis-lliures/refuge-1/a.webp',
  reason: 'my_image',
  details: 'Hi surto jo',
  status: 'pending',
  media_creator_uid: 'author-1',
  reports_count: 2,
  priority: 'high',
  created_at: '2026-10-01T10:00:00Z',
  media: {
    key: 'refugis-lliures/refuge-1/a.webp',
    url: 'https://r2/a.webp',
    thumb_url: 'https://r2/a_thumb.webp',
    uploaded_at: '2026-09-01T10:00:00Z',
    creator_uid: 'author-1',
  },
};

describe('MediaReportsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReports = [report];
  });

  it('carrega les pendents per defecte i mostra la previsualització', async () => {
    const { getByText, container } = await render(<MediaReportsScreen />);
    expect(mockUseMediaReports).toHaveBeenCalledWith('pending');
    expect(getByText('media.report.reasons.my_image')).toBeTruthy();
    expect(getByText('Hi surto jo')).toBeTruthy();
    const images = container.queryAll((n: any) => n.type === 'ExpoImage');
    expect(images[0].props.source.uri).toBe('https://r2/a_thumb.webp');
  });

  it('canvia a resoltes', async () => {
    const { getByTestId } = await render(<MediaReportsScreen />);
    await fireEvent.press(getByTestId('media-reports-tab-resolved'));
    expect(mockUseMediaReports).toHaveBeenLastCalledWith('resolved');
  });

  it('exigeix una motivació abans de resoldre', async () => {
    const { getByTestId } = await render(<MediaReportsScreen />);
    await fireEvent.press(getByTestId('media-report-rep-1-action-remove_and_strike'));
    expect(getByTestId('media-report-confirm').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(getByTestId('media-report-confirm'));
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('resol amb acció i motivació', async () => {
    const { getByTestId } = await render(<MediaReportsScreen />);
    await fireEvent.press(getByTestId('media-report-rep-1-action-remove_and_strike'));
    await fireEvent.changeText(getByTestId('media-report-statement'), '  Imatge d\'una persona sense consentiment  ');
    await fireEvent.press(getByTestId('media-report-confirm'));
    expect(mockResolve).toHaveBeenCalledWith(
      {
        reportId: 'rep-1',
        action: 'remove_and_strike',
        statement: 'Imatge d\'una persona sense consentiment',
        refugeId: 'refuge-1',
        creatorUid: 'author-1',
      },
      expect.any(Object)
    );
  });

  it('denúncia automàtica sense refugi ni autor: resol sense petar', async () => {
    mockReports = [{ ...report, id: 'rep-2', refuge_id: null, media_creator_uid: null, reporter_uid: 'system', media: null }];
    const { getByTestId } = await render(<MediaReportsScreen />);
    await fireEvent.press(getByTestId('media-report-rep-2-action-remove'));
    await fireEvent.changeText(getByTestId('media-report-statement'), 'Motiu');
    await fireEvent.press(getByTestId('media-report-confirm'));
    expect(mockResolve).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: 'rep-2', refugeId: undefined, creatorUid: null }),
      expect.any(Object)
    );
  });

  it('409 already_resolved mostra un missatge específic', async () => {
    const { getByTestId } = await render(<MediaReportsScreen />);
    await fireEvent.press(getByTestId('media-report-rep-1-action-remove'));
    await fireEvent.changeText(getByTestId('media-report-statement'), 'Motiu');
    await fireEvent.press(getByTestId('media-report-confirm'));
    const opts = mockResolve.mock.calls[0][1];
    opts.onError({ code: 'already_resolved' });
    expect(mockShowAlert).toHaveBeenCalledWith('common.error', 'media.admin.alreadyResolved');
  });

  it('llista buida', async () => {
    mockReports = [];
    const { getByText } = await render(<MediaReportsScreen />);
    expect(getByText('media.admin.empty')).toBeTruthy();
  });
});
