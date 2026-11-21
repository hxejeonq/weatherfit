import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/weather/SearchBar.jsx'
import WeatherCard from '../components/weather/WeatherCard.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import useWeather from '../hooks/useWeather.js'

export default function WeatherPage() {
  const navigate = useNavigate()
  const { data, location, query, loading, error, searchByCity, searchByCoords } =
    useWeather()

  const isCurrentLocation = query?.type === 'coords'
  const fallbackName = isCurrentLocation ? '현재 위치' : query?.city

  const goOutfit = () => {
    navigate('/outfit', { state: { weather: data } })
  }

  return (
    <main className="page weather-page">
      <h1 className="page__title">오늘 날씨</h1>
      <SearchBar
        onSearchCity={searchByCity}
        onSearchLocation={searchByCoords}
        disabled={loading}
      />

      {loading && <LoadingSpinner message="날씨 정보를 불러오는 중..." />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && data && (
        <>
          {isCurrentLocation && (
            <span className="result-label">현재 위치</span>
          )}
          <WeatherCard
            weather={data}
            location={location}
            fallbackName={fallbackName}
          />
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={goOutfit}
          >
            코디 추천 보기
          </button>
        </>
      )}
    </main>
  )
}
