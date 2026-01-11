/**
 * Tests unitaris per al component RejectProposalPopUp
 * 
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Validació del motiu (mínim 50 caràcters)
 * - Funcionalitat de confirmar i cancel·lar
 * - Reset del motiu després d'accions
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RejectProposalPopUp } from '../../../components/RejectProposalPopUp';

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
}));

describe('RejectProposalPopUp Component', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();
  const proposalId = 'proposal-123';
  const refugeName = 'Refugi de Colomers';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el modal quan és visible', () => {
      const { getByText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(getByText('proposals.rejectModal.title')).toBeTruthy();
    });

    it('hauria de mostrar el missatge d\'advertència', () => {
      const { getByText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(getByText(/proposals.rejectModal.warning/)).toBeTruthy();
    });
  });

  describe('Funcionalitat de cancel·lar', () => {
    it('hauria de cridar onCancel quan es prem el botó cancel·lar', () => {
      const { getByText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.press(getByText('common.cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Validació del motiu', () => {
    it('no hauria de permetre confirmar amb motiu curt', () => {
      const { getByText, getByPlaceholderText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, 'Motiu curt');

      fireEvent.press(getByText('proposals.rejectModal.confirm'));
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('hauria de permetre confirmar amb motiu de 50+ caràcters', () => {
      const { getByText, getByPlaceholderText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const longReason = 'R'.repeat(55);
      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, longReason);

      fireEvent.press(getByText('proposals.rejectModal.confirm'));
      expect(mockOnConfirm).toHaveBeenCalledWith(longReason);
    });
  });

  describe('Reset del motiu', () => {
    it('hauria de resetejar el motiu després de cancel·lar', () => {
      const { getByText, getByPlaceholderText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, 'Un motiu de prova');

      fireEvent.press(getByText('common.cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('hauria de resetejar el motiu després de confirmar', () => {
      const { getByText, getByPlaceholderText } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const longReason = 'R'.repeat(55);
      const input = getByPlaceholderText('deleteRefuge.commentPlaceholder');
      fireEvent.changeText(input, longReason);

      fireEvent.press(getByText('proposals.rejectModal.confirm'));
      expect(mockOnConfirm).toHaveBeenCalledWith(longReason);
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot quan és visible', () => {
      const { toJSON } = render(
        <RejectProposalPopUp
          visible={true}
          proposalId={proposalId}
          refugeName={refugeName}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
