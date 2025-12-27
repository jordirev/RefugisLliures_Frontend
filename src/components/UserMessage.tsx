import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { User } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';

interface UserMessageProps {
  user: User | null;
  message: string;
  createdAt: string;
  isAnswer?: boolean;
  onReply: () => void;
  onDelete?: () => void;
}

export function UserMessage({
  user,
  message,
  createdAt,
  isAnswer = false,
  onReply,
  onDelete,
}: UserMessageProps) {
  const { t } = useTranslation();
  const { backendUser: currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const shouldTruncate = message.length > 150;
  const displayMessage = shouldTruncate && !isExpanded ? `${message.substring(0, 150)}...` : message;
  const isCreator = currentUser?.uid === user?.uid;

  return (
    <View style={[styles.container, isAnswer && styles.answerContainer]}>
      {/* Top row: avatar, name, date */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {user?.avatar_metadata?.url ? (
            <Image source={{ uri: user.avatar_metadata.url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {user?.username || t('common.unknown')}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
        </View>
      </View>

      {/* Message content */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{displayMessage}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        {shouldTruncate && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              {isExpanded ? t('common.readLess') : t('common.readMore')}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onReply} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{t('doubts.reply')}</Text>
        </TouchableOpacity>
        {isCreator && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  answerContainer: {
    marginLeft: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  dateContainer: {
    marginLeft: 'auto',
    paddingLeft: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  messageContainer: {
    paddingLeft: 44,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingLeft: 44,
    gap: 16,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
});
