import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { refreshOn401 } from '../src/lib/api/django/refresh-on-401.ts';

// A fake server: `access` is the only token it accepts, and the refresh
// endpoint hands out the next one. Every request is recorded.
const setup = ({ refreshWorks = true } = {}) => {
  const server = { access: 'fresh', calls: [], refreshes: 0 };
  const store = { access: 'expired', refresh: 'r1' };
  const instance = axios.create({ baseURL: 'http://api.test/' });
  instance.interceptors.request.use((config) => {
    if (config.withAuthorization) config.headers.Authorization = `JWT ${store.access}`;
    return config;
  });
  instance.defaults.adapter = async (config) => {
    server.calls.push(`${config.url} ${config.headers.Authorization ?? '-'}`);
    const reply = (status, data) => {
      const response = { data, status, statusText: '', headers: {}, config };
      if (status >= 400) {
        throw new axios.AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response);
      }
      return response;
    };
    if (config.url === '/auth/jwt/refresh/') {
      server.refreshes += 1;
      // Slow enough that concurrent 401s all arrive while it is in flight.
      await new Promise((resolve) => setTimeout(resolve, 20));
      return refreshWorks
        ? reply(200, { access: server.access })
        : reply(401, { code: 'token_not_valid' });
    }
    if (config.headers.Authorization === `JWT ${server.access}`) return reply(200, 'ok');
    return reply(401, { code: 'token_not_valid' });
  };
  const signals = { signedOut: 0 };
  refreshOn401(instance, {
    path: '/auth/jwt/refresh/',
    getRefresh: () => store.refresh,
    getAccess: () => store.access,
    setAccess: (access) => { store.access = access; },
    onRefreshFailed: () => { signals.signedOut += 1; },
  });
  return { instance, server, store, signals };
};

test('an expired access token is refreshed and the request retried', async () => {
  const { instance, store } = setup();
  const response = await instance.post('/presign/', {}, { withAuthorization: true });
  assert.equal(response.data, 'ok');
  assert.equal(store.access, 'fresh');
});

test('several uploads failing together share one refresh', async () => {
  const { instance, server } = setup();
  const results = await Promise.all(
    ['/a/', '/b/', '/c/'].map((url) => instance.post(url, {}, { withAuthorization: true }))
  );
  assert.deepEqual(results.map((r) => r.data), ['ok', 'ok', 'ok']);
  assert.equal(server.refreshes, 1);
});

test('a refresh that fails gives back the original 401, once', async () => {
  const { instance, server } = setup({ refreshWorks: false });
  await assert.rejects(
    instance.post('/presign/', {}, { withAuthorization: true }),
    (error) => error.response?.status === 401 && error.config.url === '/presign/'
  );
  assert.equal(server.refreshes, 1);
  assert.equal(server.calls.filter((c) => c.startsWith('/presign/')).length, 1);
});

test('requests without authorization are never retried', async () => {
  const { instance, server } = setup();
  await assert.rejects(instance.post('/open/', {}), (error) => error.response?.status === 401);
  assert.equal(server.refreshes, 0);
});

test('a retried request that still gets 401 is not retried again', async () => {
  const { instance, server } = setup();
  server.access = 'never-matches';
  // The refresh returns 'never-matches', which the server then "rotates".
  const original = instance.defaults.adapter;
  instance.defaults.adapter = async (config) => {
    if (config.url === '/auth/jwt/refresh/') {
      const r = await original(config);
      server.access = 'moved-on';
      return r;
    }
    return original(config);
  };
  await assert.rejects(
    instance.post('/presign/', {}, { withAuthorization: true }),
    (error) => error.response?.status === 401
  );
  assert.equal(server.refreshes, 1);
  assert.equal(server.calls.filter((c) => c.startsWith('/presign/')).length, 2);
});

test('with no refresh token it gives back the 401 without calling refresh', async () => {
  const { instance, server, store } = setup();
  store.refresh = null;
  await assert.rejects(
    instance.post('/presign/', {}, { withAuthorization: true }),
    (error) => error.response?.status === 401
  );
  assert.equal(server.refreshes, 0);
});

test('a failed refresh signs the user out, once', async () => {
  const { instance, signals } = setup({ refreshWorks: false });
  await Promise.allSettled(
    ['/a/', '/b/'].map((url) => instance.post(url, {}, { withAuthorization: true }))
  );
  assert.equal(signals.signedOut, 1);
});

test('a 401 arriving after the refresh finished retries without refreshing again', async () => {
  const { instance, server, store } = setup();
  // Sent with the old token, answered only after another request refreshed.
  const late = instance.post('/late/', {}, {
    withAuthorization: true,
    adapter: async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 60));
      return instance.defaults.adapter(config);
    },
  });
  await instance.post('/early/', {}, { withAuthorization: true });
  assert.equal(store.access, 'fresh');
  assert.equal((await late).data, 'ok');
  assert.equal(server.refreshes, 1);
});
