import { getAuth } from 'firebase/auth';

/**
 * Verifica si l'usuari autenticat té rol d'administrador
 * @returns Promise<boolean> - true si l'usuari és admin, false en cas contrari
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }

    const tokenResult = await user.getIdTokenResult();
    const role = tokenResult.claims.role as string | undefined;
    
    return role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Obté el rol de l'usuari autenticat
 * @returns Promise<string | null> - El rol de l'usuari o null si no existeix
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }

    const tokenResult = await user.getIdTokenResult();
    return (tokenResult.claims.role as string) || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
