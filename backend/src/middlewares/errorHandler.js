class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: '존재하지 않는 경로입니다.' } });
}

// 에러를 { error: { code, message } } 형식으로 통일해요.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 502;
  let code = 'UPSTREAM_ERROR';
  let message = '날씨 정보를 가져오지 못했습니다.';

  if (err instanceof AppError) {
    ({ status, code, message } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = '요청 본문이 올바른 JSON이 아닙니다.';
  } else if (err.status === 404) {
    status = 404; code = 'CITY_NOT_FOUND'; message = '해당 지역을 찾을 수 없습니다.';
  } else if (err.status === 504) {
    status = 504; code = 'UPSTREAM_TIMEOUT'; message = '날씨 서버 응답이 지연되고 있습니다.';
  } else if (err.status === 429) {
    status = 503; code = 'RATE_LIMITED'; message = '요청이 많아 잠시 후 다시 시도해 주세요.';
  }

  // 상세 원인은 서버 로그에만 남기고, API 키가 든 URL은 찍지 않아요.
  console.error(`[${code}]`, err.message);
  res.status(status).json({ error: { code, message } });
}

module.exports = { AppError, notFoundHandler, errorHandler };