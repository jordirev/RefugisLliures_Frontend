/**
 * Estat de sessió de la pujada de mitjans (sense dependències natives perquè
 * AuthContext el pugui importar sense carregar el pipeline de compressió).
 *
 * La declaració de drets (RightsDeclarationModal) es demana un cop per sessió;
 * es reinicia al logout i a cada arrencada de l'app.
 */
let rightsConfirmedAt: number | null = null;

export function hasConfirmedRightsThisSession(): boolean {
  return rightsConfirmedAt !== null;
}

export function confirmRightsForSession(): void {
  rightsConfirmedAt = Date.now();
}

export function resetSessionRights(): void {
  rightsConfirmedAt = null;
}
