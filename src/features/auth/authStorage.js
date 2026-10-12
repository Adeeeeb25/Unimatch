const AUTH_TOKEN_KEY = 'unimatch-token';
const AUTH_EVENT = 'unimatch-auth-change';

const isBrowser = typeof window !== 'undefined';

const emitAuthChange = () => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const getAuthToken = () => (isBrowser ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null);

export const setAuthToken = (token) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  emitAuthChange();
};

export const clearAuthToken = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  emitAuthChange();
};

export const isAuthenticated = () => Boolean(getAuthToken());

export { AUTH_EVENT, AUTH_TOKEN_KEY };
