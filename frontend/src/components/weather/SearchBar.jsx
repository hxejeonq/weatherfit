import { useState } from 'react'

export default function SearchBar({ onSearchCity, onSearchLocation, disabled }) {
  const [city, setCity] = useState('')
  const [notice, setNotice] = useState('')
  const [locating, setLocating] = useState(false)

  // form submit → 엔터 키 또는 검색 버튼 클릭 시에만 호출 (입력 중에는 호출 X)
  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = city.trim()
    if (!trimmed) {
      setNotice('도시 이름을 입력해 주세요.')
      return
    }
    setNotice('')
    onSearchCity(trimmed)
  }

  const handleLocation = () => {
    setNotice('')
    if (!('geolocation' in navigator)) {
      setNotice('이 브라우저는 위치 기능을 지원하지 않아요. 도시명으로 검색해 주세요.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setCity('') // 내 위치로 조회할 때는 입력창 비우기
        onSearchLocation(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setNotice(
            '위치 권한이 거부되었어요. 브라우저 설정에서 위치 권한을 허용하거나 도시명으로 검색해 주세요.',
          )
        } else {
          setNotice('현재 위치를 가져오지 못했어요. 도시명으로 검색해 주세요.')
        }
      },
      { timeout: 10000 },
    )
  }

  const isBusy = disabled || locating

  return (
    <div className="search-bar">
      <form className="search-bar__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-bar__input"
          placeholder="도시 이름 (예: 서울)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="도시 이름"
          disabled={isBusy}
        />
        <button type="submit" className="btn btn--primary" disabled={isBusy}>
          검색
        </button>
      </form>
      <button
        type="button"
        className="btn btn--secondary search-bar__location"
        onClick={handleLocation}
        disabled={isBusy}
      >
        {locating ? '위치 확인 중...' : '📍 내 위치'}
      </button>
      {notice && <p className="search-bar__notice">{notice}</p>}
    </div>
  )
}
