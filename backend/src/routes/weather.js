const express = require('express');
const { geocodeCity, fetchWeatherByCoords } = require('../services/openWeatherClient');
const { normalizeWeather } = require('../services/weatherNormalizer');

const router = express.Router();

const MAX_CITY_LENGTH = 100;

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

router.get('/', async (req, res) => {
  const { city, lat, lon } = req.query;

  try {
    // 1) 도시명으로 조회
    if (city !== undefined) {
      if (typeof city !== 'string' || city.trim() === '' || city.length > MAX_CITY_LENGTH) {
        return sendError(res, 400, 'INVALID_CITY', `city는 1~${MAX_CITY_LENGTH}자 문자열이어야 합니다.`);
      }
      const location = await geocodeCity(city.trim());
      const raw = await fetchWeatherByCoords(location.lat, location.lon);
      return res.json(normalizeWeather(raw, location));
    }

    // 2) 좌표로 조회
    if (lat !== undefined || lon !== undefined) {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      const valid =
        lat !== undefined && lon !== undefined &&
        lat !== '' && lon !== '' &&
        Number.isFinite(latNum) && Number.isFinite(lonNum) &&
        latNum >= -90 && latNum <= 90 &&
        lonNum >= -180 && lonNum <= 180;
      if (!valid) {
        return sendError(res, 400, 'INVALID_COORDS', 'lat은 -90~90, lon은 -180~180 범위의 숫자여야 합니다.');
      }
      const raw = await fetchWeatherByCoords(latNum, lonNum);
      return res.json(normalizeWeather(raw));
    }

    // 3) 둘 다 없음
    return sendError(res, 400, 'MISSING_PARAMS', 'city 또는 lat, lon 파라미터가 필요합니다.');
  } catch (err) {
    if (err.status === 404) {
      return sendError(res, 404, 'CITY_NOT_FOUND', '해당 지역을 찾을 수 없습니다.');
    }
    if (err.status === 504) {
      return sendError(res, 504, 'UPSTREAM_TIMEOUT', '날씨 서버 응답이 지연되고 있습니다.');
    }
    console.error('weather route error:', err.message);
    return sendError(res, 502, 'UPSTREAM_ERROR', '날씨 정보를 가져오지 못했습니다.');
  }
});

module.exports = router;