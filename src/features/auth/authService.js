const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const parseJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return null;
  }
};

const handleResponse = async (response) => {
  const payload = await parseJson(response);
  if (!response.ok) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }
  return payload;
};

export const signup = (body) =>
  fetch(buildUrl('/api/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(handleResponse);

export const login = (body) =>
  fetch(buildUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(handleResponse);

export const adminLogin = (body) =>
  fetch(buildUrl('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(handleResponse);

const authHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const getProfile = (token) =>
  fetch(buildUrl('/api/users/me'), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const getRecommendations = (token) =>
  fetch(buildUrl('/api/users/recommendations'), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const getPublicProfileById = (token, userId) =>
  fetch(buildUrl(`/api/users/${userId}/public`), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const updateProfile = (token, profile) =>
  fetch(buildUrl('/api/users/me'), {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ profile })
  }).then(handleResponse);

export const deleteAccount = (token) =>
  fetch(buildUrl('/api/users/me'), {
    method: 'DELETE',
    headers: authHeaders(token)
  }).then(handleResponse);

export const getAdminUsers = (token) =>
  fetch(buildUrl('/api/users/admin/users'), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const createAdminUser = (token, body) =>
  fetch(buildUrl('/api/users/admin/users'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body)
  }).then(handleResponse);

export const deleteAdminUser = (token, userId) =>
  fetch(buildUrl(`/api/users/admin/users/${userId}`), {
    method: 'DELETE',
    headers: authHeaders(token)
  }).then(handleResponse);

export const getConversation = (token, partnerId) =>
  fetch(buildUrl(`/api/messages/${partnerId}`), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const sendDirectMessage = (token, recipientId, content) =>
  fetch(buildUrl(`/api/messages/${recipientId}`), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content })
  }).then(handleResponse);

export const listConversations = (token) =>
  fetch(buildUrl('/api/messages/conversations'), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const markConversationRead = (token, partnerId) =>
  fetch(buildUrl(`/api/messages/${partnerId}/read`), {
    method: 'PATCH',
    headers: authHeaders(token)
  }).then(handleResponse);

// Support
export const submitSupportRequest = (body, token) =>
  fetch(buildUrl('/api/support'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body)
  }).then(handleResponse);

export const getSupportRequests = (token, status) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetch(buildUrl(`/api/support${query}`), {
    headers: authHeaders(token)
  }).then(handleResponse);
};

export const updateSupportStatus = (token, id, status) =>
  fetch(buildUrl(`/api/support/${id}/status`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status })
  }).then(handleResponse);

// Institutional Domains
export const getDomains = (token) =>
  fetch(buildUrl('/api/domains'), {
    headers: authHeaders(token)
  }).then(handleResponse);

export const addDomain = (token, body) =>
  fetch(buildUrl('/api/domains'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body)
  }).then(handleResponse);

export const setDomainStatus = (token, id, status) =>
  fetch(buildUrl(`/api/domains/${id}/status`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status })
  }).then(handleResponse);

export const makePrimaryDomain = (token, id) =>
  fetch(buildUrl(`/api/domains/${id}/primary`), {
    method: 'PATCH',
    headers: authHeaders(token)
  }).then(handleResponse);

export const deleteDomain = (token, id) =>
  fetch(buildUrl(`/api/domains/${id}`), {
    method: 'DELETE',
    headers: authHeaders(token)
  }).then(handleResponse);
