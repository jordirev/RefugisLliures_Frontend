/**
 * Tests unitaris per al component BadgeSelector
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica per tipus i condició
 * - Toggle d'expansió intern i extern
 * - Selecció d'opcions
 * - Helpers getTypeOptions i getConditionOptions
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BadgeSelector, getTypeOptions, getConditionOptions } from '../../../components/BadgeSelector';

describe('BadgeSelector Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Helpers', () => {
    it('getTypeOptions hauria de retornar les opcions de tipus correctes', () => {
      const options = getTypeOptions();
      
      expect(options).toHaveLength(5);
      expect(options[0]).toEqual({ value: 'non gardé', label: 'refuge.type.noGuarded' });
      expect(options[1]).toEqual({ value: 'cabane ouverte mais ocupee par le berger l ete', label: 'refuge.type.occupiedInSummer' });
      expect(options[2]).toEqual({ value: 'fermée', label: 'refuge.type.closed' });
      expect(options[3]).toEqual({ value: 'orri', label: 'refuge.type.shelter' });
      expect(options[4]).toEqual({ value: 'emergence', label: 'refuge.type.emergency' });
    });

    it('getConditionOptions hauria de retornar les opcions de condició correctes', () => {
      const options = getConditionOptions();
      
      expect(options).toHaveLength(4);
      expect(options[0]).toEqual({ value: 0, label: 'refuge.condition.poor' });
      expect(options[1]).toEqual({ value: 1, label: 'refuge.condition.fair' });
      expect(options[2]).toEqual({ value: 2, label: 'refuge.condition.good' });
      expect(options[3]).toEqual({ value: 3, label: 'refuge.condition.excellent' });
    });
  });

  describe('Renderització de tipus', () => {
    it('hauria de renderitzar BadgeType quan type és "type"', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
        />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de renderitzar amb valor undefined', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="type"
          onValueChange={mockOnValueChange}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Renderització de condició', () => {
    it('hauria de renderitzar BadgeCondition quan type és "condition"', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="condition"
          value={2}
          onValueChange={mockOnValueChange}
        />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de renderitzar amb valor undefined per condició', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="condition"
          onValueChange={mockOnValueChange}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Toggle intern', () => {
    it('hauria d\'expandir quan es prem el badge (sense control extern)', async () => {
      const { getByText, queryByText, toJSON } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
        />
      );

      // Inicialment les opcions no haurien de ser visibles
      const initialSnapshot = toJSON();
      
      // Premem per expandir - busquem el text del badge que és la traducció
      // Com que està mockejat, busquem per la key de traducció
      const badge = getByText('refuge.type.noGuarded');
      await fireEvent.press(badge);

      // Ara les opcions haurien de ser visibles
      const expandedSnapshot = toJSON();
      expect(expandedSnapshot).not.toEqual(initialSnapshot);
    });

    it('hauria de col·lapsar quan es selecciona una opció', async () => {
      const { getByText } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
        />
      );

      // Expandim
      await fireEvent.press(getByText('refuge.type.noGuarded'));

      // Seleccionem una opció
      await fireEvent.press(getByText('refuge.type.closed'));

      expect(mockOnValueChange).toHaveBeenCalledWith('fermée');
    });
  });

  describe('Control extern d\'expansió', () => {
    it('hauria d\'utilitzar expanded extern quan es proporciona', async () => {
      const mockOnToggle = jest.fn();

      const { getByText } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
          expanded={true}
          onToggle={mockOnToggle}
        />
      );

      // Les opcions haurien de ser visibles perquè expanded és true
      expect(getByText('refuge.type.closed')).toBeTruthy();
      expect(getByText('refuge.type.shelter')).toBeTruthy();
    });

    it('hauria de cridar onToggle extern quan es prem', async () => {
      const mockOnToggle = jest.fn();

      const { getByText } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
          expanded={false}
          onToggle={mockOnToggle}
        />
      );

      await fireEvent.press(getByText('refuge.type.noGuarded'));
      expect(mockOnToggle).toHaveBeenCalled();
    });
  });

  describe('Selecció d\'opcions de tipus', () => {
    it('hauria de cridar onValueChange amb el valor correcte per tipus', async () => {
      const { getByText } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
        />
      );

      // Expandim
      await fireEvent.press(getByText('refuge.type.noGuarded'));

      // Seleccionem 'orri'
      await fireEvent.press(getByText('refuge.type.shelter'));

      expect(mockOnValueChange).toHaveBeenCalledWith('orri');
    });
  });

  describe('Selecció d\'opcions de condició', () => {
    it('hauria de cridar onValueChange amb el valor numèric correcte', async () => {
      const { getByText } = await render(
        <BadgeSelector
          type="condition"
          value={1}
          onValueChange={mockOnValueChange}
        />
      );

      // Expandim
      await fireEvent.press(getByText('refuge.condition.fair'));

      // Seleccionem 'excellent' (valor 3)
      await fireEvent.press(getByText('refuge.condition.excellent'));

      expect(mockOnValueChange).toHaveBeenCalledWith(3);
    });
  });

  describe('renderOptionsExternal', () => {
    it('no hauria de renderitzar opcions quan renderOptionsExternal és true', async () => {
      const { queryByText, getByText } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
          expanded={true}
          renderOptionsExternal={true}
        />
      );

      // El badge hauria de ser visible
      expect(getByText('refuge.type.noGuarded')).toBeTruthy();

      // Les opcions no haurien de ser visibles encara que expanded sigui true
      expect(queryByText('refuge.type.closed')).toBeNull();
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot per tipus col·lapsat', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot per condició col·lapsat', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="condition"
          value={2}
          onValueChange={mockOnValueChange}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot per tipus expandit', async () => {
      const { toJSON } = await render(
        <BadgeSelector
          type="type"
          value="non gardé"
          onValueChange={mockOnValueChange}
          expanded={true}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
