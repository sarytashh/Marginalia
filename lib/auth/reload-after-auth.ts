/**
 * Navigate with a full page load after the session changes (sign-in or
 * sign-out). A client-side router.replace keeps the shared layout, so the
 * header rendered before the change kept showing the old signed-in state
 * until the next reload.
 */
export function reloadAfterAuthChange(path: string): void {
  window.location.replace(path);
}
