import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAddVisitedRefuge, useRemoveVisitedRefuge } from './useUsersQuery';

export default function useVisited(refugeId?: string) {
  const { firebaseUser, visitedRefugeIds, setVisitedRefugeIds } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addVisitedMutation = useAddVisitedRefuge();
  const removeVisitedMutation = useRemoveVisitedRefuge();

  // Local optimistic state
  const [optimisticVisited, setOptimisticVisited] = useState<boolean | null>(null);

  // Use optimistic state if available, otherwise use context state
  const isVisited = optimisticVisited ?? (refugeId ? visitedRefugeIds.includes(refugeId) : false);
  
  const toggleVisited = useCallback(async () => {
    if (!refugeId) {
      console.warn('[useVisited] Cannot toggle visited - no refuge ID provided');
      return;
    }
    if (isProcessing) return;
    if (!firebaseUser?.uid) return;
    
    setIsProcessing(true);

    console.log('[useVisited] Toggling visited for refuge:', refugeId);
    const currentlyVisited = visitedRefugeIds.includes(refugeId);
    
    // Optimistic UI update
    setOptimisticVisited(!currentlyVisited);

    try {
      if (currentlyVisited) {
        console.log('[useVisited] Removing refuge from visited:', refugeId);
        await removeVisitedMutation.mutateAsync({ uid: firebaseUser.uid, refugeId });
        
        // Update context
        setVisitedRefugeIds(visitedRefugeIds.filter(id => id !== refugeId));
      } else {
        console.log('[useVisited] Adding refuge to visited:', refugeId);
        await addVisitedMutation.mutateAsync({ uid: firebaseUser.uid, refugeId });
        
        // Update context (avoid duplicates)
        if (!visitedRefugeIds.includes(refugeId)) {
          setVisitedRefugeIds([...visitedRefugeIds, refugeId]);
        }
      }
      
      // Clear optimistic state after successful mutation
      setOptimisticVisited(null);
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticVisited(null);
      console.error('Error toggling visited via hook:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [refugeId, visitedRefugeIds, firebaseUser, addVisitedMutation, removeVisitedMutation, isProcessing, setVisitedRefugeIds]);
  
  return { isVisited, toggleVisited, isProcessing };
}
