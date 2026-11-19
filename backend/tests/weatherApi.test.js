process.env.OPENWEATHER_API_KEY = 'test-key';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const sample = require('../samples/weather-seoul.json');
const app = require('../src/app');

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// OpenWeatherMap 호출을 가짜 응답으로 바꿔요.
function mockUpstream(t, { geo, weather } = {}) {
  return t.mock.method(global, 'fetch', async (url) => {
    const { pathname } = new URL(url);
    if (pathname.startsWith('/geo/')) {
      return geo ?? json([{ name: 'Seoul', country: 'KR', lat: 37.56, lon: 126.97 }]);
    }
    return weather ?? json(sample);
  });
}

test('GET /health', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: 'ok' });
});

test('도시명으로 조회하면 스펙 모양으로 응답한다', async (t) => {
  mockUpstream(t);
  const res = await request(app).get('/api/weather?city=testcity1');
  assert.strictEqual(res.status, 200);
  for (const key of ['location', 'current', 'precipitation', 'wind', 'observedAt', 'cached']) {
    assert.ok(key in res.body, `${key} 필드가 없습니다`);
  }
  assert.strictEqual(res.body.cached, false);
});

test('같은 도시를 다시 조회하면 캐시를 쓰고 외부 호출을 하지 않는다', async (t) => {
  const mocked = mockUpstream(t);
  await request(app).get('/api/weather?city=testcity2');
  const callsAfterFirst = mocked.mock.callCount();
  const res = await request(app).get('/api/weather?city=TestCity2'); // 대소문자가 달라도 같은 키
  assert.strictEqual(res.body.cached, true);
  assert.strictEqual(mocked.mock.callCount(), callsAfterFirst);
});

test('좌표로 조회할 수 있다', async (t) => {
  mockUpstream(t);
  const res = await request(app).get('/api/weather?lat=35.18&lon=129.07');
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.current);
});

test('파라미터가 없으면 400 MISSING_PARAMS', async () => {
  const res = await request(app).get('/api/weather');
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'MISSING_PARAMS');
});

test('범위를 벗어난 좌표는 400 INVALID_COORDS', async () => {
  const res = await request(app).get('/api/weather?lat=999&lon=0');
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'INVALID_COORDS');
});

test('빈 city는 400 INVALID_CITY', async () => {
  const res = await request(app).get('/api/weather?city=');
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'INVALID_CITY');
});

test('없는 도시는 404 CITY_NOT_FOUND', async (t) => {
  mockUpstream(t, { geo: json([]) });
  const res = await request(app).get('/api/weather?city=nocity');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'CITY_NOT_FOUND');
});

test('외부 API가 실패하면 502이고 API 키가 응답에 새지 않는다', async (t) => {
  mockUpstream(t, { geo: json({ cod: 401 }, 401) });
  const res = await request(app).get('/api/weather?city=failcity');
  assert.strictEqual(res.status, 502);
  assert.strictEqual(res.body.error.code, 'UPSTREAM_ERROR');
  assert.ok(!JSON.stringify(res.body).includes('test-key'));
});

test('없는 경로는 404 NOT_FOUND (JSON)', async () => {
  const res = await request(app).get('/없는주소');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'NOT_FOUND');
});