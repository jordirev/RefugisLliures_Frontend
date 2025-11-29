import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function useFavourite(refugeId?: string) {
  const { backendUser, addFavouriteRefuge, removeFavouriteRefuge } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  // Sync optimistic state with backendUser when backendUser changes
  useEffect(() => {
    if (refugeId == null) return;
    const backendState = backendUser?.favourite_refuges?.includes(String(refugeId)) ?? false;
    setOptimistic(backendState);
  }, [backendUser, refugeId]);

  const isFavourite = optimistic ?? (backendUser?.favourite_refuges?.includes(String(refugeId)) ?? false);

  const toggleFavourite = useCallback(async () => {
    if (refugeId == null) return;
    if (isProcessing) return;
    setIsProcessing(true);

    const currentlyFav = backendUser?.favourite_refuges?.includes(String(refugeId)) ?? false;
    // optimistic flip
    setOptimistic(!currentlyFav);

    try {
      if (currentlyFav) {
        await removeFavouriteRefuge(refugeId);
      } else {
        await addFavouriteRefuge(refugeId);
      }
    } catch (err) {
      // revert optimistic on error
      setOptimistic(currentlyFav);
      console.error('Error toggling favourite via hook:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [refugeId, backendUser, addFavouriteRefuge, removeFavouriteRefuge, isProcessing]);

  return { isFavourite, toggleFavourite, isProcessing };
}
