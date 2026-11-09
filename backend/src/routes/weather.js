const express = require('express');
const { geocodeCity, fetchWeatherByCoords } = require('../services/openWeatherClient');
const { normalizeWeather } = require('../services/weatherNormalizer');
const { getCache, setCache } = require('../services/cache');
const { AppError } = require('../middlewares/errorHandler');

const router = express.Router();
const MAX_CITY_LENGTH = 100;

router.get('/', async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;

    // 1) 도시명으로 조회
    if (city !== undefined) {
      if (typeof city !== 'string' || city.trim() === '' || city.length > MAX_CITY_LENGTH) {
        throw new AppError(400, 'INVALID_CITY', `city는 1~${MAX_CITY_LENGTH}자 문자열이어야 합니다.`);
      }
      const key = `city:${city.trim().toLowerCase()}`;
      const hit = getCache(key);
      if (hit) return res.json({ ...hit, cached: true });

      const location = await geocodeCity(city.trim());
      const raw = await fetchWeatherByCoords(location.lat, location.lon);
      const result = normalizeWeather(raw, location);
      setCache(key, result);
      return res.json(result);
    }

    // 2) 좌표로 조회
    if (lat !== undefined || lon !== undefined) {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      const valid =
        typeof lat === 'string' && typeof lon === 'string' &&
        lat !== '' && lon !== '' &&
        Number.isFinite(latNum) && Number.isFinite(lonNum) &&
        latNum >= -90 && latNum <= 90 &&
        lonNum >= -180 && lonNum <= 180;
      if (!valid) {
        throw new AppError(400, 'INVALID_COORDS', 'lat은 -90~90, lon은 -180~180 범위의 숫자여야 합니다.');
      }
      // 소수점 둘째 자리(약 1km)로 맞춰서, 가까운 위치끼리 캐시를 같이 써요.
      const rLat = Number(latNum.toFixed(2));
      const rLon = Number(lonNum.toFixed(2));
      const key = `coord:${rLat},${rLon}`;
      const hit = getCache(key);
      if (hit) return res.json({ ...hit, cached: true });

      const raw = await fetchWeatherByCoords(rLat, rLon);
      const result = normalizeWeather(raw);
      setCache(key, result);
      return res.json(result);
    }

    // 3) 둘 다 없음
    throw new AppError(400, 'MISSING_PARAMS', 'city 또는 lat, lon 파라미터가 필요합니다.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;