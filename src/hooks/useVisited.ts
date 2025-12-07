import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function useVisited(refugeId?: string) {
  const { backendUser, addVisitedRefuge, removeVisitedRefuge } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  // Sync optimistic state with backendUser when backendUser changes
  useEffect(() => {
    if (!refugeId) return;
    const backendState = backendUser?.visited_refuges?.includes(refugeId) ?? false;
    setOptimistic(backendState);
  }, [backendUser, refugeId]);

  const isVisited = optimistic ?? (refugeId ? backendUser?.visited_refuges?.includes(refugeId) ?? false : false);
  const toggleVisited = useCallback(async () => {
    if (!refugeId) {
      console.warn('[useVisited] Cannot toggle visited - no refuge ID provided');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);

    console.log('[useVisited] Toggling visited for refuge:', refugeId);
    const currentlyVisited = backendUser?.visited_refuges?.includes(refugeId) ?? false;
    // optimistic flip
    setOptimistic(!currentlyVisited);

    try {
      if (currentlyVisited) {
        console.log('[useVisited] Removing refuge from visited:', refugeId);
        await removeVisitedRefuge(refugeId);
      } else {
        console.log('[useVisited] Adding refuge to visited:', refugeId);
        await addVisitedRefuge(refugeId);
      }
    } catch (err) {
      // revert optimistic on error
      setOptimistic(currentlyVisited);
      console.error('Error toggling visited via hook:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [refugeId, backendUser, addVisitedRefuge, removeVisitedRefuge, isProcessing]);
  return { isVisited, toggleVisited, isProcessing };
}
