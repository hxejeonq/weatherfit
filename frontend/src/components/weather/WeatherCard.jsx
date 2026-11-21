const CONDITION_MAP = {
  clear: { label: '맑음', icon: '☀️' },
  sunny: { label: '맑음', icon: '☀️' },
  clouds: { label: '흐림', icon: '☁️' },
  cloudy: { label: '흐림', icon: '☁️' },
  rain: { label: '비', icon: '🌧️' },
  drizzle: { label: '이슬비', icon: '🌦️' },
  thunderstorm: { label: '뇌우', icon: '⛈️' },
  snow: { label: '눈', icon: '❄️' },
  mist: { label: '안개', icon: '🌫️' },
  fog: { label: '안개', icon: '🌫️' },
}

// location: 문자열 또는 { name } 객체 (서버 응답). 없으면 fallbackName 사용
function getLocationName(location, fallbackName) {
  if (typeof location === 'string' && location.trim()) return location
  if (location?.name) return location.name
  return fallbackName
}

export default function WeatherCard({ weather, location, fallbackName }) {
  if (!weather) return null
  const locationName = getLocationName(location, fallbackName)
  const { temperature, feelsLike, humidity, windSpeed, condition } = weather
  const info = CONDITION_MAP[condition?.toLowerCase()] ?? {
    label: condition ?? '알 수 없음',
    icon: '🌡️',
  }

  return (
    <section className="weather-card" aria-label="현재 날씨">
      {locationName && (
        <p className="weather-card__location">📍 {locationName}</p>
      )}
      <div className="weather-card__main">
        <span className="weather-card__icon" aria-hidden="true">
          {info.icon}
        </span>
        <div>
          <p className="weather-card__temp">{temperature}°C</p>
          <p className="weather-card__condition">{info.label}</p>
        </div>
      </div>
      <dl className="weather-card__details">
        <div>
          <dt>체감온도</dt>
          <dd>{feelsLike}°C</dd>
        </div>
        <div>
          <dt>습도</dt>
          <dd>{humidity}%</dd>
        </div>
        <div>
          <dt>풍속</dt>
          <dd>{windSpeed} m/s</dd>
        </div>
      </dl>
    </section>
  )
}
