const { createServer } = require('node:http');

const exampleRecommendation = {
  weather: {
    temperature: 12,
    feelsLike: 10,
    humidity: 65,
    windSpeed: 4,
    condition: 'rain',
  },
  outfit: {
    top: '긴팔 티셔츠',
    bottom: '긴바지',
    outer: '가벼운 재킷',
    imageUrl: '/images/outfits/cool-casual.webp',
    reason: '체감온도가 10℃라 가벼운 겉옷을 추천해요.',
  },
  extras: ['우산'],
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(JSON.stringify(data));
}

const server = createServer((request, response) => {
  const path = request.url.split('?')[0];
  if (path !== '/api/recommendations') {
    sendJson(response, 404, { error: 'NOT_FOUND' });
    return;
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  // 좌표는 실제 날씨 조회를 연결할 때 사용합니다.
  sendJson(response, 200, exampleRecommendation);
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, '127.0.0.1', () => {
  console.log(`WeatherFit mock API: http://127.0.0.1:${server.address().port}/api/recommendations`);
});
