import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAddFavouriteRefuge, useRemoveFavouriteRefuge } from './useUsersQuery';

export default function useFavourite(refugeId?: string) {
  const { firebaseUser, favouriteRefugeIds, setFavouriteRefugeIds } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addFavouriteMutation = useAddFavouriteRefuge();
  const removeFavouriteMutation = useRemoveFavouriteRefuge();

  // Local optimistic state
  const [optimisticFavourite, setOptimisticFavourite] = useState<boolean | null>(null);

  // Use optimistic state if available, otherwise use context state
  const isFavourite = optimisticFavourite ?? (refugeId ? favouriteRefugeIds.includes(refugeId) : false);
  
  const toggleFavourite = useCallback(async () => {
    if (!refugeId) {
      console.warn('[useFavourite] Cannot toggle favourite - no refuge ID provided');
      return;
    }
    if (isProcessing) return;
    if (!firebaseUser?.uid) return;
    
    setIsProcessing(true);

    console.log('[useFavourite] Toggling favourite for refuge:', refugeId);
    const currentlyFavourite = favouriteRefugeIds.includes(refugeId);
    
    // Optimistic UI update
    setOptimisticFavourite(!currentlyFavourite);

    try {
      if (currentlyFavourite) {
        console.log('[useFavourite] Removing refuge from favourites:', refugeId);
        await removeFavouriteMutation.mutateAsync({ uid: firebaseUser.uid, refugeId });
        
        // Update context
        setFavouriteRefugeIds(favouriteRefugeIds.filter(id => id !== refugeId));
      } else {
        console.log('[useFavourite] Adding refuge to favourites:', refugeId);
        await addFavouriteMutation.mutateAsync({ uid: firebaseUser.uid, refugeId });
        
        // Update context (avoid duplicates)
        if (!favouriteRefugeIds.includes(refugeId)) {
          setFavouriteRefugeIds([...favouriteRefugeIds, refugeId]);
        }
      }
      
      // Clear optimistic state after successful mutation
      setOptimisticFavourite(null);
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticFavourite(null);
      console.error('Error toggling favourite via hook:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [refugeId, favouriteRefugeIds, firebaseUser, addFavouriteMutation, removeFavouriteMutation, isProcessing, setFavouriteRefugeIds]);
  
  return { isFavourite, toggleFavourite, isProcessing };
}
