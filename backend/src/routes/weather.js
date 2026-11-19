const express = require('express');
const { getWeather } = require('../services/weatherService');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await getWeather(req.query));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
