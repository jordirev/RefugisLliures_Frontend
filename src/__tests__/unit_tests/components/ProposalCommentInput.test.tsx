/**
 * Tests unitaris per al component ProposalCommentInput
 * 
 * Aquest fitxer cobreix:
 * - Renderització per cada mode (create, edit, delete)
 * - Validació de caràcters mínims i màxims
 * - Mostrar/amagar advertències
 * - Gestió d'errors
 * - Placeholder correcte per mode
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProposalCommentInput } from '../../../components/ProposalCommentInput';

describe('ProposalCommentInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització per mode create', () => {
    it('hauria de renderitzar amb placeholder de create', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="create"
          value=""
          onChange={mockOnChange}
          minChars={0}
          maxChars={500}
        />
      );

      expect(getByPlaceholderText('createRefuge.adminCommentPlaceholder')).toBeTruthy();
    });

    it('no hauria de mostrar advertència de caràcters mínims en mode create', () => {
      const { queryByText } = render(
        <ProposalCommentInput
          mode="create"
          value="Curt"
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      // En mode create, showMinWarning és false
      expect(queryByText(/editRefuge.minChars/)).toBeNull();
    });
  });

  describe('Renderització per mode edit', () => {
    it('hauria de renderitzar amb placeholder de edit', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="edit"
          value=""
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      expect(getByPlaceholderText('editRefuge.adminCommentPlaceholder')).toBeTruthy();
    });

    it('hauria de mostrar advertència quan hi ha menys caràcters dels mínims', () => {
      const { getByText } = render(
        <ProposalCommentInput
          mode="edit"
          value="Curt"
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      expect(getByText(/editRefuge.minChars/)).toBeTruthy();
    });

    it('no hauria de mostrar advertència quan s\'assoleix el mínim', () => {
      const { queryByText } = render(
        <ProposalCommentInput
          mode="edit"
          value={'A'.repeat(60)}
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      expect(queryByText(/editRefuge.minChars/)).toBeNull();
    });
  });

  describe('Renderització per mode delete', () => {
    it('hauria de renderitzar amb placeholder de delete', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="delete"
          value=""
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      expect(getByPlaceholderText('deleteRefuge.commentPlaceholder')).toBeTruthy();
    });

    it('hauria de mostrar label en mode delete', () => {
      const { getByText } = render(
        <ProposalCommentInput
          mode="delete"
          value=""
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      expect(getByText('deleteRefuge.commentLabel')).toBeTruthy();
    });
  });

  describe('Comptador de caràcters', () => {
    it('hauria de mostrar el comptador de caràcters', () => {
      const { getByText } = render(
        <ProposalCommentInput
          mode="create"
          value="Hola"
          onChange={mockOnChange}
          minChars={0}
          maxChars={500}
        />
      );

      expect(getByText(/4\/500/)).toBeTruthy();
    });

    it('hauria d\'actualitzar el comptador quan canvia el text', () => {
      const { getByPlaceholderText, getByText, rerender } = render(
        <ProposalCommentInput
          mode="create"
          value="Hola"
          onChange={mockOnChange}
          minChars={0}
          maxChars={500}
        />
      );

      const input = getByPlaceholderText('createRefuge.adminCommentPlaceholder');
      fireEvent.changeText(input, 'Hola món!');

      // onChange s'hauria d'haver cridat
      expect(mockOnChange).toHaveBeenCalledWith('Hola món!');
    });
  });

  describe('Límit de caràcters', () => {
    it('no hauria de permetre més caràcters que maxChars', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="create"
          value=""
          onChange={mockOnChange}
          minChars={0}
          maxChars={10}
        />
      );

      const input = getByPlaceholderText('createRefuge.adminCommentPlaceholder');
      fireEvent.changeText(input, 'Això és massa llarg');

      // No s'hauria de cridar onChange perquè supera el límit
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('hauria de permetre exactament maxChars', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="create"
          value=""
          onChange={mockOnChange}
          minChars={0}
          maxChars={10}
        />
      );

      const input = getByPlaceholderText('createRefuge.adminCommentPlaceholder');
      fireEvent.changeText(input, '1234567890');

      expect(mockOnChange).toHaveBeenCalledWith('1234567890');
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de mostrar missatge d\'error quan hi ha error', () => {
      const { getByText } = render(
        <ProposalCommentInput
          mode="edit"
          value=""
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
          error="Aquest camp és obligatori"
        />
      );

      expect(getByText('Aquest camp és obligatori')).toBeTruthy();
    });

    it('hauria de cridar onClearError quan s\'escriu amb error', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="edit"
          value=""
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
          error="Error"
          onClearError={mockOnClearError}
        />
      );

      const input = getByPlaceholderText('editRefuge.adminCommentPlaceholder');
      fireEvent.changeText(input, 'Text');

      expect(mockOnClearError).toHaveBeenCalled();
    });
  });

  describe('Props adicionals', () => {
    it('hauria d\'utilitzar numberOfLines personalitzat', () => {
      const { getByPlaceholderText } = render(
        <ProposalCommentInput
          mode="create"
          value=""
          onChange={mockOnChange}
          minChars={0}
          maxChars={500}
          numberOfLines={8}
        />
      );

      const input = getByPlaceholderText('createRefuge.adminCommentPlaceholder');
      expect(input.props.numberOfLines).toBe(8);
    });

    it('hauria d\'utilitzar testID personalitzat', () => {
      const { getByTestId } = render(
        <ProposalCommentInput
          mode="create"
          value=""
          onChange={mockOnChange}
          minChars={0}
          maxChars={500}
          testID="custom-input"
        />
      );

      expect(getByTestId('custom-input')).toBeTruthy();
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot per mode create', () => {
      const { toJSON } = render(
        <ProposalCommentInput
          mode="create"
          value=""
          onChange={mockOnChange}
          minChars={0}
          maxChars={500}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot per mode edit amb warning', () => {
      const { toJSON } = render(
        <ProposalCommentInput
          mode="edit"
          value="Curt"
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot per mode delete amb error', () => {
      const { toJSON } = render(
        <ProposalCommentInput
          mode="delete"
          value=""
          onChange={mockOnChange}
          minChars={50}
          maxChars={500}
          error="Camp obligatori"
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
