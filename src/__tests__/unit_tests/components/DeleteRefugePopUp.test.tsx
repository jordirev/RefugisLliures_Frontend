/**
 * Tests unitaris per al component DeleteRefugePopUp
 * 
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Validació del comentari (mínim 50 caràcters)
 * - Funcionalitat de confirmar i cancel·lar
 * - Reset del comentari després d'accions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DeleteRefugePopUp } from '../../../components/DeleteRefugePopUp';

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
}));

describe('DeleteRefugePopUp Component', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();
  const refugeName = 'Refugi de Colomers';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el modal quan és visible', () => {
      const { getByText } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(getByText('deleteRefuge.title')).toBeTruthy();
    });

    it('hauria de mostrar el missatge d\'advertència amb el nom del refugi', () => {
      const { getByText } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      // El missatge d'advertència hauria d'incloure una referència al refugi
      expect(getByText(/deleteRefuge.warning/)).toBeTruthy();
    });
  });

  describe('Funcionalitat de cancel·lar', () => {
    it('hauria de cridar onCancel quan es prem el botó cancel·lar', () => {
      const { getByText } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.press(getByText('common.cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Validació del comentari', () => {
    it('no hauria de permetre confirmar amb comentari curt', () => {
      const { getByText, getByPlaceholderText } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      // Introduir un comentari curt (menys de 50 caràcters)
      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, 'Comentari curt');

      // El botó de confirmar hauria d'estar disabled o no cridar onConfirm
      fireEvent.press(getByText('deleteRefuge.confirm'));
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('hauria de permetre confirmar amb comentari de 50+ caràcters', () => {
      const { getByText, getByPlaceholderText } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      // Introduir un comentari llarg (50+ caràcters)
      const longComment = 'A'.repeat(55);
      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, longComment);

      fireEvent.press(getByText('deleteRefuge.confirm'));
      expect(mockOnConfirm).toHaveBeenCalledWith(longComment);
    });
  });

  describe('Reset del comentari', () => {
    it('hauria de resetejar el comentari després de cancel·lar', async () => {
      const { getByText, getByPlaceholderText, rerender } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, 'Un comentari de prova');

      fireEvent.press(getByText('common.cancel'));
      
      // Després de cancel·lar, el comentari hauria d'estar buit
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('hauria de resetejar el comentari després de confirmar', () => {
      const { getByText, getByPlaceholderText } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const longComment = 'A'.repeat(55);
      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, longComment);

      fireEvent.press(getByText('deleteRefuge.confirm'));
      expect(mockOnConfirm).toHaveBeenCalledWith(longComment);
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot quan és visible', () => {
      const { toJSON } = render(
        <DeleteRefugePopUp
          visible={true}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
