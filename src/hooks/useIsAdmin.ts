import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isUserAdmin } from '../utils/authUtils';

/**
 * Indica si l'usuari actual és admin (claim `role` del token de Firebase).
 * Només afecta la UI (p. ex. mostrar el botó d'esborrar): l'autorització és del backend.
 */
export function useIsAdmin(): boolean {
  const { firebaseUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!firebaseUser) {
      setIsAdmin(false);
      return undefined;
    }
    isUserAdmin()
      .then((admin) => {
        if (!cancelled) setIsAdmin(admin);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  return isAdmin;
}
