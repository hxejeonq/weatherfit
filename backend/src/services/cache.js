const NodeCache = require('node-cache');

// 기본 10분. .env의 CACHE_TTL_SECONDS로 바꿀 수 있어요.
const TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 600;

// maxKeys: 임의의 도시명이 계속 들어와도 메모리가 무한정 늘지 않게 막아요.
const cache = new NodeCache({ stdTTL: TTL_SECONDS, checkperiod: 120, maxKeys: 500 });

function getCache(key) {
  return cache.get(key);
}

function setCache(key, value) {
  try {
    cache.set(key, value);
  } catch (e) {
    // 캐시가 가득 차도 요청 자체는 정상 처리해요.
  }
}

module.exports = { getCache, setCache };