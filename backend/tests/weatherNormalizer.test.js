const test = require('node:test');
const assert = require('node:assert');
const sample = require('../samples/weather-seoul.json');
const { normalizeWeather } = require('../src/services/weatherNormalizer');

test('샘플 응답을 합의한 스펙 모양으로 변환한다', () => {
  const r = normalizeWeather(sample);
  assert.strictEqual(r.location.name, 'Seoul');
  assert.strictEqual(r.current.humidity, 53);
  assert.strictEqual(r.current.condition, 'Clouds');
  assert.strictEqual(r.cached, false);
  assert.ok(r.observedAt.endsWith('+09:00'));
});

test('rain, snow 필드가 없으면 0과 false로 채운다', () => {
  const r = normalizeWeather(sample);
  assert.strictEqual(r.precipitation.rain1h, 0);
  assert.strictEqual(r.precipitation.snow1h, 0);
  assert.strictEqual(r.precipitation.isRaining, false);
  assert.strictEqual(r.precipitation.isSnowing, false);
});

test('비가 오면 isRaining이 true가 된다', () => {
  const raw = { ...sample, weather: [{ main: 'Rain', description: '비', icon: '10d' }], rain: { '1h': 2.5 } };
  const r = normalizeWeather(raw);
  assert.strictEqual(r.precipitation.isRaining, true);
  assert.strictEqual(r.precipitation.rain1h, 2.5);
});

test('풍속이 10m/s 이상이면 isStrong이 true가 된다', () => {
  const raw = { ...sample, wind: { speed: 11, gust: 14 } };
  assert.strictEqual(normalizeWeather(raw).wind.isStrong, true);
  assert.strictEqual(normalizeWeather(sample).wind.isStrong, false);
});