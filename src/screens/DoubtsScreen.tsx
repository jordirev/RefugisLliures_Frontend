import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { UserMessage } from '../components/UserMessage';
import {
  useDoubts,
  useCreateDoubt,
  useCreateAnswer,
  useCreateAnswerReply,
  useDeleteDoubt,
  useDeleteAnswer,
} from '../hooks/useDoubtsQuery';
import { useUser } from '../hooks/useUsersQuery';
import { Doubt, Answer } from '../models';

// Icons
import BackIcon from '../assets/icons/arrow-left.svg';
import SendIcon from '../assets/icons/navigation.svg';

type DoubtsScreenParams = {
  refugeId: string;
  refugeName: string;
};

// Component to render individual answer (avoids hook issues in loops)
const AnswerItem: React.FC<{
  doubtId: string;
  answer: Answer;
  onReply: (doubtId: string, answerId: string, userName?: string) => void;
  onDelete: (doubtId: string, answerId: string) => void;
}> = ({ doubtId, answer, onReply, onDelete }) => {
  const { data: user } = useUser(answer.creator_uid);

  return (
    <UserMessage
      user={user || null}
      message={answer.message}
      createdAt={answer.created_at}
      isAnswer={true}
      onReply={() => onReply(doubtId, answer.id, user?.username)}
      onDelete={() => onDelete(doubtId, answer.id)}
    />
  );
};

// Component to render individual doubt (avoids hook issues in loops)
const DoubtItem: React.FC<{
  doubt: Doubt;
  onReply: (doubtId: string, answerId?: string, userName?: string) => void;
  onDeleteDoubt: (doubtId: string) => void;
  onDeleteAnswer: (doubtId: string, answerId: string) => void;
}> = ({ doubt, onReply, onDeleteDoubt, onDeleteAnswer }) => {
  const { data: user } = useUser(doubt.creator_uid);

  return (
    <View style={styles.doubtContainer}>
      <UserMessage
        user={user || null}
        message={doubt.message}
        createdAt={doubt.created_at}
        isAnswer={false}
        onReply={() => onReply(doubt.id, undefined, user?.username)}
        onDelete={() => onDeleteDoubt(doubt.id)}
      />

      {/* Render answers */}
      {doubt.answers && doubt.answers.length > 0 && (
        <View style={styles.answersContainer}>
          {doubt.answers.map((answer) => (
            <AnswerItem
              key={answer.id}
              doubtId={doubt.id}
              answer={answer}
              onReply={onReply}
              onDelete={onDeleteAnswer}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export function DoubtsScreen({ refugeId: refugeIdProp, refugeName: refugeNameProp, onClose }: { refugeId?: string; refugeName?: string; onClose?: () => void } = {}) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  // Try to get route params, but don't fail if not in a navigator
  let routeParams: DoubtsScreenParams | undefined;
  try {
    const route = useRoute<RouteProp<{ params: DoubtsScreenParams }, 'params'>>();
    routeParams = route.params;
  } catch (e) {
    // Component not inside navigator, use props instead
  }
  
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const refugeId = refugeIdProp || routeParams?.refugeId;
  const refugeName = refugeNameProp || routeParams?.refugeName;

  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    type: 'doubt' | 'answer';
    doubtId: string;
    answerId?: string;
    userName?: string;
  } | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputContainerHeight, setInputContainerHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const HEADER_HEIGHT = 96;

  // Hooks
  const { data: doubts, isLoading } = useDoubts(refugeId);
  const createDoubtMutation = useCreateDoubt();
  const createAnswerMutation = useCreateAnswer();
  const createAnswerReplyMutation = useCreateAnswerReply();
  const deleteDoubtMutation = useDeleteDoubt();
  const deleteAnswerMutation = useDeleteAnswer();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  const handleReply = (doubtId: string, answerId?: string, userName?: string) => {
    setReplyingTo({
      type: answerId ? 'answer' : 'doubt',
      doubtId,
      answerId,
      userName,
    });
    setTimeout(() => {
      inputRef.current?.blur();
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 200);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Check character limit
    if (message.trim().length > 500) {
      showAlert(t('common.error'), t('doubts.errors.messageTooLong', { max: 500 }));
      return;
    }

    if (replyingTo) {
      // Create answer or reply
      if (replyingTo.answerId) {
        // Reply to an answer
        createAnswerReplyMutation.mutate(
          {
            doubtId: replyingTo.doubtId,
            parentAnswerId: replyingTo.answerId,
            refugeId,
            request: { message: message.trim() },
          },
          {
            onSuccess: () => {
              setMessage('');
              setReplyingTo(null);
              Keyboard.dismiss();
            },
            onError: (error: any) => {
              showAlert(t('common.error'), error.message || t('doubts.errors.createAnswerError'));
            },
          }
        );
      } else {
        // Reply to a doubt
        createAnswerMutation.mutate(
          {
            doubtId: replyingTo.doubtId,
            refugeId,
            request: { message: message.trim() },
          },
          {
            onSuccess: () => {
              setMessage('');
              setReplyingTo(null);
              Keyboard.dismiss();
            },
            onError: (error: any) => {
              showAlert(t('common.error'), error.message || t('doubts.errors.createAnswerError'));
            },
          }
        );
      }
    } else {
      // Create doubt
      createDoubtMutation.mutate(
        {
          refuge_id: refugeId,
          message: message.trim(),
        },
        {
          onSuccess: () => {
            setMessage('');
            Keyboard.dismiss();
          },
          onError: (error: any) => {
            showAlert(t('common.error'), error.message || t('doubts.errors.createDoubtError'));
          },
        }
      );
    }
  };

  const handleDeleteDoubt = (doubtId: string) => {
    showAlert(
      t('doubts.deleteDoubt.title'),
      t('doubts.deleteDoubt.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: hideAlert,
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            hideAlert();
            deleteDoubtMutation.mutate(
              { doubtId, refugeId },
              {
                onSuccess: () => {
                  showAlert(t('common.success'), t('doubts.deleteDoubt.success'));
                },
                onError: (error: any) => {
                  showAlert(t('common.error'), error.message || t('doubts.errors.deleteDoubtError'));
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleDeleteAnswer = (doubtId: string, answerId: string) => {
    showAlert(
      t('doubts.deleteAnswer.title'),
      t('doubts.deleteAnswer.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: hideAlert,
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            hideAlert();
            deleteAnswerMutation.mutate(
              { doubtId, answerId, refugeId },
              {
                onSuccess: () => {
                  showAlert(t('common.success'), t('doubts.deleteAnswer.success'));
                },
                onError: (error: any) => {
                  showAlert(t('common.error'), error.message || t('doubts.errors.deleteAnswerError'));
                },
              }
            );
          },
        },
      ]
    );
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <BackIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('doubts.title')}</Text>
            <Text style={styles.headerSubtitle}>{refugeName}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6900" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: HEADER_HEIGHT+40,
                paddingBottom: keyboardHeight > 0 ? inputContainerHeight + keyboardHeight + 40 : inputContainerHeight + 40
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Doubts list */}
            {doubts && doubts.length > 0 ? (
              doubts.map((doubt) => (
                <DoubtItem
                  key={doubt.id}
                  doubt={doubt}
                  onReply={handleReply}
                  onDeleteDoubt={handleDeleteDoubt}
                  onDeleteAnswer={handleDeleteAnswer}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('doubts.noDoubts')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom, bottom: keyboardHeight + 8 }]} onLayout={(event) => setInputContainerHeight(event.nativeEvent.layout.height)}>
        {replyingTo && (
          <View style={styles.replyingContainer}>
            <Text style={styles.replyingText}>
              {t('doubts.replyingTo', { name: replyingTo.userName || t('common.unknown') })}
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Text style={styles.cancelReplyText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyingTo ? t('doubts.answerPlaceholder') : t('doubts.doubtPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || createDoubtMutation.isPending || createAnswerMutation.isPending || createAnswerReplyMutation.isPending}
          >
            {createDoubtMutation.isPending || createAnswerMutation.isPending || createAnswerReplyMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SendIcon width={20} height={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CustomAlert */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerFixed: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  doubtContainer: {
    marginBottom: 24,
  },
  answersContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  replyingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  cancelReplyText: {
    fontSize: 13,
    color: '#FF6900',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'justify',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
