# Backend - 날씨 API

OpenWeatherMap에서 현재 날씨를 가져와 통일된 JSON 형식으로 돌려주는 API 서버입니다.

## 실행 방법

1. Node.js 18 이상을 설치합니다.
2. 의존성을 설치합니다.
   ```bash
   cd backend
   npm install
   ```
3. `.env.example`을 복사해 `.env`를 만들고 본인의 OpenWeatherMap API 키를 넣습니다.
   ```bash
   cp .env.example .env
   ```
   Windows PowerShell에서는 `Copy-Item .env.example .env`를 사용합니다.
4. 서버를 실행합니다.
   ```bash
   npm start
   ```
5. 브라우저에서 `http://localhost:3000/api/weather?city=Seoul`을 열어 확인합니다.

`.env`는 API 키가 들어 있으므로 깃에 올리지 않습니다.

## 환경 변수

| 이름 | 설명 | 기본값 |
|---|---|---|
| `OPENWEATHER_API_KEY` | OpenWeatherMap API 키 (필수) | 없음 |
| `PORT` | 서버 포트 | 3000 |
| `CACHE_TTL_SECONDS` | 날씨 캐시 유지 시간(초) | 600 |

## API 명세

### GET /api/weather

도시명 또는 좌표 중 하나로 조회합니다.

| 파라미터 | 설명 |
|---|---|
| `city` | 도시명 (1~100자, 한글/영문 가능). 예: `Seoul`, `서울` |
| `lat`, `lon` | 위도(-90~90), 경도(-180~180) |

`city`가 있으면 `city`를 우선 사용합니다.

#### 성공 응답 (200)

```json
{
  "location": { "name": "Seoul", "country": "KR", "lat": 37.5666791, "lon": 126.9782914 },
  "current": {
    "temp": 11.7,
    "feelsLike": 10.5,
    "humidity": 57,
    "condition": "Clear",
    "description": "맑음",
    "icon": "01d"
  },
  "precipitation": { "isRaining": false, "isSnowing": false, "rain1h": 0, "snow1h": 0 },
  "wind": { "speed": 2.93, "gust": 2.87, "isStrong": false },
  "observedAt": "2026-11-09T16:29:42+09:00",
  "cached": false
}
```

| 필드 | 설명 |
|---|---|
| `current.temp`, `current.feelsLike` | 기온, 체감온도 (섭씨) |
| `current.condition` | 날씨 상태 (Clear, Clouds, Rain, Snow 등) |
| `precipitation.rain1h`, `snow1h` | 최근 1시간 강수/적설량(mm). 없으면 0 |
| `wind.speed`, `wind.gust` | 풍속, 돌풍 (m/s) |
| `wind.isStrong` | 풍속 또는 돌풍이 10m/s 이상이면 true |
| `observedAt` | 날씨 측정 시각 (ISO 8601, 현지 시간대) |
| `cached` | 캐시에서 가져온 응답이면 true |

#### 에러 응답

모든 에러는 같은 형식입니다.

```json
{ "error": { "code": "INVALID_COORDS", "message": "lat은 -90~90, lon은 -180~180 범위의 숫자여야 합니다." } }
```

| 상태 | code | 설명 |
|---|---|---|
| 400 | `MISSING_PARAMS` | city 또는 lat, lon이 없음 |
| 400 | `INVALID_CITY` | city가 비었거나 100자 초과 |
| 400 | `INVALID_COORDS` | 좌표가 숫자가 아니거나 범위를 벗어남 |
| 404 | `CITY_NOT_FOUND` | 해당 지역을 찾을 수 없음 |
| 404 | `NOT_FOUND` | 존재하지 않는 경로 |
| 502 | `UPSTREAM_ERROR` | 외부 날씨 API 호출 실패 |
| 503 | `RATE_LIMITED` | 외부 API 호출 한도 초과 |
| 504 | `UPSTREAM_TIMEOUT` | 외부 날씨 API 응답 지연 |

### GET /health

서버 상태 확인용입니다. `{ "status": "ok" }`를 돌려줍니다.

## 캐싱

- 같은 도시(대소문자 구분 없음)나 같은 좌표(소수점 둘째 자리까지)는 기본 10분간 캐시를 재사용합니다.
- 캐시는 서버 메모리에 저장되므로 서버를 다시 켜면 비워집니다.

## 테스트

```bash
npm test
```

외부 API 호출은 가짜 응답으로 대체되므로 API 키 없이도 실행됩니다.

## 폴더 구조

```
backend/
├─ src/
│  ├─ app.js                      # 서버 설정, 라우트 연결
│  ├─ routes/weather.js           # GET /api/weather
│  ├─ services/
│  │  ├─ openWeatherClient.js     # OpenWeatherMap 호출
│  │  ├─ weatherNormalizer.js     # 응답을 통일된 형식으로 변환
│  │  └─ cache.js                 # 메모리 캐시
│  └─ middlewares/errorHandler.js # 에러 응답 통일
├─ tests/                         # 단위, 통합 테스트
├─ samples/weather-seoul.json     # 테스트용 응답 샘플
└─ .env.example                   # 환경 변수 견본
```
