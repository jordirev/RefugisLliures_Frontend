/**
 * Tests unitaris per al component UserMessage
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica
 * - Avatar amb imatge i placeholder
 * - Format de dates
 * - Truncament de missatges
 * - Botó "llegir més/menys"
 * - Botons d'acció (respondre, eliminar)
 * - Mode resposta (isAnswer)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserMessage } from '../../../components/UserMessage';
import { User } from '../../../models';

// Mock useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    backendUser: {
      uid: 'current-user-uid',
      username: 'CurrentUser',
    },
  }),
}));

describe('UserMessage Component', () => {
  const mockUser: User = {
    uid: 'user-123',
    username: 'TestUser',
    email: 'test@example.com',
    avatar_metadata: { url: 'https://example.com/avatar.jpg' },
  };

  const mockOnReply = jest.fn();
  const mockOnDelete = jest.fn();
  const shortMessage = 'Missatge curt de prova';
  const longMessage = 'A'.repeat(200); // Més de 150 caràcters

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el nom d\'usuari', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText('TestUser')).toBeTruthy();
    });

    it('hauria de renderitzar el missatge', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText(shortMessage)).toBeTruthy();
    });

    it('hauria de mostrar "common.unknown" quan no hi ha usuari', () => {
      const { getByText } = render(
        <UserMessage
          user={null}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText('common.unknown')).toBeTruthy();
    });
  });

  describe('Avatar', () => {
    it('hauria de renderitzar correctament amb avatar', () => {
      const { toJSON } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar placeholder amb inicial quan no hi ha avatar', () => {
      const userSenseAvatar: User = {
        ...mockUser,
        avatar_metadata: undefined,
      };

      const { getByText } = render(
        <UserMessage
          user={userSenseAvatar}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText('T')).toBeTruthy(); // Inicial de 'TestUser'
    });

    it('hauria de mostrar "?" quan no hi ha username', () => {
      const userSenseUsername: User = {
        ...mockUser,
        username: undefined as any,
        avatar_metadata: undefined,
      };

      const { getByText } = render(
        <UserMessage
          user={userSenseUsername}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText('?')).toBeTruthy();
    });
  });

  describe('Format de dates', () => {
    it('hauria de formatar la data correctament', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText('15-06-2025')).toBeTruthy();
    });
  });

  describe('Truncament de missatges', () => {
    it('no hauria de truncar missatges curts', () => {
      const { getByText, queryByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText(shortMessage)).toBeTruthy();
      expect(queryByText('common.readMore')).toBeNull();
    });

    it('hauria de truncar missatges llargs', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={longMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      // El missatge hauria d'estar truncat a 150 caràcters + "..."
      expect(getByText('A'.repeat(150) + '...')).toBeTruthy();
      expect(getByText('common.readMore')).toBeTruthy();
    });

    it('hauria de expandir el missatge quan es prem "llegir més"', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={longMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      fireEvent.press(getByText('common.readMore'));
      
      expect(getByText(longMessage)).toBeTruthy();
      expect(getByText('common.readLess')).toBeTruthy();
    });

    it('hauria de col·lapsar el missatge quan es prem "llegir menys"', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={longMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      // Expandim
      fireEvent.press(getByText('common.readMore'));
      // Col·lapsem
      fireEvent.press(getByText('common.readLess'));
      
      expect(getByText('A'.repeat(150) + '...')).toBeTruthy();
    });
  });

  describe('Botons d\'acció', () => {
    it('hauria de mostrar el botó de respondre', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(getByText('doubts.reply')).toBeTruthy();
    });

    it('hauria de cridar onReply quan es prem respondre', () => {
      const { getByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      fireEvent.press(getByText('doubts.reply'));
      expect(mockOnReply).toHaveBeenCalled();
    });

    it('hauria de mostrar el botó d\'eliminar quan l\'usuari és el creador', () => {
      const currentUserMessage: User = {
        ...mockUser,
        uid: 'current-user-uid',
      };

      const { getByText } = render(
        <UserMessage
          user={currentUserMessage}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
          onDelete={mockOnDelete}
        />
      );

      expect(getByText('common.delete')).toBeTruthy();
    });

    it('no hauria de mostrar el botó d\'eliminar quan l\'usuari no és el creador', () => {
      const { queryByText } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
          onDelete={mockOnDelete}
        />
      );

      expect(queryByText('common.delete')).toBeNull();
    });

    it('hauria de cridar onDelete quan es prem eliminar', () => {
      const currentUserMessage: User = {
        ...mockUser,
        uid: 'current-user-uid',
      };

      const { getByText } = render(
        <UserMessage
          user={currentUserMessage}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.press(getByText('common.delete'));
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  describe('Mode resposta', () => {
    it('hauria d\'aplicar estils de resposta quan isAnswer és true', () => {
      const { toJSON } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          isAnswer={true}
          onReply={mockOnReply}
        />
      );

      // El snapshot hauria de tenir marginLeft per les respostes
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Snapshots', () => {
    it('hauria de coincidir amb el snapshot bàsic', () => {
      const { toJSON } = render(
        <UserMessage
          user={mockUser}
          message={shortMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb missatge llarg', () => {
      const { toJSON } = render(
        <UserMessage
          user={mockUser}
          message={longMessage}
          createdAt="2025-06-15T10:30:00Z"
          onReply={mockOnReply}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
