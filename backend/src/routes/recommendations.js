const express = require('express');
const { getWeather } = require('../services/weatherService');
const { getOutfitRecommendation } = require('../services/outfitRecommendation.cjs');
const { AppError } = require('../middlewares/errorHandler');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const sensitivity = req.query.sensitivity ?? 'normal';
    if (!['cold', 'normal', 'hot'].includes(sensitivity)) {
      throw new AppError(400, 'INVALID_SENSITIVITY', 'sensitivity는 cold, normal, hot 중 하나여야 합니다.');
    }
    const data = await getWeather(req.query);
    const recommendation = getOutfitRecommendation({
      feelsLike: data.current.feelsLike,
      sensitivity,
      isRaining: data.precipitation.isRaining,
      isSnowing: data.precipitation.isSnowing,
      windSpeed: data.wind.speed,
    });
    res.json({
      weather: {
        temperature: data.current.temp,
        feelsLike: data.current.feelsLike,
        humidity: data.current.humidity,
        windSpeed: data.wind.speed,
        condition: data.current.condition.toLowerCase(),
      },
      outfit: {
        top: recommendation.recommendations.tops[0],
        bottom: recommendation.recommendations.bottoms[0],
        outer: recommendation.recommendations.outters[0] ?? null,
        imageUrl: null,
        reason: recommendation.description,
      },
      extras: recommendation.recommendations.extras.map(extra => extra.item),
      location: data.location,
      observedAt: data.observedAt,
      cached: data.cached,
      sensitivity,
      adjustedTemp: recommendation.adjustedTemp,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
