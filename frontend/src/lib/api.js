// Small fetch wrapper: JSON in/out, HTTP Basic auth header, unified error handling.
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

let authToken = null;
let onUnauthorized = () => {};

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

/** Builds the `Authorization: Basic ...` value (UTF-8 safe). */
export function makeBasic(email, password) {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `Basic ${btoa(binary)}`;
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = body?.fieldErrors || {};
  }
}

function buildUrl(path, params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, value);
  });
  const qs = query.toString();
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}

async function request(method, path, { body, params, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const sentAuth = auth && authToken;
  if (sentAuth) headers.Authorization = authToken;

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: 'Cannot reach the server. Check your connection and try again.' });
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // A 401 on a request that carried credentials means the session is no longer valid.
    if (response.status === 401 && sentAuth) onUnauthorized();
    throw new ApiError(response.status, data);
  }
  return data;
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  put: (path, opts) => request('PUT', path, opts),
  del: (path, opts) => request('DELETE', path, opts),
};
