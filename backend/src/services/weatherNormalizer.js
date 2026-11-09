const STRONG_WIND_THRESHOLD = 10; // m/s, 팀과 합의하면 여기서만 바꾸면 돼요

const round1 = (n) => Math.round(n * 10) / 10;

// unix 초 + 지역 시간대 오프셋 -> "2026-11-09T15:22:00+09:00" 형태
function toIsoWithOffset(unixSec, offsetSec) {
  const local = new Date((unixSec + offsetSec) * 1000);
  const base = local.toISOString().slice(0, 19);
  const sign = offsetSec >= 0 ? '+' : '-';
  const abs = Math.abs(offsetSec);
  const hh = String(Math.floor(abs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  return `${base}${sign}${hh}:${mm}`;
}

// raw: OpenWeather 원본 응답, location: 도시 검색 시 geocode 결과(선택)
function normalizeWeather(raw, location) {
  const w = raw.weather?.[0] ?? {};
  const wind = raw.wind ?? {};
  const rain1h = raw.rain?.['1h'] ?? 0;
  const snow1h = raw.snow?.['1h'] ?? 0;
  const speed = wind.speed ?? 0;
  const gust = wind.gust ?? speed;

  return {
    location: location ?? {
      name: raw.name,
      country: raw.sys?.country,
      lat: raw.coord?.lat,
      lon: raw.coord?.lon,
    },
    current: {
      temp: round1(raw.main.temp),
      feelsLike: round1(raw.main.feels_like),
      humidity: raw.main.humidity,
      condition: w.main ?? 'Unknown',
      description: w.description ?? '',
      icon: w.icon ?? '',
    },
    precipitation: {
      isRaining: ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main) || rain1h > 0,
      isSnowing: w.main === 'Snow' || snow1h > 0,
      rain1h,
      snow1h,
    },
    wind: {
      speed,
      gust,
      isStrong: Math.max(speed, gust) >= STRONG_WIND_THRESHOLD,
    },
    observedAt: toIsoWithOffset(raw.dt, raw.timezone ?? 0),
    cached: false,
  };
}

module.exports = { normalizeWeather, STRONG_WIND_THRESHOLD };