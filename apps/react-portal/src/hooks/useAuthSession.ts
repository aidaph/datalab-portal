import { useCallback, useEffect, useMemo, useState } from "react";
import { DatalabApiClient } from "@datalab/api-client";
import type { UserInfo } from "@datalab/shared";
import { config } from "../lib/config";

const STORAGE_KEYS = { token: "token", username: "username", avatar: "avatarUrl" } as const;

export interface AuthSession {
  token: string;
  user: UserInfo | null;
  /** Display name: known immediately after login, before /users/me resolves. */
  username: string;
  avatarUrl: string;
  isAuthenticated: boolean;
  isResolving: boolean;
  client: DatalabApiClient;
  loginWithGithub: () => void;
  loginWithSSO: () => void;
  logout: () => void;
}

/** Seconds since epoch at which a JWT expires, or null if unreadable. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const exp = tokenExpiry(token);
  return exp !== null && exp * 1000 <= Date.now();
}

function storedToken(): string {
  const token = localStorage.getItem(STORAGE_KEYS.token) ?? "";
  return token && !isExpired(token) ? token : "";
}

/**
 * Reads the login result the API hands back after the GitHub/Keycloak redirect.
 * The API sends it in the URL fragment (#token=...) so it never reaches server
 * logs; the query string (?token=...) is still accepted for older API versions.
 */
function consumeLoginRedirect(): URLSearchParams | null {
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const fromQuery = new URLSearchParams(window.location.search);
  const params = fromHash.has("token") ? fromHash : fromQuery.has("token") ? fromQuery : null;
  if (params) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return params;
}

export function useAuthSession(): AuthSession {
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEYS.username) ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.avatar) ?? "");
  const [isResolving, setIsResolving] = useState(false);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    setUsername("");
    setAvatarUrl("");
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }, []);

  const client = useMemo(
    () =>
      new DatalabApiClient({
        baseUrl: config.apiBaseUrl,
        token: token || undefined,
        onUnauthorized: logout
      }),
    [token, logout]
  );

  // Capture the OAuth redirect once, on mount.
  useEffect(() => {
    const params = consumeLoginRedirect();
    if (!params) return;

    const nextToken = params.get("token") ?? "";
    const nextUser = params.get("user") ?? "";
    const nextAvatar = params.get("avatar") ?? "";

    setToken(nextToken);
    setUsername(nextUser);
    setAvatarUrl(nextAvatar);
    localStorage.setItem(STORAGE_KEYS.token, nextToken);
    localStorage.setItem(STORAGE_KEYS.username, nextUser);
    if (nextAvatar) localStorage.setItem(STORAGE_KEYS.avatar, nextAvatar);
    else localStorage.removeItem(STORAGE_KEYS.avatar);
  }, []);

  // Resolve the full identity (sub, email, is_admin) whenever the token changes.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setIsResolving(true);

    client
      .getMe(controller.signal)
      .then((me) => {
        setUser(me);
        const display = me.name || me.login;
        setUsername(display);
        localStorage.setItem(STORAGE_KEYS.username, display);
      })
      .catch((error: unknown) => {
        // 401 already triggered logout via onUnauthorized.
        if (!controller.signal.aborted) console.error("Could not load the user:", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsResolving(false);
      });

    return () => controller.abort();
  }, [client, token]);

  // Log out automatically when the token expires while the tab is open.
  useEffect(() => {
    const exp = token ? tokenExpiry(token) : null;
    if (exp === null) return;
    const timer = window.setTimeout(logout, Math.max(0, exp * 1000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [token, logout]);

  const loginWithGithub = useCallback(() => {
    window.location.href = client.url("/auth/github/login");
  }, [client]);

  const loginWithSSO = useCallback(() => {
    window.location.href = client.url("/auth/keycloak/login");
  }, [client]);

  return {
    token,
    user,
    username,
    avatarUrl,
    isAuthenticated: !!token,
    isResolving,
    client,
    loginWithGithub,
    loginWithSSO,
    logout
  };
}
