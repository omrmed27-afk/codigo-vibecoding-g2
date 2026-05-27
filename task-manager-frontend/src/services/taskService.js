const BASE = 'http://localhost:3000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const taskService = {
  getAll() {
    return fetch(`${BASE}/tasks`, { headers: authHeaders() }).then(handleResponse);
  },
  getById(id) {
    return fetch(`${BASE}/tasks/${id}`, { headers: authHeaders() }).then(handleResponse);
  },
  create(data) {
    return fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },
  update(id, data) {
    return fetch(`${BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },
  delete(id) {
    return fetch(`${BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handleResponse);
  },
};
