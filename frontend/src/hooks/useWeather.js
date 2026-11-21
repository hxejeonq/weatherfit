import { useCallback, useState } from 'react'

// ─────────────────────────────────────────────────────────────
// TODO(서버 연동): 백엔드 API가 준비되면 이 영역만 수정하면 됩니다.
//   1. API_BASE_URL 을 실제 서버 주소(예: import.meta.env.VITE_API_URL)로 변경
//   2. fetchWeatherByCity / fetchWeatherByCoords 의 목업 반환을 아래 주석의 fetch 코드로 교체
//   3. 응답 형식: { weather: { temperature, feelsLike, humidity, windSpeed, condition }, location? }
//      - location 은 선택값. 문자열("서울") 또는 { name: "Seoul", ... } 객체 모두 지원
//      - location 이 없으면 화면에 검색한 도시명 / "현재 위치"가 대신 표시됨
// ─────────────────────────────────────────────────────────────
export const API_BASE_URL = '' // TODO: 실제 서버 주소

const MOCK_RESPONSE = {
  weather: {
    temperature: 12,
    feelsLike: 10,
    humidity: 65,
    windSpeed: 4,
    condition: 'rain',
  },
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWeatherByCity(city) {
  // TODO:
  // const res = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(city)}`)
  // if (!res.ok) throw new Error('날씨 정보를 불러오지 못했어요.')
  // return res.json()
  await delay(500)
  if (city.toLowerCase() === 'error') {
    // 목업 단계 오류 화면 확인용: "error" 로 검색하면 실패 처리
    throw new Error(`"${city}"의 날씨 정보를 찾을 수 없어요.`)
  }
  return MOCK_RESPONSE
}

// eslint-disable-next-line no-unused-vars
async function fetchWeatherByCoords(lat, lon) {
  // TODO:
  // const res = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`)
  // if (!res.ok) throw new Error('날씨 정보를 불러오지 못했어요.')
  // return res.json()
  await delay(500)
  return MOCK_RESPONSE
}
// ───────────────────────── TODO 영역 끝 ─────────────────────────

export default function useWeather() {
  const [data, setData] = useState(null)
  const [location, setLocation] = useState(null) // 서버가 준 지역 정보 (없으면 null)
  const [query, setQuery] = useState(null) // 결과를 만든 검색 방식: { type: 'city', city } | { type: 'coords' }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async (fetcher, nextQuery) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result.weather)
      setLocation(result.location ?? null)
      setQuery(nextQuery)
    } catch (err) {
      setData(null)
      setLocation(null)
      setQuery(null)
      setError(err?.message || '날씨 정보를 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [])

  const searchByCity = useCallback(
    (city) => run(() => fetchWeatherByCity(city), { type: 'city', city }),
    [run],
  )

  const searchByCoords = useCallback(
    (lat, lon) => run(() => fetchWeatherByCoords(lat, lon), { type: 'coords' }),
    [run],
  )

  return { data, location, query, loading, error, searchByCity, searchByCoords }
}
