/**
 * Links to a JupyterHub that skip its login page when it signs in with Keycloak.
 *
 * `/hub/oauth_login` starts the OAuth flow straight away: users coming from the
 * portal already have a Keycloak session, so Keycloak sends them back signed in
 * without asking anything. Anyone opening the hub URL directly still sees the
 * hub's own "Sign in with SSO" page.
 */
export function hubLink(hubUrl: string, target: string, sso: boolean): string {
  const hub = new URL(hubUrl);
  const destination = new URL(target, hub);
  if (!sso) return destination.href;
  // Only paths of the same hub: never turn this into an open redirect.
  const next = destination.origin === hub.origin ? `${destination.pathname}${destination.search}` : "/hub/";
  return `${hub.origin}/hub/oauth_login?next=${encodeURIComponent(next)}`;
}
