import { test as base, expect } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000/api';
const E2E_USERNAME = process.env.E2E_USERNAME ?? 'testuser';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123';

type ApiHelper = {
  /** POST to /api/{endpoint}/ and return the created record's id. */
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<string | number>;
  /** DELETE /api/{endpoint}/{id}/  */
  remove: (endpoint: string, id: string | number) => Promise<void>;
};

export const test = base.extend<{ api: ApiHelper }>({
  api: async ({ request }, use) => {
    const loginRes = await request.post(`${API_BASE}/auth/login/`, {
      data: { username: E2E_USERNAME, password: E2E_PASSWORD },
    });
    if (!loginRes.ok()) {
      throw new Error(`api fixture: login failed (${loginRes.status()}): ${await loginRes.text()}`);
    }
    const { access } = await loginRes.json();
    const headers = { Authorization: `Bearer ${access}` };

    await use({
      async seed(endpoint, payload) {
        const res = await request.post(`${API_BASE}/${endpoint}/`, { data: payload, headers });
        if (!res.ok()) {
          throw new Error(`seed(${endpoint}) failed (${res.status()}): ${await res.text()}`);
        }
        const data = await res.json();
        return data.id;
      },

      async remove(endpoint, id) {
        const res = await request.delete(`${API_BASE}/${endpoint}/${id}/`, { headers });
        if (!res.ok() && res.status() !== 404) {
          throw new Error(`remove(${endpoint}/${id}) failed (${res.status()})`);
        }
      },
    });
  },
});

export { expect };
