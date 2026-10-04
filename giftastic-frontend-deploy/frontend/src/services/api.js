import axios from 'axios';
import { clearAuthSession, getStoredToken, isJwtExpired } from './authStorage';

const normalizeApiBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');
const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080/api/v1';
const DEFAULT_PROD_API_BASE_URL = '/api/v1';
const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const isLocalhostApi = (value) => {
  try {
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};
const API_BASE_URL = import.meta.env.PROD && (!configuredApiBaseUrl || isLocalhostApi(configuredApiBaseUrl))
  ? DEFAULT_PROD_API_BASE_URL
  : configuredApiBaseUrl || DEFAULT_DEV_API_BASE_URL;

export const AUTH_SESSION_NOTICE_KEY = 'giftastic_auth_notice';
export const AUTH_SESSION_CLEARED_EVENT = 'giftastic:auth-session-cleared';

const DEFAULT_ERROR_MESSAGE = 'We could not complete that action. Please try again.';
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again to continue.';
const NETWORK_ERROR_MESSAGE = 'We could not reach the server. Please check your connection and try again.';
const SERVER_ERROR_MESSAGE = 'The server could not complete the request right now. Please try again in a moment.';
const LOGIN_ERROR_MESSAGE = 'Email or password is incorrect. Please try again.';

const TECHNICAL_MESSAGE_PATTERNS = [
  /internal server error/i,
  /exception/i,
  /stack trace/i,
  /nullpointer/i,
  /sql/i,
  /jdbc/i,
  /hibernate/i,
  /org\.springframework/i,
  /java\./i,
  /trace/i,
];

const isAuthRequest = (config = {}) => {
  const url = String(config.url || '');
  return url.includes('/auth/login') || url.includes('/auth/register');
};

const extractBackendMessage = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  return data.userMessage || data.message || data.error || data.detail || '';
};

const isTechnicalMessage = (message = '') =>
  TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));

export function getFriendlyErrorMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  const status = error?.response?.status;
  const backendMessage = String(error?.userMessage || extractBackendMessage(error?.response?.data) || '').trim();
  const localMessage = String(error?.message || '').trim();

  if (!status) {
    if (error?.request || error?.isAxiosError) return NETWORK_ERROR_MESSAGE;
    return localMessage && !isTechnicalMessage(localMessage) ? localMessage : fallback;
  }
  if (status === 401) return isAuthRequest(error?.config) ? LOGIN_ERROR_MESSAGE : SESSION_EXPIRED_MESSAGE;
  if (status === 403) {
    if (/banned|suspended/i.test(backendMessage)) {
      return 'Your account is suspended. Please contact support for help.';
    }
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) return backendMessage && !isTechnicalMessage(backendMessage)
    ? backendMessage
    : 'We could not find the requested information.';
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  if (backendMessage && !isTechnicalMessage(backendMessage)) return backendMessage;
  return fallback;
}

function applyFriendlyError(error) {
  const userMessage = getFriendlyErrorMessage(error);
  error.userMessage = userMessage;
  if (error.response) {
    if (error.response.data && typeof error.response.data === 'object') {
      error.response.data.userMessage = userMessage;
      error.response.data.message = userMessage;
    } else {
      error.response.data = { message: userMessage, userMessage };
    }
  }
  return error;
}

function clearExpiredSession(message = SESSION_EXPIRED_MESSAGE) {
  clearAuthSession();
  localStorage.setItem(AUTH_SESSION_NOTICE_KEY, message);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CLEARED_EVENT, { detail: { message } }));
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      if (isJwtExpired(token)) {
        clearExpiredSession();
        delete config.headers.Authorization;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const rawMessage = extractBackendMessage(error.response?.data);
    const hadToken = Boolean(error.config?.headers?.Authorization || getStoredToken());
    applyFriendlyError(error);

    if (error.response?.status === 401 && hadToken && !isAuthRequest(error.config)) {
      clearExpiredSession(error.userMessage);
      if (!window.location.pathname.includes('/login')) {
        window.location.assign('/login');
      }
    }
    // Handle banned users (403 with specific message)
    if (error.response?.status === 403 && 
        (rawMessage === 'Account suspended' || /banned|suspended/i.test(rawMessage))) {
      // Only redirect if not already on banned page to prevent loop
      if (!window.location.pathname.includes('/banned')) {
        window.location.href = '/banned';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
