/**
 * Tests unitaris per al component ProposalCard
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica del component
 * - Format de dates
 * - Badges d'acció i estat
 * - Mode admin amb informació del creador
 * - Callback onPress
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProposalCard } from '../../../components/ProposalCard';
import { RefugeProposal } from '../../../models';

// Mock useUser hook
jest.mock('../../../hooks/useUsersQuery', () => ({
  useUser: (uid: string | undefined) => {
    if (!uid) return { data: null, isLoading: false };
    if (uid === 'creator-uid') {
      return {
        data: {
          uid: 'creator-uid',
          username: 'TestCreator',
          avatar_metadata: { url: 'https://example.com/avatar.jpg' },
        },
        isLoading: false,
      };
    }
    if (uid === 'reviewer-uid') {
      return {
        data: {
          uid: 'reviewer-uid',
          username: 'TestReviewer',
          avatar_metadata: null,
        },
        isLoading: false,
      };
    }
    return { data: null, isLoading: true };
  },
}));

describe('ProposalCard Component', () => {
  const mockProposal: RefugeProposal = {
    id: 'proposal-1',
    refuge_id: 'refuge-1',
    creator_uid: 'creator-uid',
    action: 'create',
    status: 'pending',
    payload: {
      name: 'Nou Refugi de Test',
      latitude: 42.5,
      longitude: 1.5,
    },
    refuge_snapshot: {
      name: 'Refugi Original',
    },
    created_at: '2025-06-15T10:30:00Z',
    updated_at: '2025-06-15T10:30:00Z',
    admin_comment: null,
    reviewer_uid: null,
    reviewed_at: null,
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el nom del refugi des del snapshot', () => {
      const { getByText } = render(
        <ProposalCard proposal={mockProposal} onPress={mockOnPress} />
      );

      expect(getByText('Refugi Original')).toBeTruthy();
    });

    it('hauria de mostrar el nom del payload si no hi ha snapshot', () => {
      const proposalSenseSnapshot: RefugeProposal = {
        ...mockProposal,
        refuge_snapshot: undefined,
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalSenseSnapshot} onPress={mockOnPress} />
      );

      expect(getByText('Nou Refugi de Test')).toBeTruthy();
    });

    it('hauria de mostrar "proposals.card.unknownRefuge" si no hi ha nom', () => {
      const proposalSenseNom: RefugeProposal = {
        ...mockProposal,
        refuge_snapshot: undefined,
        payload: {},
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalSenseNom} onPress={mockOnPress} />
      );

      expect(getByText('proposals.card.unknownRefuge')).toBeTruthy();
    });
  });

  describe('Format de dates', () => {
    it('hauria de formatar correctament la data de creació', () => {
      const { getByText } = render(
        <ProposalCard proposal={mockProposal} onPress={mockOnPress} />
      );

      // La data hauria de ser 15/06/2025 en format català
      expect(getByText('15/06/2025')).toBeTruthy();
    });

    it('hauria de mostrar "-" si no hi ha data', () => {
      const proposalSenseData: RefugeProposal = {
        ...mockProposal,
        created_at: null as any,
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalSenseData} onPress={mockOnPress} />
      );

      expect(getByText('-')).toBeTruthy();
    });
  });

  describe('Badges d\'acció', () => {
    it('hauria de mostrar badge de create per accions de creació', () => {
      const { getByText } = render(
        <ProposalCard proposal={mockProposal} onPress={mockOnPress} />
      );

      expect(getByText('proposals.actions.create')).toBeTruthy();
    });

    it('hauria de mostrar badge de update per accions d\'edició', () => {
      const proposalUpdate: RefugeProposal = {
        ...mockProposal,
        action: 'update',
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalUpdate} onPress={mockOnPress} />
      );

      expect(getByText('proposals.actions.update')).toBeTruthy();
    });

    it('hauria de mostrar badge de delete per accions d\'eliminació', () => {
      const proposalDelete: RefugeProposal = {
        ...mockProposal,
        action: 'delete',
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalDelete} onPress={mockOnPress} />
      );

      expect(getByText('proposals.actions.delete')).toBeTruthy();
    });
  });

  describe('Badges d\'estat', () => {
    it('hauria de mostrar badge pending', () => {
      const { getByText } = render(
        <ProposalCard proposal={mockProposal} onPress={mockOnPress} />
      );

      expect(getByText('proposals.status.pending')).toBeTruthy();
    });

    it('hauria de mostrar badge approved', () => {
      const proposalApproved: RefugeProposal = {
        ...mockProposal,
        status: 'approved',
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalApproved} onPress={mockOnPress} />
      );

      expect(getByText('proposals.status.approved')).toBeTruthy();
    });

    it('hauria de mostrar badge rejected', () => {
      const proposalRejected: RefugeProposal = {
        ...mockProposal,
        status: 'rejected',
      };

      const { getByText } = render(
        <ProposalCard proposal={proposalRejected} onPress={mockOnPress} />
      );

      expect(getByText('proposals.status.rejected')).toBeTruthy();
    });
  });

  describe('Interacció', () => {
    it('hauria de cridar onPress amb la proposta quan es prem', () => {
      const { getByText } = render(
        <ProposalCard proposal={mockProposal} onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Refugi Original'));
      expect(mockOnPress).toHaveBeenCalledWith(mockProposal);
    });
  });

  describe('Mode admin (showCreatorInfo)', () => {
    it('hauria de mostrar informació del creador quan showCreatorInfo és true', async () => {
      const { getByText } = render(
        <ProposalCard 
          proposal={mockProposal} 
          onPress={mockOnPress} 
          showCreatorInfo={true}
        />
      );

      await waitFor(() => {
        expect(getByText('TestCreator')).toBeTruthy();
      });
    });

    it('no hauria de mostrar info del creador quan showCreatorInfo és false', () => {
      const { queryByText } = render(
        <ProposalCard 
          proposal={mockProposal} 
          onPress={mockOnPress} 
          showCreatorInfo={false}
        />
      );

      expect(queryByText('TestCreator')).toBeNull();
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot en mode bàsic', () => {
      const { toJSON } = render(
        <ProposalCard proposal={mockProposal} onPress={mockOnPress} />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb status approved', () => {
      const proposalApproved: RefugeProposal = {
        ...mockProposal,
        status: 'approved',
        action: 'update',
      };

      const { toJSON } = render(
        <ProposalCard proposal={proposalApproved} onPress={mockOnPress} />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
