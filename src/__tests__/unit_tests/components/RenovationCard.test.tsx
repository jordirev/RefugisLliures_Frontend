/**
 * Tests unitaris per al component RenovationCard
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica del component
 * - Mostrar informació del refugi i renovació
 * - Format de dates
 * - Botons d'acció (veure al mapa, més info, unir-se)
 * - Enllaços de grup (WhatsApp, Telegram)
 * - Mode usuari vs mode visitant
 * - Estat de càrrega quan s'uneix
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { RenovationCard } from '../../../components/RenovationCard';
import { Renovation, Location } from '../../../models';

// Spy on Linking.openURL
const mockOpenURL = jest.fn().mockResolvedValue(true);
jest.spyOn(Linking, 'openURL').mockImplementation(mockOpenURL);

// Mock VideoThumbnail
jest.mock('../../../components/PhotoViewerModal', () => ({
  VideoThumbnail: ({ uri, style }: any) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { style, testID: 'video-thumbnail' }, 
      React.createElement(Text, null, 'Video')
    );
  },
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/whatsapp.svg', () => 'WhatsAppIcon');
jest.mock('../../../assets/icons/region.svg', () => 'RegionIcon');
jest.mock('../../../assets/icons/calendar2.svg', () => 'CalendarIcon');

describe('RenovationCard Component', () => {
  const mockRenovation: Renovation = {
    id: '1',
    refuge_id: '1',
    ini_date: '2025-07-15',
    fin_date: '2025-07-20',
    description: 'Renovació del sostre i millora de les instal·lacions',
    group_link: 'https://chat.whatsapp.com/abcd1234',
    creator_uid: 'user-123',
    participants_uids: ['user-123', 'user-456'],
  };

  const mockRefuge: Location = {
    id: '1',
    name: 'Refugi de Colomers',
    latitude: 42.649,
    longitude: 0.945,
    region: "Val d'Aran",
    departement: 'Lleida',
    images_metadata: [{ url: 'https://example.com/image.jpg' }],
    altitude: 2135,
    capacity: 50,
    condition: 2,
    type: 'non gardé',
  };

  const mockOnViewOnMap = jest.fn();
  const mockOnMoreInfo = jest.fn();
  const mockOnJoin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar amb la informació bàsica del refugi', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText("Val d'Aran")).toBeTruthy();
    });

    it('hauria de mostrar la descripció de la renovació', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('Renovació del sostre i millora de les instal·lacions')).toBeTruthy();
    });

    it('hauria de mostrar el nom per defecte quan no hi ha refugi', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('refuge.title')).toBeTruthy();
    });

    it('hauria de mostrar "common.unknown" quan no hi ha regió', () => {
      const refugeSenseRegio: Location = {
        ...mockRefuge,
        region: undefined,
        departement: undefined,
      };

      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={refugeSenseRegio}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('common.unknown')).toBeTruthy();
    });
  });

  describe('Format de dates', () => {
    it('hauria de mostrar un rang de dates quan ini_date i fin_date són diferents', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('15/07/2025 - 20/07/2025')).toBeTruthy();
    });

    it('hauria de mostrar només una data quan ini_date i fin_date són iguals', () => {
      const renovationMateixDia: Renovation = {
        ...mockRenovation,
        fin_date: '2025-07-15',
      };

      const { getByText } = render(
        <RenovationCard
          renovation={renovationMateixDia}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('15/07/2025')).toBeTruthy();
    });

    it('hauria de mostrar només ini_date quan no hi ha fin_date', () => {
      const renovationSenseFi: Renovation = {
        ...mockRenovation,
        fin_date: undefined,
      };

      const { getByText } = render(
        <RenovationCard
          renovation={renovationSenseFi}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('15/07/2025')).toBeTruthy();
    });

    it('hauria de retornar el string original si la data és invàlida', () => {
      const renovationDataInvalida: Renovation = {
        ...mockRenovation,
        ini_date: 'invalid-date',
        fin_date: undefined,
      };

      const { getByText } = render(
        <RenovationCard
          renovation={renovationDataInvalida}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('invalid-date')).toBeTruthy();
    });
  });

  describe('Botons d\'acció', () => {
    it('hauria de cridar onViewOnMap quan es prem el botó', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      fireEvent.press(getByText('refuge.actions.viewOnMap'));
      expect(mockOnViewOnMap).toHaveBeenCalled();
    });

    it('hauria de cridar onMoreInfo quan es prem el botó', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      fireEvent.press(getByText('+ renovations.moreInfo'));
      expect(mockOnMoreInfo).toHaveBeenCalled();
    });

    it('hauria de cridar onJoin quan es prem el botó (mode visitant)', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={false}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      fireEvent.press(getByText('renovations.join'));
      expect(mockOnJoin).toHaveBeenCalled();
    });

    it('no hauria de mostrar el botó "unir-se" quan isUserRenovation és true', () => {
      const { queryByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(queryByText('renovations.join')).toBeNull();
    });
  });

  describe('Enllaços de grup', () => {
    it('hauria de mostrar botó de WhatsApp per a usuaris membres', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('renovations.join_whatapp_link')).toBeTruthy();
    });

    it('hauria de mostrar botó de Telegram quan l\'enllaç és de Telegram', () => {
      const renovationTelegram: Renovation = {
        ...mockRenovation,
        group_link: 'https://t.me/gruptest',
      };

      const { getByText } = render(
        <RenovationCard
          renovation={renovationTelegram}
          refuge={mockRefuge}
          isUserRenovation={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByText('renovations.join_telegram_link')).toBeTruthy();
    });

    it('hauria d\'obrir l\'enllaç de grup quan es prem', () => {
      const { getByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      fireEvent.press(getByText('renovations.join_whatapp_link'));
      expect(Linking.openURL).toHaveBeenCalledWith('https://chat.whatsapp.com/abcd1234');
    });

    it('no hauria de mostrar botó de grup si no hi ha group_link', () => {
      const renovationSenseGrup: Renovation = {
        ...mockRenovation,
        group_link: undefined,
      };

      const { queryByText } = render(
        <RenovationCard
          renovation={renovationSenseGrup}
          refuge={mockRefuge}
          isUserRenovation={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(queryByText('renovations.join_whatapp_link')).toBeNull();
      expect(queryByText('renovations.join_telegram_link')).toBeNull();
    });
  });

  describe('Estat de càrrega', () => {
    it('hauria de mostrar ActivityIndicator quan isJoining és true', () => {
      const { getByTestId, queryByText } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={false}
          isJoining={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(queryByText('renovations.join')).toBeNull();
    });
  });

  describe('Imatges i vídeos', () => {
    it('hauria de renderitzar VideoThumbnail per a URLs de vídeo', () => {
      const refugeAmbVideo: Location = {
        ...mockRefuge,
        images_metadata: [{ url: 'https://example.com/video.mp4' }],
      };

      const { getByTestId } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={refugeAmbVideo}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(getByTestId('video-thumbnail')).toBeTruthy();
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot en mode visitant', () => {
      const { toJSON } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={false}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode usuari', () => {
      const { toJSON } = render(
        <RenovationCard
          renovation={mockRenovation}
          refuge={mockRefuge}
          isUserRenovation={true}
          onViewOnMap={mockOnViewOnMap}
          onMoreInfo={mockOnMoreInfo}
          onJoin={mockOnJoin}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
