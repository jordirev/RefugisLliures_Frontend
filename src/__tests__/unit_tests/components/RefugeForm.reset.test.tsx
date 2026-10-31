/**
 * Tests dels botons "restaurar valor original" de RefugeForm (mode edició)
 *
 * Cobreixen:
 * - Cap botó visible en mode create ni abans de modificar res
 * - El botó apareix només quan el camp difereix de l'original
 * - Restaurar cada camp (nom, coordenades, regió, departament, tipus, estat, altitud,
 *   places, descripció, serveis, enllaços) torna el valor original
 * - Restaurar tots els camps desactiva de nou l'enviament (sense canvis)
 * - L'altitud restaurada no es sobreescriu amb l'autocompletat per coordenades
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RefugeForm } from '../../../components/RefugeForm';
import { Location } from '../../../models';
import { RefugisService } from '../../../services/RefugisService';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('../../../assets/icons/altitude2.svg', () => 'AltitudeIcon');
jest.mock('../../../assets/icons/users.svg', () => 'UsersIcon');

jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: jest.fn(),
    hideAlert: jest.fn(),
  }),
}));

jest.mock('../../../services/RefugisService', () => ({
  RefugisService: { getElevation: jest.fn().mockResolvedValue(1500) },
}));

const original: Location = {
  id: 'refuge-1',
  name: 'Refugi de Test',
  coord: { lat: 42.5678, long: 1.2345 },
  altitude: 2000,
  places: 20,
  type: 'non gardé',
  condition: 2,
  region: 'Pirineus',
  departement: 'Catalunya',
  description: 'Un refugi de test',
  links: ['https://example.com'],
  info_comp: {
    manque_un_mur: false,
    cheminee: true,
    poele: false,
    couvertures: true,
    latrines: false,
    bois: true,
    eau: true,
    matelas: false,
    couchage: true,
    bas_flancs: false,
    lits: true,
    mezzanine_etage: false,
  },
};

const ALL_RESET_IDS = [
  'reset-name',
  'reset-latitude',
  'reset-longitude',
  'reset-region',
  'reset-departement',
  'reset-type',
  'reset-condition',
  'reset-altitude',
  'reset-places',
  'reset-description',
  'reset-amenities',
  'reset-links',
];

const renderEdit = async () =>
  render(<RefugeForm mode="edit" initialData={original} onSubmit={jest.fn()} onCancel={jest.fn()} />);

describe('RefugeForm - restaurar valors originals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no mostra cap botó en mode create', async () => {
    const { queryByTestId } = await render(
      <RefugeForm mode="create" onSubmit={jest.fn()} onCancel={jest.fn()} />
    );
    ALL_RESET_IDS.forEach((id) => expect(queryByTestId(id)).toBeNull());
  });

  it('no mostra cap botó en mode edit mentre no s\'ha modificat res', async () => {
    const { queryByTestId } = await renderEdit();
    ALL_RESET_IDS.forEach((id) => expect(queryByTestId(id)).toBeNull());
  });

  it('el botó apareix en modificar un camp i desapareix en restaurar-lo', async () => {
    const { getByDisplayValue, queryByTestId, getByTestId } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('Refugi de Test'), 'Un altre nom');
    expect(getByTestId('reset-name')).toBeTruthy();
    // només el camp modificat té botó
    expect(queryByTestId('reset-latitude')).toBeNull();

    await fireEvent.press(getByTestId('reset-name'));
    expect(getByDisplayValue('Refugi de Test')).toBeTruthy();
    expect(queryByTestId('reset-name')).toBeNull();
  });

  it('restaura la latitud i la longitud', async () => {
    const { getByDisplayValue, getByTestId, queryByTestId } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('42.5678'), '43.1111');
    await fireEvent.changeText(getByDisplayValue('1.2345'), '2.2222');

    await fireEvent.press(getByTestId('reset-latitude'));
    await fireEvent.press(getByTestId('reset-longitude'));

    expect(getByDisplayValue('42.5678')).toBeTruthy();
    expect(getByDisplayValue('1.2345')).toBeTruthy();
    expect(queryByTestId('reset-latitude')).toBeNull();
    expect(queryByTestId('reset-longitude')).toBeNull();
  });

  it('restaura la regió i el departament', async () => {
    const { getByDisplayValue, getByTestId } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('Pirineus'), 'Alps');
    await fireEvent.changeText(getByDisplayValue('Catalunya'), 'Savoia');

    await fireEvent.press(getByTestId('reset-region'));
    await fireEvent.press(getByTestId('reset-departement'));

    expect(getByDisplayValue('Pirineus')).toBeTruthy();
    expect(getByDisplayValue('Catalunya')).toBeTruthy();
  });

  it('restaura les places i la descripció', async () => {
    const { getByDisplayValue, getByTestId } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('20'), '35');
    await fireEvent.changeText(getByDisplayValue('Un refugi de test'), 'Descripció nova');

    await fireEvent.press(getByTestId('reset-places'));
    await fireEvent.press(getByTestId('reset-description'));

    expect(getByDisplayValue('20')).toBeTruthy();
    expect(getByDisplayValue('Un refugi de test')).toBeTruthy();
  });

  it('restaura l\'altitud i no l\'autocompleta de nou per coordenades', async () => {
    const { getByDisplayValue, getByTestId, queryByTestId } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('2000'), '1234');
    await fireEvent.press(getByTestId('reset-altitude'));

    expect(getByDisplayValue('2000')).toBeTruthy();
    expect(queryByTestId('reset-altitude')).toBeNull();

    // Es canvia una coordenada i es restaura l'altitud: el servei d'elevació no ha de sobreescriure-la
    await fireEvent.changeText(getByDisplayValue('42.5678'), '43.1111');
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(RefugisService.getElevation).not.toHaveBeenCalled();
    expect(getByDisplayValue('2000')).toBeTruthy();
  });

  it('restaura el tipus i l\'estat (condition)', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderEdit();

    // Tipus: l'original és "non gardé"; s'obre el selector i es tria "orri"
    await fireEvent.press(getByText('refuge.type.noGuarded'));
    await fireEvent.press(getByText('refuge.type.shelter'));
    expect(getByTestId('reset-type')).toBeTruthy();
    expect(queryByTestId('reset-condition')).toBeNull();

    await fireEvent.press(getByTestId('reset-type'));
    expect(queryByTestId('reset-type')).toBeNull();
    expect(getByText('refuge.type.noGuarded')).toBeTruthy();

    // Estat: l'original és 2 ("good"); es tria "excellent"
    await fireEvent.press(getByText('refuge.condition.good'));
    await fireEvent.press(getByText('refuge.condition.excellent'));
    expect(getByTestId('reset-condition')).toBeTruthy();

    await fireEvent.press(getByTestId('reset-condition'));
    expect(queryByTestId('reset-condition')).toBeNull();
    expect(getByText('refuge.condition.good')).toBeTruthy();
  });

  it('restaura els serveis (amenities)', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderEdit();

    await fireEvent.press(getByText('refuge.amenities.poele'));
    expect(getByTestId('reset-amenities')).toBeTruthy();

    await fireEvent.press(getByTestId('reset-amenities'));
    expect(queryByTestId('reset-amenities')).toBeNull();
  });

  it('restaura els enllaços', async () => {
    const { getByDisplayValue, getByTestId, queryByTestId, getByText } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('https://example.com'), 'https://altre.com');
    expect(getByTestId('reset-links')).toBeTruthy();
    await fireEvent.press(getByTestId('reset-links'));
    expect(getByDisplayValue('https://example.com')).toBeTruthy();
    expect(queryByTestId('reset-links')).toBeNull();

    // Afegir un enllaç buit no és un canvi; afegir-ne un amb text sí
    await fireEvent.press(getByText('+ createRefuge.addLink'));
    expect(queryByTestId('reset-links')).toBeNull();
  });

  it('restaurar tots els camps modificats deixa el formulari sense canvis', async () => {
    const { getByDisplayValue, getByTestId, queryByTestId } = await renderEdit();

    await fireEvent.changeText(getByDisplayValue('Refugi de Test'), 'Nom nou');
    await fireEvent.changeText(getByDisplayValue('Un refugi de test'), 'Descripció nova');
    await fireEvent.changeText(getByDisplayValue('20'), '99');

    await fireEvent.press(getByTestId('reset-name'));
    await fireEvent.press(getByTestId('reset-description'));
    await fireEvent.press(getByTestId('reset-places'));

    await waitFor(() => {
      ALL_RESET_IDS.forEach((id) => expect(queryByTestId(id)).toBeNull());
    });
  });
});
