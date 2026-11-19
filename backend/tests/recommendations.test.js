process.env.OPENWEATHER_API_KEY = 'test-key';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const sample = require('../samples/weather-seoul.json');
const { getOutfitRecommendation } = require('../src/services/outfitRecommendation.cjs');

function mockWeather(t, feelsLike = 10.5) {
  return t.mock.method(global, 'fetch', async url => {
    const body = new URL(url).pathname.startsWith('/geo/')
      ? [{ name: 'Seoul', country: 'KR', lat: 37.56, lon: 126.97 }]
      : { ...sample, main: { ...sample.main, feels_like: feelsLike },
          weather: [{ id: 500, main: 'Rain', description: '?', icon: '10d' }],
          rain: { '1h': 1 }, wind: { speed: 9 } };
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

test('city lookup and sensitivity share weather cache', async t => {
  const mocked = mockWeather(t);
  const first = await request(app).get('/api/recommendations?city=integration-city');
  assert.equal(first.status, 200);
  assert.equal(first.body.weather.feelsLike, 10.5);
  assert.equal(first.body.outfit.top, '맨투맨');
  assert.ok(first.body.extras.includes('우산'));
  assert.ok(first.body.extras.includes('방풍 겉옷'));
  assert.equal(first.body.outfit.imageUrl, null);
  const calls = mocked.mock.callCount();
  const second = await request(app).get('/api/recommendations?city=integration-city&sensitivity=cold');
  assert.equal(second.status, 200);
  assert.equal(second.body.adjustedTemp, 7.5);
  assert.equal(second.body.outfit.top, '니트');
  assert.equal(second.body.cached, true);
  assert.equal(mocked.mock.callCount(), calls);
});

test('coordinates and warm weather without outerwear', async t => {
  mockWeather(t, 28.5);
  const res = await request(app).get('/api/recommendations?lat=36.12&lon=127.34');
  assert.equal(res.status, 200);
  assert.equal(res.body.outfit.outer, null);
});

test('invalid inputs return common errors', async () => {
  for (const [query, code] of [
    ['', 'MISSING_PARAMS'],
    ['?lat=999&lon=0', 'INVALID_COORDS'],
    ['?lat=%20&lon=0', 'INVALID_COORDS'],
    ['?city=', 'INVALID_CITY'],
    ['?city=Seoul&sensitivity=bad', 'INVALID_SENSITIVITY'],
  ]) {
    const res = await request(app).get('/api/recommendations' + query);
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, code);
  }
});

test('missing city and upstream failure', async t => {
  const mocked = t.mock.method(global, 'fetch', async () => new Response('[]', { status: 200 }));
  const missing = await request(app).get('/api/recommendations?city=missing-integration-city');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'CITY_NOT_FOUND');
  mocked.mock.mockImplementation(async () => new Response('{}', { status: 401 }));
  const failed = await request(app).get('/api/recommendations?city=failed-integration-city');
  assert.equal(failed.status, 502);
  assert.equal(failed.body.error.code, 'UPSTREAM_ERROR');
  assert.ok(!JSON.stringify(failed.body).includes('test-key'));
});

test('fractional temperatures match contiguous tiers', () => {
  for (const [temp, top] of [[4.5, '기모 후드티'], [8.5, '니트'], [11.5, '맨투맨'], [16.5, '긴팔 티셔츠'], [19.5, '긴팔 티셔츠'], [22.5, '긴팔 티셔츠'], [27.5, '반팔 티셔츠'], [28, '민소매']]) {
    assert.equal(getOutfitRecommendation({ feelsLike: temp }).recommendations.tops[0], top);
  }
});


test('snow and fractional boundaries use the latest recommendation rules', () => {
  const snow = getOutfitRecommendation({feelsLike: 8.995, isSnowing: true, windSpeed: 8});
  assert.equal(snow.recommendations.tops[0], '니트');
  assert.deepEqual(snow.recommendations.extras.map(extra => extra.item), ['미끄럼 방지 신발', '방풍 겉옷']);
  assert.equal(getOutfitRecommendation({feelsLike: 27.999}).recommendations.tops[0], '반팔 티셔츠');
});
