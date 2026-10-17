import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { clearStoredAuth, getStoredAuth, saveStoredAuth } from './sessionStore';
import type { AuthSession } from './types';

/**
 * An error from the backend. `code` is the machine-readable code from the ProblemDetails
 * body (e.g. "invalid_credentials", "email_not_confirmed"), "network" when the server
 * couldn't be reached, or "validation" for 400s with field errors.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Listener = () => void;
let sessionExpiredListener: Listener | null = null;

/** Called when the session can't be refreshed any more and the user must log in again. */
export function onSessionExpired(listener: Listener) {
  sessionExpiredListener = listener;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Multipart upload (e.g. a photo). Sent instead of a JSON body. */
  form?: FormData;
  /** Longer than the default for slow calls (e.g. reading a PDF statement). */
  timeoutMs?: number;
  /** Send the stored access token, refreshing it first if it is about to expire. */
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!options.auth) {
    return send<T>(path, options, null);
  }

  let session = await getValidSession();
  try {
    return await send<T>(path, options, session.accessToken);
  } catch (error) {
    // The token can be revoked before it expires (e.g. password changed elsewhere): refresh once.
    if (error instanceof ApiError && error.status === 401) {
      session = await refreshSession(session);
      return send<T>(path, options, session.accessToken);
    }
    throw error;
  }
}

async function send<T>(path: string, options: RequestOptions, accessToken: string | null): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(0, 'network', 'The app has no server address configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        // FormData sets its own multipart Content-Type (with the boundary).
        ...(options.body !== undefined && !options.form ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'network', "Can't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;
  if (!response.ok) {
    throw toApiError(response.status, data);
  }
  return data as T;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toApiError(status: number, body: any): ApiError {
  // ASP.NET validation errors: { errors: { Field: ["message", ...] } }
  if (status === 400 && body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors as Record<string, string[]>)[0]?.[0];
    return new ApiError(status, body.code ?? 'validation', first ?? 'Please check the details you entered.');
  }
  if (status === 429) {
    return new ApiError(status, body?.code ?? 'rate_limited', 'Too many attempts. Please wait a minute and try again.');
  }
  return new ApiError(status, body?.code ?? null, body?.detail ?? body?.title ?? 'Something went wrong. Please try again.');
}

/** A current access token (refreshed first if about to expire), e.g. for the /api/sync socket. */
export async function getAccessToken(): Promise<string> {
  return (await getValidSession()).accessToken;
}

// ── Session refresh ────────────────────────────────────────────────────────

const REFRESH_MARGIN_SECONDS = 60;
let refreshing: Promise<AuthSession> | null = null;

async function getValidSession(): Promise<AuthSession> {
  const stored = getStoredAuth();
  if (!stored) {
    throw new ApiError(401, 'not_signed_in', 'Please log in again.');
  }
  const now = Date.now() / 1000;
  return stored.session.expiresAt - REFRESH_MARGIN_SECONDS > now
    ? stored.session
    : refreshSession(stored.session);
}

/** Exchanges the refresh token for a new session. Concurrent callers share one request. */
function refreshSession(session: AuthSession): Promise<AuthSession> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const next = await send<AuthSession>(
          '/api/auth/refresh',
          { method: 'POST', body: { refreshToken: session.refreshToken } },
          null,
        );
        await saveStoredAuth({ session: next, profile: getStoredAuth()?.profile ?? null });
        return next;
      } catch (error) {
        // Refresh token revoked or expired: the user has to log in again. Network errors keep
        // the session so the app can retry once it is back online.
        if (error instanceof ApiError && error.status === 401) {
          await clearStoredAuth();
          sessionExpiredListener?.();
        }
        throw error;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}
