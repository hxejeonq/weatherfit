const BASE_URL = 'https://api.openweathermap.org';

function getApiKey() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new Error('OPENWEATHER_API_KEY is not set');
  }
  return key;
}

async function request(path, params) {
  const url = new URL(path, BASE_URL);
  url.search = new URLSearchParams({ ...params, appid: getApiKey() }).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`OpenWeather request failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('OpenWeather request timed out');
      err.status = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// 도시명 -> 좌표
async function geocodeCity(city) {
  const data = await request('/geo/1.0/direct', { q: city, limit: 1 });
  if (!data.length) {
    const err = new Error('City not found');
    err.status = 404;
    throw err;
  }
  const { name, country, lat, lon } = data[0];
  return { name, country, lat, lon };
}

// 좌표 -> 현재 날씨 (섭씨, 한국어)
function fetchWeatherByCoords(lat, lon) {
  return request('/data/2.5/weather', { lat, lon, units: 'metric', lang: 'kr' });
}

module.exports = { geocodeCity, fetchWeatherByCoords };